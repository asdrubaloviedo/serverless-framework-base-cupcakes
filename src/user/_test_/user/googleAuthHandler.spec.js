jest.mock(
    '@user/services/user/GoogleAuthUser',
    () => ({
        execute: jest.fn()
    })
);

const GoogleAuthUser = require(
    '@user/services/user/GoogleAuthUser'
);

const { handler } = require(
    '@user/handlers/google-auth'
);

const token = 'valid-test-token-123456789';

const event = (body) => ({
    httpMethod: 'POST',
    path: '/cupcakeslife/usuarios/google-auth',
    body: JSON.stringify(body)
});

beforeEach(() => {
    jest.resetAllMocks();
});

describe('Google Auth Handler', () => {

    test('login válido: responde 200', async () => {

        GoogleAuthUser.execute.mockResolvedValue({
            success: true,
            action: 'login',
            email: 'a@example.com'
        });

        const result = await handler(
            event({
                idToken: token,
                action: 'login'
            })
        );

        expect(result.statusCode).toBe(200);

        expect(JSON.parse(result.body)).toEqual({
            success: true,
            action: 'login',
            email: 'a@example.com'
        });

        expect(
            GoogleAuthUser.execute
        ).toHaveBeenCalledWith({
            idToken: token,
            action: 'login'
        });
    });


    test('registro válido: responde 200', async () => {

        GoogleAuthUser.execute.mockResolvedValue({
            success: true,
            action: 'register',
            email: 'a@example.com'
        });

        const result = await handler(
            event({
                idToken: token,
                action: 'register',
                nombre: 'Ana López'
            })
        );

        expect(result.statusCode).toBe(200);

        expect(JSON.parse(result.body)).toMatchObject({
            success: true,
            action: 'register'
        });

        expect(
            GoogleAuthUser.execute
        ).toHaveBeenCalledWith({
            idToken: token,
            action: 'register',
            nombre: 'Ana López'
        });
    });


    test.each([
        [404, 'No existe una cuenta registrada con este correo'],
        [409, 'Este correo ya se encuentra registrado'],
        [401, 'Token de Firebase inválido o expirado'],
        [403, 'Se requiere una cuenta de Google verificada'],
        [502, 'No fue posible completar la operación']
    ])('error de negocio: HTTP %s', async (
        statusCode,
        message
    ) => {

        GoogleAuthUser.execute.mockRejectedValue({
            statusCode,
            message
        });

        const result = await handler(
            event({
                idToken: token,
                action: statusCode === 409
                    ? 'register'
                    : 'login'
            })
        );

        expect(result.statusCode).toBe(statusCode);

        expect(JSON.parse(result.body)).toEqual({
            message
        });
    });


    test.each([
        [{ action: 'login' }],
        [{ idToken: token }],
        [{ idToken: 'short', action: 'login' }],
        [{ idToken: token, action: 'delete' }],
        [{
            idToken: token,
            action: 'login',
            email: 'forged@example.com'
        }],
        [{
            idToken: token,
            action: 'register',
            nombre: 'a'.repeat(51)
        }]
    ])('solicitud inválida: responde 400', async (body) => {

        const result = await handler(event(body));

        expect(result.statusCode).toBe(400);

        expect(
            GoogleAuthUser.execute
        ).not.toHaveBeenCalled();
    });


    test('solicitud sin body: responde 400', async () => {

        const result = await handler({});

        expect(result.statusCode).toBe(400);

        expect(
            GoogleAuthUser.execute
        ).not.toHaveBeenCalled();
    });


    test('JSON inválido: responde 400', async () => {

        const result = await handler({
            body: '{invalid'
        });

        expect(result.statusCode).toBe(400);

        expect(JSON.parse(result.body)).toEqual({
            message: 'JSON inválido'
        });

        expect(
            GoogleAuthUser.execute
        ).not.toHaveBeenCalled();
    });


    test('acepta un body previamente convertido a objeto', async () => {

        GoogleAuthUser.execute.mockResolvedValue({
            success: true,
            action: 'login',
            email: 'a@example.com'
        });

        const result = await handler({
            body: {
                idToken: token,
                action: 'login'
            }
        });

        expect(result.statusCode).toBe(200);
    });


    test('error inesperado: responde 500 sin exponer detalles', async () => {

        GoogleAuthUser.execute.mockRejectedValue(
            new Error('Sensitive internal error')
        );

        const result = await handler(
            event({
                idToken: token,
                action: 'login'
            })
        );

        expect(result.statusCode).toBe(500);

        expect(JSON.parse(result.body)).toEqual({
            message: 'Error interno del servidor'
        });
    });
});