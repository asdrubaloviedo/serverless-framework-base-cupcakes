jest.mock(
    'aws-sdk',
    () => ({
        Lambda: jest.fn()
    })
);

jest.mock(
    '@user/services/user/LegalAuthDatabase',
    () => ({
        execute: jest.fn()
    })
);

const AWS = require('aws-sdk');

const LegalAuthDatabase = require(
    '@user/services/user/LegalAuthDatabase'
);

const LegalAuthLambdaService = require(
    '@user/services/user/LegalAuthLambdaService'
);

const invoke = jest.fn();

const promise = jest.fn();

const originalEnv = {
    ...process.env
};

const firebaseUid = 'AbCdEf123FirebaseUID';

const documentoLegalIds = [12, 35];

const registerParams = {
    action: 'register-traditional',
    nombre: 'Ana López',
    email: 'user@example.com',
    firebaseUid,
    pais: 'PER',
    documentoLegalIds
};

const pendingParams = {
    action: 'get-pending-acceptances',
    firebaseUid
};

const acceptanceParams = {
    action: 'register-acceptances',
    firebaseUid,
    documentoLegalIds
};

const registerResponse = {
    success: true,
    usuario: {
        id: 25,
        nombre: 'Ana López',
        email: 'user@example.com'
    }
};

const pendingResponse = {
    success: true,
    documentos: [
        { id: 12 },
        { id: 35 }
    ]
};

const acceptanceResponse = {
    success: true
};

const validOperations = [
    {
        action: 'register-traditional',
        params: registerParams,
        response: registerResponse
    },
    {
        action: 'get-pending-acceptances',
        params: pendingParams,
        response: pendingResponse
    },
    {
        action: 'register-acceptances',
        params: acceptanceParams,
        response: acceptanceResponse
    }
];

const internalError = {
    statusCode: 500,
    message: 'Error interno del servidor'
};

const invocationError = {
    statusCode: 502,
    message: 'No fue posible completar la operación'
};

const invalidResponseError = {
    statusCode: 502,
    message: 'Respuesta interna inválida'
};

const awsResponse = payload => ({
    StatusCode: 200,
    Payload: JSON.stringify(payload)
});

const expectNoAwsCalls = () => {

    expect(AWS.Lambda)
        .not.toHaveBeenCalled();

    expect(invoke)
        .not.toHaveBeenCalled();

    expect(promise)
        .not.toHaveBeenCalled();
};

let consoleErrorSpy;

beforeEach(() => {

    jest.resetAllMocks();

    process.env = {
        ...originalEnv,
        APP_STAGE: 'dev',
        IS_OFFLINE: 'false',
        AWS_REGION: 'us-east-2',
        LEGAL_AUTH_DB_FUNCTION:
            'hello-world-dev-legal-auth-db'
    };

    AWS.Lambda.mockImplementation(() => ({
        invoke
    }));

    invoke.mockReturnValue({
        promise
    });

    promise.mockResolvedValue(
        awsResponse(registerResponse)
    );

    LegalAuthDatabase.execute
        .mockResolvedValue(registerResponse);

    consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
});

afterEach(() => {

    process.env = {
        ...originalEnv
    };

    consoleErrorSpy.mockRestore();
});

