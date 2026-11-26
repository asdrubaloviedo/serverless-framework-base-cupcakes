jest.mock(
    'aws-sdk',
    () => ({
        Lambda: jest.fn()
    })
);

jest.mock(
    '@user/services/user/GoogleAuthDatabase',
    () => ({
        execute: jest.fn()
    })
);

const AWS = require('aws-sdk');

const GoogleAuthDatabase = require(
    '@user/services/user/GoogleAuthDatabase'
);

const GoogleAuthLambdaService = require(
    '@user/services/user/GoogleAuthLambdaService'
);

const invoke = jest.fn();
const promise = jest.fn();

const originalEnv = {
    ...process.env
};

const firebaseUid = 'AbCdEf123FirebaseUID';

const documentoLegalIds = [12, 35];

const params = {
    action: 'login',
    email: 'user@example.com',
    firebaseUid
};

const registerParams = {
    action: 'register',
    email: 'user@example.com',
    firebaseUid,
    nombre: 'Nombre Google',
    documentoLegalIds
};

const successResponse = {
    success: true,
    action: 'login',
    email: 'user@example.com'
};

const registerSuccessResponse = {
    success: true,
    action: 'register',
    email: 'user@example.com'
};

const awsResponse = (payload) => ({
    StatusCode: 200,
    Payload: JSON.stringify(payload)
});

beforeEach(() => {

    jest.resetAllMocks();

    process.env = {
        ...originalEnv,
        APP_STAGE: 'dev',
        IS_OFFLINE: 'false',
        AWS_REGION: 'us-east-2',
        GOOGLE_AUTH_DB_FUNCTION:
            'hello-world-dev-google-auth-db'
    };

    AWS.Lambda.mockImplementation(() => ({
        invoke
    }));

    invoke.mockReturnValue({
        promise
    });

    promise.mockResolvedValue(
        awsResponse(successResponse)
    );
});

afterEach(() => {
    process.env = { ...originalEnv };
});

