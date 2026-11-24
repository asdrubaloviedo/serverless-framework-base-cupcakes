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

const params = {
    action: 'login',
    email: 'user@example.com'
};

const successResponse = {
    success: true,
    action: 'login',
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
    process.env = originalEnv;
});

describe('GoogleAuthLambdaService', () => {

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