describe('LegalAuthLambdaService', () => {

    describe('Ejecución directa en LOCAL y Serverless Offline', () => {

        describe.each(validOperations)(
            'operación $action',
            ({
                params,
                response
            }) => {

                test('LOCAL: ejecuta directamente el servicio de base de datos', async () => {

                    process.env.APP_STAGE = 'local';

                    LegalAuthDatabase.execute
                        .mockResolvedValue(response);

                    await expect(
                        LegalAuthLambdaService.execute(
                            params
                        )
                    ).resolves.toBe(response);

                    expect(
                        LegalAuthDatabase.execute
                    ).toHaveBeenCalledWith(params);

                    expect(
                        LegalAuthDatabase.execute
                    ).toHaveBeenCalledTimes(1);

                    expectNoAwsCalls();
                });

                test('Serverless Offline: ejecuta directamente el servicio de base de datos', async () => {

                    process.env.IS_OFFLINE = 'true';

                    LegalAuthDatabase.execute
                        .mockResolvedValue(response);

                    await expect(
                        LegalAuthLambdaService.execute(
                            params
                        )
                    ).resolves.toBe(response);

                    expect(
                        LegalAuthDatabase.execute
                    ).toHaveBeenCalledWith(params);

                    expect(
                        LegalAuthDatabase.execute
                    ).toHaveBeenCalledTimes(1);

                    expectNoAwsCalls();
                });

                test('LOCAL: funciona sin nombre de Lambda configurado', async () => {

                    process.env.APP_STAGE = 'local';

                    delete process.env
                        .LEGAL_AUTH_DB_FUNCTION;

                    LegalAuthDatabase.execute
                        .mockResolvedValue(response);

                    await expect(
                        LegalAuthLambdaService.execute(
                            params
                        )
                    ).resolves.toBe(response);

                    expect(
                        LegalAuthDatabase.execute
                    ).toHaveBeenCalledWith(params);

                    expectNoAwsCalls();
                });

                test('Serverless Offline: funciona sin nombre de Lambda configurado', async () => {

                    process.env.IS_OFFLINE = 'true';

                    delete process.env
                        .LEGAL_AUTH_DB_FUNCTION;

                    LegalAuthDatabase.execute
                        .mockResolvedValue(response);

                    await expect(
                        LegalAuthLambdaService.execute(
                            params
                        )
                    ).resolves.toBe(response);

                    expect(
                        LegalAuthDatabase.execute
                    ).toHaveBeenCalledWith(params);

                    expectNoAwsCalls();
                });
            }
        );

        test('prioriza Serverless Offline incluso cuando APP_STAGE es prod', async () => {

            process.env.APP_STAGE = 'prod';

            process.env.IS_OFFLINE = 'true';

            await expect(
                LegalAuthLambdaService.execute(
                    registerParams
                )
            ).resolves.toBe(registerResponse);

            expect(
                LegalAuthDatabase.execute
            ).toHaveBeenCalledWith(
                registerParams
            );

            expectNoAwsCalls();
        });

        test('LOCAL: funciona cuando IS_OFFLINE no está definido', async () => {

            process.env.APP_STAGE = 'local';

            delete process.env.IS_OFFLINE;

            await expect(
                LegalAuthLambdaService.execute(
                    registerParams
                )
            ).resolves.toBe(registerResponse);

            expectNoAwsCalls();
        });
    });

    describe('Ejecución remota en DEV y PROD', () => {

        describe.each([
            'dev',
            'prod'
        ])('ambiente %s', stage => {

            test.each(validOperations)(
                'invoca correctamente la Lambda interna durante $action',
                async ({
                    params,
                    response
                }) => {

                    process.env.APP_STAGE = stage;

                    const functionName =
                        `hello-world-${stage}-legal-auth-db`;

                    process.env.LEGAL_AUTH_DB_FUNCTION =
                        functionName;

                    promise.mockResolvedValue(
                        awsResponse(response)
                    );

                    await expect(
                        LegalAuthLambdaService.execute(
                            params
                        )
                    ).resolves.toEqual(response);

                    expect(AWS.Lambda)
                        .toHaveBeenCalledWith({
                            region: 'us-east-2',
                            maxRetries: 0,
                            httpOptions: {
                                connectTimeout: 3000,
                                timeout: 12000
                            }
                        });

                    expect(invoke)
                        .toHaveBeenCalledWith({
                            FunctionName: functionName,
                            InvocationType:
                                'RequestResponse',
                            Payload:
                                JSON.stringify(params)
                        });

                    expect(AWS.Lambda)
                        .toHaveBeenCalledTimes(1);

                    expect(invoke)
                        .toHaveBeenCalledTimes(1);

                    expect(promise)
                        .toHaveBeenCalledTimes(1);

                    expect(
                        LegalAuthDatabase.execute
                    ).not.toHaveBeenCalled();
                }
            );
        });

        test.each([
            undefined,
            '',
            'false',
            'TRUE',
            '1'
        ])('mantiene la ejecución remota cuando IS_OFFLINE=%p', async isOffline => {

            if (isOffline === undefined) {

                delete process.env.IS_OFFLINE;

            } else {

                process.env.IS_OFFLINE =
                    isOffline;
            }

            await expect(
                LegalAuthLambdaService.execute(
                    registerParams
                )
            ).resolves.toEqual(
                registerResponse
            );

            expect(invoke)
                .toHaveBeenCalledTimes(1);

            expect(
                LegalAuthDatabase.execute
            ).not.toHaveBeenCalled();
        });
    });

    describe('Configuración de AWS Lambda', () => {

        test.each([
            undefined,
            ''
        ])('utiliza la región predeterminada cuando AWS_REGION=%p', async region => {

            if (region === undefined) {

                delete process.env.AWS_REGION;

            } else {

                process.env.AWS_REGION =
                    region;
            }

            await LegalAuthLambdaService.execute(
                registerParams
            );

            expect(AWS.Lambda)
                .toHaveBeenCalledWith({
                    region: 'us-east-2',
                    maxRetries: 0,
                    httpOptions: {
                        connectTimeout: 3000,
                        timeout: 12000
                    }
                });
        });

        test('utiliza una región AWS personalizada', async () => {

            process.env.AWS_REGION =
                'us-west-2';

            await LegalAuthLambdaService.execute(
                registerParams
            );

            expect(AWS.Lambda)
                .toHaveBeenCalledWith({
                    region: 'us-west-2',
                    maxRetries: 0,
                    httpOptions: {
                        connectTimeout: 3000,
                        timeout: 12000
                    }
                });
        });

        test('utiliza exactamente el nombre de Lambda configurado', async () => {

            process.env.LEGAL_AUTH_DB_FUNCTION =
                'custom-legal-auth-function';

            await LegalAuthLambdaService.execute(
                registerParams
            );

            expect(invoke)
                .toHaveBeenCalledWith({
                    FunctionName:
                        'custom-legal-auth-function',
                    InvocationType:
                        'RequestResponse',
                    Payload:
                        JSON.stringify(registerParams)
                });
        });

        test.each([
            undefined,
            ''
        ])('responde 500 cuando LEGAL_AUTH_DB_FUNCTION=%p', async functionName => {

            if (functionName === undefined) {

                delete process.env
                    .LEGAL_AUTH_DB_FUNCTION;

            } else {

                process.env.LEGAL_AUTH_DB_FUNCTION =
                    functionName;
            }

            await expect(
                LegalAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toEqual(internalError);

            expect(consoleErrorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuth] Lambda interna no configurada'
                );

            expectNoAwsCalls();

            expect(
                LegalAuthDatabase.execute
            ).not.toHaveBeenCalled();
        });

        test('no utiliza la configuración de la Lambda Google como alternativa', async () => {

            delete process.env
                .LEGAL_AUTH_DB_FUNCTION;

            process.env.GOOGLE_AUTH_DB_FUNCTION =
                'hello-world-dev-google-auth-db';

            await expect(
                LegalAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toEqual(internalError);

            expectNoAwsCalls();

            expect(
                LegalAuthDatabase.execute
            ).not.toHaveBeenCalled();
        });
    });

    describe('Transmisión del Firebase UID', () => {

        describe.each(validOperations)(
            'operación $action',
            ({
                params,
                response
            }) => {

                test.each([
                    'A',
                    'AbCdEf123XyZ',
                    'A'.repeat(128)
                ])('conserva el Firebase UID durante la ejecución remota: %s', async originalUid => {

                    const requestParams = {
                        ...params,
                        firebaseUid: originalUid
                    };

                    promise.mockResolvedValue(
                        awsResponse(response)
                    );

                    await LegalAuthLambdaService.execute(
                        requestParams
                    );

                    const payload = JSON.parse(
                        invoke.mock.calls[0][0].Payload
                    );

                    expect(payload)
                        .toEqual(requestParams);

                    expect(payload.firebaseUid)
                        .toBe(originalUid);
                });

                test('conserva el Firebase UID durante la ejecución local', async () => {

                    process.env.APP_STAGE = 'local';

                    const originalUid =
                        'AbCdEf123XyZ';

                    const requestParams = {
                        ...params,
                        firebaseUid: originalUid
                    };

                    LegalAuthDatabase.execute
                        .mockResolvedValue(response);

                    await LegalAuthLambdaService.execute(
                        requestParams
                    );

                    expect(
                        LegalAuthDatabase.execute
                    ).toHaveBeenCalledWith(
                        requestParams
                    );

                    const payload =
                        LegalAuthDatabase.execute
                            .mock.calls[0][0];

                    expect(payload.firebaseUid)
                        .toBe(originalUid);

                    expectNoAwsCalls();
                });
            }
        );
    });

    describe('Transmisión de documentos legales', () => {

        const operationsWithDocuments =
            validOperations.filter(
                operation =>
                    operation.action !==
                        'get-pending-acceptances'
            );

        describe.each(operationsWithDocuments)(
            'operación $action',
            ({
                params,
                response
            }) => {

                test('transmite los documentos legales recibidos', async () => {

                    promise.mockResolvedValue(
                        awsResponse(response)
                    );

                    await LegalAuthLambdaService.execute(
                        params
                    );

                    const payload = JSON.parse(
                        invoke.mock.calls[0][0].Payload
                    );

                    expect(payload.documentoLegalIds)
                        .toEqual(documentoLegalIds);
                });

                test('transmite identificadores de futuras versiones legales', async () => {

                    const updatedDocumentIds =
                        [48, 52];

                    promise.mockResolvedValue(
                        awsResponse(response)
                    );

                    await LegalAuthLambdaService.execute({
                        ...params,
                        documentoLegalIds:
                            updatedDocumentIds
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
                        awsResponse(response)
                    );

                    await LegalAuthLambdaService.execute({
                        ...params,
                        documentoLegalIds:
                            documentIds
                    });

                    const payload = JSON.parse(
                        invoke.mock.calls[0][0].Payload
                    );

                    expect(payload.documentoLegalIds)
                        .toEqual([52, 48]);
                });

                test('LOCAL: transmite directamente los documentos legales', async () => {

                    process.env.APP_STAGE = 'local';

                    LegalAuthDatabase.execute
                        .mockResolvedValue(response);

                    await LegalAuthLambdaService.execute(
                        params
                    );

                    expect(
                        LegalAuthDatabase.execute
                    ).toHaveBeenCalledWith(params);

                    expectNoAwsCalls();
                });

                test('no modifica los parámetros originales durante la serialización', async () => {

                    const immutableParams =
                        Object.freeze({
                            ...params,
                            documentoLegalIds:
                                Object.freeze([
                                    ...documentoLegalIds
                                ])
                        });

                    promise.mockResolvedValue(
                        awsResponse(response)
                    );

                    await expect(
                        LegalAuthLambdaService.execute(
                            immutableParams
                        )
                    ).resolves.toEqual(response);

                    expect(immutableParams)
                        .toEqual(params);

                    const payload = JSON.parse(
                        invoke.mock.calls[0][0].Payload
                    );

                    expect(payload)
                        .toEqual(params);
                });
            }
        );

        test('no agrega documentos legales a la consulta de aceptaciones pendientes', async () => {

            promise.mockResolvedValue(
                awsResponse(pendingResponse)
            );

            await LegalAuthLambdaService.execute(
                pendingParams
            );

            const payload = JSON.parse(
                invoke.mock.calls[0][0].Payload
            );

            expect(payload)
                .toEqual(pendingParams);

            expect(payload)
                .not.toHaveProperty(
                    'documentoLegalIds'
                );
        });

        test('conserva los caracteres Unicode del nombre durante el registro tradicional', async () => {

            const nombre = 'María José Muñoz';

            await LegalAuthLambdaService.execute({
                ...registerParams,
                nombre
            });

            const payload = JSON.parse(
                invoke.mock.calls[0][0].Payload
            );

            expect(payload.nombre)
                .toBe(nombre);
        });
    });

    describe('Validación de respuestas exitosas', () => {

        describe.each(validOperations)(
            'operación $action',
            ({
                params,
                response
            }) => {

                test('acepta una respuesta JSON como cadena', async () => {

                    promise.mockResolvedValue(
                        awsResponse(response)
                    );

                    await expect(
                        LegalAuthLambdaService.execute(
                            params
                        )
                    ).resolves.toEqual(response);
                });

                test('acepta una respuesta JSON como Buffer', async () => {

                    promise.mockResolvedValue({
                        StatusCode: 200,
                        Payload: Buffer.from(
                            JSON.stringify(response)
                        )
                    });

                    await expect(
                        LegalAuthLambdaService.execute(
                            params
                        )
                    ).resolves.toEqual(response);
                });
            }
        );

        test('conserva una respuesta sin documentos legales pendientes', async () => {

            const response = {
                success: true,
                documentos: []
            };

            promise.mockResolvedValue(
                awsResponse(response)
            );

            await expect(
                LegalAuthLambdaService.execute(
                    pendingParams
                )
            ).resolves.toEqual(response);
        });

        test('conserva los caracteres Unicode de la respuesta interna', async () => {

            const response = {
                success: true,
                usuario: {
                    id: 25,
                    nombre: 'María José Muñoz'
                }
            };

            promise.mockResolvedValue({
                StatusCode: 200,
                Payload: Buffer.from(
                    JSON.stringify(response),
                    'utf8'
                )
            });

            await expect(
                LegalAuthLambdaService.execute(
                    registerParams
                )
            ).resolves.toEqual(response);
        });
    });

    describe('Validación de respuestas AWS inválidas', () => {

        const invalidAwsResponses = [
            ['respuesta undefined', undefined],
            ['respuesta null', null],
            ['respuesta vacía', {}],
            [
                'StatusCode ausente',
                {
                    Payload: '{}'
                }
            ],
            [
                'StatusCode 202',
                {
                    StatusCode: 202,
                    Payload: '{}'
                }
            ],
            [
                'StatusCode 400',
                {
                    StatusCode: 400,
                    Payload: '{}'
                }
            ],
            [
                'StatusCode 500',
                {
                    StatusCode: 500,
                    Payload: '{}'
                }
            ],
            [
                'StatusCode como cadena',
                {
                    StatusCode: '200',
                    Payload: '{}'
                }
            ],
            [
                'FunctionError Handled',
                {
                    StatusCode: 200,
                    FunctionError: 'Handled',
                    Payload: '{}'
                }
            ],
            [
                'FunctionError Unhandled',
                {
                    StatusCode: 200,
                    FunctionError: 'Unhandled',
                    Payload: '{}'
                }
            ],
            [
                'Payload ausente',
                {
                    StatusCode: 200
                }
            ],
            [
                'Payload null',
                {
                    StatusCode: 200,
                    Payload: null
                }
            ],
            [
                'Payload vacío',
                {
                    StatusCode: 200,
                    Payload: ''
                }
            ],
            [
                'Payload Buffer vacío',
                {
                    StatusCode: 200,
                    Payload: Buffer.alloc(0)
                }
            ],
            [
                'Payload JSON inválido',
                {
                    StatusCode: 200,
                    Payload: '{invalid-json'
                }
            ],
            [
                'Payload Buffer inválido',
                {
                    StatusCode: 200,
                    Payload: Buffer.from(
                        '{invalid-json'
                    )
                }
            ],
            [
                'Payload como objeto',
                {
                    StatusCode: 200,
                    Payload: {
                        success: true
                    }
                }
            ]
        ];

        test.each(invalidAwsResponses)(
            'responde 502 ante %s',
            async (
                description,
                response
            ) => {

                promise.mockResolvedValue(
                    response
                );

                await expect(
                    LegalAuthLambdaService.execute(
                        registerParams
                    )
                ).rejects.toEqual(
                    invocationError
                );

                expect(invoke)
                    .toHaveBeenCalledTimes(1);

                expect(promise)
                    .toHaveBeenCalledTimes(1);

                expect(consoleErrorSpy)
                    .toHaveBeenCalledTimes(1);

                expect(
                    LegalAuthDatabase.execute
                ).not.toHaveBeenCalled();
            }
        );
    });

    describe('Validación del contrato de respuesta interna', () => {

        const invalidPayloads = [
            ['null', null],
            ['objeto vacío', {}],
            ['arreglo vacío', []],
            ['booleano true', true],
            ['booleano false', false],
            ['número', 123],
            ['cadena', 'success'],
            [
                'success undefined',
                { success: undefined }
            ],
            [
                'success null',
                { success: null }
            ],
            [
                'success como cadena true',
                { success: 'true' }
            ],
            [
                'success como cadena false',
                { success: 'false' }
            ],
            [
                'success como número',
                { success: 1 }
            ],
            [
                'success como objeto',
                { success: {} }
            ],
            [
                'success como arreglo',
                { success: [] }
            ]
        ];

        test.each(invalidPayloads)(
            'responde 502 ante una estructura interna inválida: %s',
            async (
                description,
                payload
            ) => {

                promise.mockResolvedValue(
                    awsResponse(payload)
                );

                await expect(
                    LegalAuthLambdaService.execute(
                        registerParams
                    )
                ).rejects.toEqual(
                    invalidResponseError
                );

                expect(invoke)
                    .toHaveBeenCalledTimes(1);

                expect(consoleErrorSpy)
                    .not.toHaveBeenCalled();

                expect(
                    LegalAuthDatabase.execute
                ).not.toHaveBeenCalled();
            }
        );
    });

    describe('Propagación remota de errores de negocio permitidos', () => {

        const allowedBusinessErrors = [
            [400, 'Parámetros inválidos'],
            [401, 'Identidad de usuario no válida'],
            [403, 'Operación no permitida'],
            [404, 'Usuario no registrado'],
            [409, 'Conflicto de documentos legales'],
            [503, 'Servicio no disponible']
        ];

        describe.each(validOperations)(
            'operación $action',
            ({ params }) => {

                test.each(allowedBusinessErrors)(
                    'conserva el código y mensaje del error %i',
                    async (
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
                            LegalAuthLambdaService.execute(
                                params
                            )
                        ).rejects.toEqual({
                            statusCode,
                            message
                        });

                        expect(invoke)
                            .toHaveBeenCalledTimes(1);

                        expect(consoleErrorSpy)
                            .not.toHaveBeenCalled();

                        expect(
                            LegalAuthDatabase.execute
                        ).not.toHaveBeenCalled();
                    }
                );

                test('oculta los detalles internos de un error 500', async () => {

                    promise.mockResolvedValue(
                        awsResponse({
                            success: false,
                            statusCode: 500,
                            message:
                                'Sensitive database information'
                        })
                    );

                    await expect(
                        LegalAuthLambdaService.execute(
                            params
                        )
                    ).rejects.toEqual(
                        internalError
                    );
                });
            }
        );
    });

    describe('Normalización de códigos y mensajes de error', () => {

        const invalidStatusCodes = [
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['cadena 400', '400'],
            ['cadena 403', '403'],
            ['cadena 503', '503'],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', [400]],
            ['código 200', 200],
            ['código 402', 402],
            ['código 405', 405],
            ['código 422', 422],
            ['código 429', 429],
            ['código 502', 502],
            ['código 504', 504],
            ['código 999', 999]
        ];

        test.each(invalidStatusCodes)(
            'normaliza a 500 un código interno no permitido: %s',
            async (
                description,
                statusCode
            ) => {

                promise.mockResolvedValue(
                    awsResponse({
                        success: false,
                        statusCode,
                        message:
                            'Sensitive internal error'
                    })
                );

                await expect(
                    LegalAuthLambdaService.execute(
                        registerParams
                    )
                ).rejects.toEqual(
                    internalError
                );
            }
        );

        const invalidMessages = [
            ['undefined', undefined],
            ['null', null],
            ['número', 123],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['Internal error']]
        ];

        test.each(invalidMessages)(
            'utiliza un mensaje genérico cuando el mensaje interno es %s',
            async (
                description,
                message
            ) => {

                promise.mockResolvedValue(
                    awsResponse({
                        success: false,
                        statusCode: 409,
                        message
                    })
                );

                await expect(
                    LegalAuthLambdaService.execute(
                        acceptanceParams
                    )
                ).rejects.toEqual({
                    statusCode: 409,
                    message:
                        'Error interno del servidor'
                });
            }
        );

        test.each([
            400,
            401,
            403,
            404,
            409,
            503
        ])('conserva el código permitido %i cuando el mensaje está ausente', async statusCode => {

            promise.mockResolvedValue(
                awsResponse({
                    success: false,
                    statusCode
                })
            );

            await expect(
                LegalAuthLambdaService.execute(
                    acceptanceParams
                )
            ).rejects.toEqual({
                statusCode,
                message:
                    'Error interno del servidor'
            });
        });
    });

    describe('Propagación de errores durante la ejecución local', () => {

        const allowedStatusCodes = [
            400,
            401,
            403,
            404,
            409,
            500,
            503
        ];

        describe.each(validOperations)(
            'operación $action',
            ({ params }) => {

                test.each(allowedStatusCodes)(
                    'LOCAL: propaga directamente el error %i',
                    async statusCode => {

                        process.env.APP_STAGE =
                            'local';

                        const error = {
                            statusCode,
                            message:
                                'Controlled database error'
                        };

                        LegalAuthDatabase.execute
                            .mockRejectedValue(error);

                        await expect(
                            LegalAuthLambdaService.execute(
                                params
                            )
                        ).rejects.toBe(error);

                        expect(
                            LegalAuthDatabase.execute
                        ).toHaveBeenCalledTimes(1);

                        expectNoAwsCalls();
                    }
                );

                test('LOCAL: propaga una excepción inesperada', async () => {

                    process.env.APP_STAGE =
                        'local';

                    const error = new Error(
                        'Unexpected database error'
                    );

                    LegalAuthDatabase.execute
                        .mockRejectedValue(error);

                    await expect(
                        LegalAuthLambdaService.execute(
                            params
                        )
                    ).rejects.toBe(error);

                    expectNoAwsCalls();
                });

                test('Serverless Offline: propaga directamente un error controlado', async () => {

                    process.env.IS_OFFLINE =
                        'true';

                    const error = {
                        statusCode: 409,
                        message:
                            'Conflicto de documentos legales'
                    };

                    LegalAuthDatabase.execute
                        .mockRejectedValue(error);

                    await expect(
                        LegalAuthLambdaService.execute(
                            params
                        )
                    ).rejects.toBe(error);

                    expectNoAwsCalls();
                });
            }
        );
    });

    describe('Tratamiento de errores de comunicación con AWS', () => {

        const awsErrorCodes = [
            'NetworkingError',
            'TimeoutError',
            'AccessDeniedException',
            'ResourceNotFoundException',
            'TooManyRequestsException',
            'ServiceException',
            'ECONNRESET',
            'ETIMEDOUT'
        ];

        test.each(awsErrorCodes)(
            'responde 502 ante el error AWS %s',
            async code => {

                const error = Object.assign(
                    new Error(
                        'Sensitive AWS error'
                    ),
                    { code }
                );

                promise.mockRejectedValue(
                    error
                );

                await expect(
                    LegalAuthLambdaService.execute(
                        registerParams
                    )
                ).rejects.toEqual(
                    invocationError
                );

                expect(invoke)
                    .toHaveBeenCalledTimes(1);

                expect(promise)
                    .toHaveBeenCalledTimes(1);

                expect(consoleErrorSpy)
                    .toHaveBeenCalledWith(
                        '[LegalAuth] Error de invocación interna',
                        { code }
                    );

                expect(
                    LegalAuthDatabase.execute
                ).not.toHaveBeenCalled();
            }
        );

        test('responde 502 ante una excepción sin código', async () => {

            promise.mockRejectedValue(
                new Error(
                    'Unexpected AWS error'
                )
            );

            await expect(
                LegalAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toEqual(
                invocationError
            );

            expect(consoleErrorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuth] Error de invocación interna',
                    {
                        code: undefined
                    }
                );
        });

        test('controla una excepción síncrona durante lambda.invoke', async () => {

            invoke.mockImplementation(() => {

                throw Object.assign(
                    new Error(
                        'Invocation failed'
                    ),
                    {
                        code: 'InvocationError'
                    }
                );
            });

            await expect(
                LegalAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toEqual(
                invocationError
            );

            expect(invoke)
                .toHaveBeenCalledTimes(1);

            expect(promise)
                .not.toHaveBeenCalled();

            expect(consoleErrorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuth] Error de invocación interna',
                    {
                        code: 'InvocationError'
                    }
                );
        });

        test('controla una excepción síncrona durante promise()', async () => {

            promise.mockImplementation(() => {

                throw new Error(
                    'Promise initialization failed'
                );
            });

            await expect(
                LegalAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toEqual(
                invocationError
            );

            expect(invoke)
                .toHaveBeenCalledTimes(1);

            expect(promise)
                .toHaveBeenCalledTimes(1);
        });

        test('no ejecuta el servicio local como alternativa cuando falla AWS', async () => {

            promise.mockRejectedValue(
                new Error(
                    'AWS unavailable'
                )
            );

            await expect(
                LegalAuthLambdaService.execute(
                    acceptanceParams
                )
            ).rejects.toEqual(
                invocationError
            );

            expect(
                LegalAuthDatabase.execute
            ).not.toHaveBeenCalled();

            expect(invoke)
                .toHaveBeenCalledTimes(1);
        });
    });

    describe('Seguridad de logs y contrato de comunicación', () => {

        test('registra únicamente el código de error de AWS', async () => {

            const error = Object.assign(
                new Error(
                    'Sensitive internal information'
                ),
                {
                    code: 'AccessDeniedException',
                    requestId: 'internal-request-id',
                    stack: 'Sensitive stack trace'
                }
            );

            promise.mockRejectedValue(error);

            await expect(
                LegalAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toEqual(
                invocationError
            );

            expect(consoleErrorSpy)
                .toHaveBeenCalledTimes(1);

            expect(consoleErrorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuth] Error de invocación interna',
                    {
                        code: 'AccessDeniedException'
                    }
                );

            const logs = JSON.stringify(
                consoleErrorSpy.mock.calls
            );

            expect(logs)
                .not.toContain(error.message);

            expect(logs)
                .not.toContain(error.requestId);

            expect(logs)
                .not.toContain(error.stack);
        });

        test('no expone los parámetros de identidad en los logs de invocación', async () => {

            const error = Object.assign(
                new Error(
                    JSON.stringify(registerParams)
                ),
                {
                    code: 'NetworkingError'
                }
            );

            promise.mockRejectedValue(error);

            await expect(
                LegalAuthLambdaService.execute(
                    registerParams
                )
            ).rejects.toEqual(
                invocationError
            );

            const logs = JSON.stringify(
                consoleErrorSpy.mock.calls
            );

            expect(logs)
                .not.toContain(firebaseUid);

            expect(logs)
                .not.toContain(
                    registerParams.email
                );

            expect(logs)
                .not.toContain(
                    registerParams.nombre
                );

            expect(logs)
                .not.toContain(
                    error.message
                );
        });

        test.each(validOperations)(
            'no incorpora credenciales al payload recibido durante $action',
            async ({
                params,
                response
            }) => {

                promise.mockResolvedValue(
                    awsResponse(response)
                );

                await LegalAuthLambdaService.execute(
                    params
                );

                const payload = JSON.parse(
                    invoke.mock.calls[0][0].Payload
                );

                expect(payload)
                    .toEqual(params);

                expect(payload)
                    .not.toHaveProperty('idToken');

                expect(payload)
                    .not.toHaveProperty('token');

                expect(payload)
                    .not.toHaveProperty(
                        'authorization'
                    );

                expect(payload)
                    .not.toHaveProperty('password');
            }
        );

        test.each(validOperations)(
            'no agrega información interna a la respuesta durante $action',
            async ({
                params,
                response
            }) => {

                promise.mockResolvedValue(
                    awsResponse(response)
                );

                const result =
                    await LegalAuthLambdaService.execute(
                        params
                    );

                expect(result)
                    .toEqual(response);

                expect(result)
                    .not.toHaveProperty('idToken');

                expect(result)
                    .not.toHaveProperty('firebaseUid');

                expect(result)
                    .not.toHaveProperty('FunctionName');

                expect(result)
                    .not.toHaveProperty('Payload');

                expect(result)
                    .not.toHaveProperty('StatusCode');
            }
        );
    });
});