describe('GoogleAuthLambdaService', () => {

    describe('Validaciones existentes readaptadas', () => {

        test('LOCAL: ejecuta directamente el servicio de base de datos', async () => {

            process.env.APP_STAGE = 'local';

            GoogleAuthDatabase.execute.mockResolvedValue(
                successResponse
            );

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).resolves.toEqual(successResponse);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith(params);

            expect(AWS.Lambda).not.toHaveBeenCalled();
        });

        test('Serverless Offline: no realiza invocaciones AWS', async () => {

            process.env.IS_OFFLINE = 'true';

            GoogleAuthDatabase.execute.mockResolvedValue(
                successResponse
            );

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).resolves.toEqual(successResponse);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith(params);

            expect(AWS.Lambda).not.toHaveBeenCalled();
        });

        test('LOCAL: propaga errores de base de datos', async () => {

            process.env.APP_STAGE = 'local';

            GoogleAuthDatabase.execute.mockRejectedValue({
                statusCode: 404,
                message: 'Usuario no registrado'
            });

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).rejects.toMatchObject({
                statusCode: 404
            });

            expect(AWS.Lambda).not.toHaveBeenCalled();
        });

        test('DEV: invoca correctamente la Lambda interna', async () => {

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).resolves.toEqual(successResponse);

            expect(AWS.Lambda).toHaveBeenCalledWith({
                region: 'us-east-2',
                maxRetries: 0,
                httpOptions: {
                    connectTimeout: 3000,
                    timeout: 12000
                }
            });

            expect(invoke).toHaveBeenCalledWith({
                FunctionName:
                    'hello-world-dev-google-auth-db',
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(params)
            });

            expect(
                GoogleAuthDatabase.execute
            ).not.toHaveBeenCalled();
        });

        test('utiliza la región predeterminada cuando AWS_REGION no existe', async () => {

            delete process.env.AWS_REGION;

            await GoogleAuthLambdaService.execute(params);

            expect(AWS.Lambda).toHaveBeenCalledWith(
                expect.objectContaining({
                    region: 'us-east-2'
                })
            );
        });

        test('acepta un Payload recibido como Buffer', async () => {

            promise.mockResolvedValue({
                StatusCode: 200,
                Payload: Buffer.from(
                    JSON.stringify(successResponse)
                )
            });

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).resolves.toEqual(successResponse);
        });

        test('sin nombre de Lambda configurado: responde 500', async () => {

            delete process.env.GOOGLE_AUTH_DB_FUNCTION;

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).rejects.toMatchObject({
                statusCode: 500
            });

            expect(AWS.Lambda).not.toHaveBeenCalled();
        });

        test.each([
            [400, 'Parámetros internos inválidos'],
            [404, 'No existe una cuenta registrada con este correo'],
            [409, 'Este correo ya se encuentra registrado']
        ])('propaga error de negocio: %s', async (
            statusCode,
            message
        ) => {

            promise.mockResolvedValue(
                awsResponse({
                    success: false,
                    statusCode,
                    message
                })
            );

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).rejects.toEqual({
                statusCode,
                message
            });
        });

        test.each([
            [500],
            [999]
        ])('oculta detalles de errores internos: %s', async (
            statusCode
        ) => {

            promise.mockResolvedValue(
                awsResponse({
                    success: false,
                    statusCode,
                    message: 'Sensitive internal error'
                })
            );

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).rejects.toEqual({
                statusCode: 500,
                message: 'Error interno del servidor'
            });
        });

        test('error de comunicación con AWS: responde 502', async () => {

            promise.mockRejectedValue(
                new Error('Network timeout')
            );

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).rejects.toMatchObject({
                statusCode: 502
            });
        });

        test.each([
            [{
                StatusCode: 500,
                Payload: '{}'
            }],
            [{
                StatusCode: 200,
                FunctionError: 'Unhandled',
                Payload: '{}'
            }],
            [{
                StatusCode: 200
            }],
            [{
                StatusCode: 200,
                Payload: '{invalid'
            }]
        ])('respuesta AWS inválida: responde 502', async (
            response
        ) => {

            promise.mockResolvedValue(response);

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).rejects.toMatchObject({
                statusCode: 502
            });
        });

        test.each([
            [null],
            [{}],
            [{ success: 'true' }]
        ])('respuesta interna inválida: responde 502', async (
            payload
        ) => {

            promise.mockResolvedValue(
                awsResponse(payload)
            );

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).rejects.toEqual({
                statusCode: 502,
                message: 'Respuesta interna inválida'
            });
        });
    });

    describe('Transmisión de Firebase UID', () => {

        test.each([
            'local',
            'dev',
            'prod'
        ])('conserva el Firebase UID durante el login en %s', async stage => {

            process.env.APP_STAGE = stage;

            GoogleAuthDatabase.execute.mockResolvedValue(
                successResponse
            );

            await GoogleAuthLambdaService.execute(params);

            if (stage === 'local') {

                expect(
                    GoogleAuthDatabase.execute
                ).toHaveBeenCalledTimes(1);

                expect(
                    GoogleAuthDatabase.execute
                ).toHaveBeenCalledWith(params);

                expect(invoke).not.toHaveBeenCalled();

            } else {

                const invocation =
                    invoke.mock.calls[0][0];

                const payload =
                    JSON.parse(invocation.Payload);

                expect(payload).toEqual(params);

                expect(payload.firebaseUid)
                    .toBe(firebaseUid);

                expect(invoke).toHaveBeenCalledTimes(1);

                expect(
                    GoogleAuthDatabase.execute
                ).not.toHaveBeenCalled();
            }
        });

        test.each([
            'login',
            'register'
        ])('conserva mayúsculas y minúsculas del UID durante %s', async action => {

            const originalUid = 'AbCdEf123XyZ';

            const requestParams = {
                ...(action === 'login'
                    ? params
                    : registerParams),
                firebaseUid: originalUid
            };

            promise.mockResolvedValue(
                awsResponse(
                    action === 'login'
                        ? successResponse
                        : registerSuccessResponse
                )
            );

            await GoogleAuthLambdaService.execute(
                requestParams
            );

            const payload = JSON.parse(
                invoke.mock.calls[0][0].Payload
            );

            expect(payload.firebaseUid)
                .toBe(originalUid);
        });

        test.each([
            'login',
            'register'
        ])('transmite un UID de 128 caracteres durante %s', async action => {

            const maximumUid = 'A'.repeat(128);

            const requestParams = {
                ...(action === 'login'
                    ? params
                    : registerParams),
                firebaseUid: maximumUid
            };

            promise.mockResolvedValue(
                awsResponse(
                    action === 'login'
                        ? successResponse
                        : registerSuccessResponse
                )
            );

            await GoogleAuthLambdaService.execute(
                requestParams
            );

            const payload = JSON.parse(
                invoke.mock.calls[0][0].Payload
            );

            expect(payload.firebaseUid)
                .toBe(maximumUid);

            expect(payload.firebaseUid)
                .toHaveLength(128);
        });
    });

    describe('Documentos legales durante el registro', () => {

        test.each([
            'local',
            'dev',
            'prod'
        ])('transmite el registro completo en %s', async stage => {

            process.env.APP_STAGE = stage;

            GoogleAuthDatabase.execute.mockResolvedValue(
                registerSuccessResponse
            );

            promise.mockResolvedValue(
                awsResponse(registerSuccessResponse)
            );

            await expect(
                GoogleAuthLambdaService.execute(
                    registerParams
                )
            ).resolves.toEqual(registerSuccessResponse);

            if (stage === 'local') {

                expect(
                    GoogleAuthDatabase.execute
                ).toHaveBeenCalledWith(registerParams);

                expect(
                    GoogleAuthDatabase.execute
                ).toHaveBeenCalledTimes(1);

                expect(AWS.Lambda)
                    .not.toHaveBeenCalled();

            } else {

                const payload = JSON.parse(
                    invoke.mock.calls[0][0].Payload
                );

                expect(payload).toEqual({
                    action: 'register',
                    email: 'user@example.com',
                    firebaseUid,
                    nombre: 'Nombre Google',
                    documentoLegalIds
                });

                expect(invoke)
                    .toHaveBeenCalledTimes(1);

                expect(
                    GoogleAuthDatabase.execute
                ).not.toHaveBeenCalled();
            }
        });

        test('Serverless Offline: transmite los documentos legales directamente', async () => {

            process.env.IS_OFFLINE = 'true';

            GoogleAuthDatabase.execute.mockResolvedValue(
                registerSuccessResponse
            );

            await expect(
                GoogleAuthLambdaService.execute(
                    registerParams
                )
            ).resolves.toEqual(registerSuccessResponse);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith(registerParams);

            expect(AWS.Lambda)
                .not.toHaveBeenCalled();
        });

        test('transmite identificadores de futuras versiones legales', async () => {

            const updatedDocumentIds = [48, 52];

            promise.mockResolvedValue(
                awsResponse(registerSuccessResponse)
            );

            await GoogleAuthLambdaService.execute({
                ...registerParams,
                documentoLegalIds: updatedDocumentIds
            });

            const payload = JSON.parse(
                invoke.mock.calls[0][0].Payload
            );

            expect(payload.documentoLegalIds)
                .toEqual(updatedDocumentIds);
        });

        test('conserva el orden original de los documentos legales', async () => {

            const documentIds = [52, 48];

            promise.mockResolvedValue(
                awsResponse(registerSuccessResponse)
            );

            await GoogleAuthLambdaService.execute({
                ...registerParams,
                documentoLegalIds: documentIds
            });

            const payload = JSON.parse(
                invoke.mock.calls[0][0].Payload
            );

            expect(payload.documentoLegalIds)
                .toEqual([52, 48]);
        });

        test('conserva los caracteres Unicode del nombre durante el registro', async () => {

            const nombre = 'María José Muñoz';

            promise.mockResolvedValue(
                awsResponse(registerSuccessResponse)
            );

            await GoogleAuthLambdaService.execute({
                ...registerParams,
                nombre
            });

            const payload = JSON.parse(
                invoke.mock.calls[0][0].Payload
            );

            expect(payload.nombre).toBe(nombre);
        });

        test('no agrega documentos legales al payload de login', async () => {

            await GoogleAuthLambdaService.execute(params);

            const payload = JSON.parse(
                invoke.mock.calls[0][0].Payload
            );

            expect(payload).toEqual(params);

            expect(payload)
                .not.toHaveProperty('documentoLegalIds');

            expect(payload)
                .not.toHaveProperty('nombre');
        });

        test('no modifica los parámetros originales durante la serialización', async () => {

            const immutableParams = Object.freeze({
                ...registerParams,
                documentoLegalIds: Object.freeze([
                    ...documentoLegalIds
                ])
            });

            promise.mockResolvedValue(
                awsResponse(registerSuccessResponse)
            );

            await expect(
                GoogleAuthLambdaService.execute(
                    immutableParams
                )
            ).resolves.toEqual(registerSuccessResponse);

            expect(immutableParams)
                .toEqual(registerParams);

            const payload = JSON.parse(
                invoke.mock.calls[0][0].Payload
            );

            expect(payload).toEqual(registerParams);
        });
    });

    describe('Configuración de ejecución local y remota', () => {

        test('LOCAL: funciona sin configuración de la Lambda interna', async () => {

            process.env.APP_STAGE = 'local';

            delete process.env.GOOGLE_AUTH_DB_FUNCTION;

            GoogleAuthDatabase.execute.mockResolvedValue(
                successResponse
            );

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).resolves.toEqual(successResponse);

            expect(AWS.Lambda)
                .not.toHaveBeenCalled();

            expect(invoke)
                .not.toHaveBeenCalled();
        });

        test('Serverless Offline: funciona sin configuración de la Lambda interna', async () => {

            process.env.IS_OFFLINE = 'true';

            delete process.env.GOOGLE_AUTH_DB_FUNCTION;

            GoogleAuthDatabase.execute.mockResolvedValue(
                successResponse
            );

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).resolves.toEqual(successResponse);

            expect(AWS.Lambda)
                .not.toHaveBeenCalled();
        });

        test('PROD: utiliza el nombre de Lambda configurado para producción', async () => {

            process.env.APP_STAGE = 'prod';

            process.env.GOOGLE_AUTH_DB_FUNCTION =
                'hello-world-prod-google-auth-db';

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).resolves.toEqual(successResponse);

            expect(invoke).toHaveBeenCalledWith({
                FunctionName:
                    'hello-world-prod-google-auth-db',
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(params)
            });

            expect(
                GoogleAuthDatabase.execute
            ).not.toHaveBeenCalled();
        });

        test('utiliza una región AWS personalizada', async () => {

            process.env.AWS_REGION = 'us-west-2';

            await GoogleAuthLambdaService.execute(params);

            expect(AWS.Lambda).toHaveBeenCalledWith({
                region: 'us-west-2',
                maxRetries: 0,
                httpOptions: {
                    connectTimeout: 3000,
                    timeout: 12000
                }
            });
        });

        test('utiliza la región predeterminada cuando AWS_REGION está vacía', async () => {

            process.env.AWS_REGION = '';

            await GoogleAuthLambdaService.execute(params);

            expect(AWS.Lambda).toHaveBeenCalledWith(
                expect.objectContaining({
                    region: 'us-east-2'
                })
            );
        });

        test('rechaza una configuración vacía del nombre de Lambda', async () => {

            process.env.GOOGLE_AUTH_DB_FUNCTION = '';

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).rejects.toEqual({
                statusCode: 500,
                message: 'Error interno del servidor'
            });

            expect(AWS.Lambda)
                .not.toHaveBeenCalled();

            expect(invoke)
                .not.toHaveBeenCalled();
        });

        test('realiza una sola invocación síncrona de la Lambda interna', async () => {

            await GoogleAuthLambdaService.execute(params);

            expect(AWS.Lambda)
                .toHaveBeenCalledTimes(1);

            expect(invoke)
                .toHaveBeenCalledTimes(1);

            expect(promise)
                .toHaveBeenCalledTimes(1);

            expect(invoke).toHaveBeenCalledWith(
                expect.objectContaining({
                    InvocationType: 'RequestResponse'
                })
            );
        });
    });

    describe('Propagación de errores de identidad y documentos legales', () => {

        test.each([
            'login',
            'register'
        ])('propaga el error 401 de Firebase UID durante %s', async action => {

            const requestParams =
                action === 'login'
                    ? params
                    : registerParams;

            const error = {
                statusCode: 401,
                message: 'Identidad de usuario no válida'
            };

            promise.mockResolvedValue(
                awsResponse({
                    success: false,
                    ...error
                })
            );

            await expect(
                GoogleAuthLambdaService.execute(
                    requestParams
                )
            ).rejects.toEqual(error);
        });

        test.each([
            [400, 'Documentos legales inválidos'],
            [409, 'Los documentos legales han cambiado'],
            [503, 'Documentos legales no disponibles']
        ])('propaga el error legal %i durante el registro remoto', async (
            statusCode,
            message
        ) => {

            promise.mockResolvedValue(
                awsResponse({
                    success: false,
                    statusCode,
                    message
                })
            );

            await expect(
                GoogleAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toEqual({
                statusCode,
                message
            });

            expect(invoke)
                .toHaveBeenCalledTimes(1);

            expect(
                GoogleAuthDatabase.execute
            ).not.toHaveBeenCalled();
        });

        test.each([
            400,
            401,
            409,
            503
        ])('LOCAL: propaga sin modificar el error %i durante el registro', async statusCode => {

            process.env.APP_STAGE = 'local';

            const error = {
                statusCode,
                message: 'Internal legal operation error'
            };

            GoogleAuthDatabase.execute
                .mockRejectedValue(error);

            await expect(
                GoogleAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toBe(error);

            expect(AWS.Lambda)
                .not.toHaveBeenCalled();
        });

        test('oculta detalles de un error 500 durante el registro remoto', async () => {

            promise.mockResolvedValue(
                awsResponse({
                    success: false,
                    statusCode: 500,
                    message: 'Sensitive database information'
                })
            );

            await expect(
                GoogleAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toEqual({
                statusCode: 500,
                message: 'Error interno del servidor'
            });
        });

        test.each([
            403,
            422,
            429,
            502,
            '401',
            null,
            undefined
        ])('normaliza el código interno no permitido %s a 500', async statusCode => {

            promise.mockResolvedValue(
                awsResponse({
                    success: false,
                    statusCode,
                    message: 'Sensitive internal error'
                })
            );

            await expect(
                GoogleAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toEqual({
                statusCode: 500,
                message: 'Error interno del servidor'
            });
        });
    });

    describe('Validación adicional de respuestas remotas', () => {

        test.each([
            null,
            undefined,
            {
                StatusCode: 200,
                Payload: ''
            },
            {
                StatusCode: 200,
                Payload: null
            },
            {
                StatusCode: 200,
                Payload: Buffer.alloc(0)
            },
            {
                StatusCode: '200',
                Payload: '{}'
            },
            {
                StatusCode: 202,
                Payload: '{}'
            }
        ])('rechaza una respuesta AWS inválida adicional: %p', async response => {

            promise.mockResolvedValue(response);

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).rejects.toEqual({
                statusCode: 502,
                message: 'No fue posible completar la operación'
            });
        });

        test.each([
            false,
            true,
            [],
            'success',
            123,
            { success: null },
            { success: 1 }
        ])('rechaza una estructura interna inválida: %p', async payload => {

            promise.mockResolvedValue(
                awsResponse(payload)
            );

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).rejects.toEqual({
                statusCode: 502,
                message: 'Respuesta interna inválida'
            });
        });

        test.each([
            'NetworkingError',
            'TimeoutError',
            'AccessDeniedException',
            'ResourceNotFoundException',
            'TooManyRequestsException'
        ])('controla el error de invocación AWS %s', async code => {

            const error = Object.assign(
                new Error('Sensitive AWS error'),
                { code }
            );

            promise.mockRejectedValue(error);

            await expect(
                GoogleAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toEqual({
                statusCode: 502,
                message: 'No fue posible completar la operación'
            });

            expect(invoke)
                .toHaveBeenCalledTimes(1);

            expect(promise)
                .toHaveBeenCalledTimes(1);

            expect(
                GoogleAuthDatabase.execute
            ).not.toHaveBeenCalled();
        });

        test('controla un error síncrono durante lambda.invoke', async () => {

            invoke.mockImplementation(() => {
                throw new Error('Invocation failed');
            });

            await expect(
                GoogleAuthLambdaService.execute(params)
            ).rejects.toEqual({
                statusCode: 502,
                message: 'No fue posible completar la operación'
            });

            expect(promise)
                .not.toHaveBeenCalled();
        });
    });

    describe('Contrato de respuesta y payload interno', () => {

        test.each([
            'login',
            'register'
        ])('conserva el contrato de respuesta remota durante %s', async action => {

            const requestParams =
                action === 'login'
                    ? params
                    : registerParams;

            const response =
                action === 'login'
                    ? successResponse
                    : registerSuccessResponse;

            promise.mockResolvedValue(
                awsResponse(response)
            );

            const result =
                await GoogleAuthLambdaService.execute(
                    requestParams
                );

            expect(result).toEqual(response);

            expect(result)
                .not.toHaveProperty('firebaseUid');

            expect(result)
                .not.toHaveProperty('firebase_uid');

            expect(result)
                .not.toHaveProperty('documentoLegalIds');

            expect(result)
                .not.toHaveProperty('idToken');
        });

        test.each([
            'login',
            'register'
        ])('LOCAL: conserva el contrato de respuesta durante %s', async action => {

            process.env.APP_STAGE = 'local';

            const requestParams =
                action === 'login'
                    ? params
                    : registerParams;

            const response =
                action === 'login'
                    ? successResponse
                    : registerSuccessResponse;

            GoogleAuthDatabase.execute
                .mockResolvedValue(response);

            const result =
                await GoogleAuthLambdaService.execute(
                    requestParams
                );

            expect(result).toBe(response);

            expect(AWS.Lambda)
                .not.toHaveBeenCalled();
        });

        test.each([
            'login',
            'register'
        ])('no incorpora credenciales al payload recibido durante %s', async action => {

            const requestParams =
                action === 'login'
                    ? params
                    : registerParams;

            promise.mockResolvedValue(
                awsResponse(
                    action === 'login'
                        ? successResponse
                        : registerSuccessResponse
                )
            );

            await GoogleAuthLambdaService.execute(
                requestParams
            );

            const payload = JSON.parse(
                invoke.mock.calls[0][0].Payload
            );

            expect(payload).toEqual(requestParams);

            expect(payload)
                .not.toHaveProperty('idToken');

            expect(payload)
                .not.toHaveProperty('token');

            expect(payload)
                .not.toHaveProperty('authorization');

            expect(payload)
                .not.toHaveProperty('password');
        });

        test('acepta una respuesta de registro recibida como Buffer', async () => {

            promise.mockResolvedValue({
                StatusCode: 200,
                Payload: Buffer.from(
                    JSON.stringify(registerSuccessResponse)
                )
            });

            await expect(
                GoogleAuthLambdaService.execute(
                    registerParams
                )
            ).resolves.toEqual(registerSuccessResponse);
        });
    });
});