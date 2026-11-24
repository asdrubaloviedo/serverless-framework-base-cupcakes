jest.mock(
    '@user/services/user/GoogleAuthDatabase',
    () => ({
        execute: jest.fn()
    })
);

const GoogleAuthDatabase = require(
    '@user/services/user/GoogleAuthDatabase'
);

const { handler } = require(
    '@user/handlers/google-auth-db'
);

const email = 'user@example.com';

beforeEach(() => {
    jest.resetAllMocks();
});

describe('Google Auth Database Handler', () => {

    test('login válido: devuelve resultado exitoso', async () => {

        const response = {
            success: true,
            action: 'login',
            email
        };

        GoogleAuthDatabase.execute.mockResolvedValue(
            response
        );

        await expect(
            handler({
                action: 'login',
                email
            })
        ).resolves.toEqual(response);

        expect(
            GoogleAuthDatabase.execute
        ).toHaveBeenCalledWith({
            action: 'login',
            email
        });
    });


    test('registro válido: devuelve resultado exitoso', async () => {

        const response = {
            success: true,
            action: 'register',
            email
        };

        GoogleAuthDatabase.execute.mockResolvedValue(
            response
        );

        await expect(
            handler({
                action: 'register',
                email,
                nombre: 'Ana López'
            })
        ).resolves.toEqual(response);

        expect(
            GoogleAuthDatabase.execute
        ).toHaveBeenCalledWith({
            action: 'register',
            email,
            nombre: 'Ana López'
        });
    });


    test('normaliza el correo electrónico', async () => {

        GoogleAuthDatabase.execute.mockResolvedValue({
            success: true,
            action: 'login',
            email
        });

        await handler({
            action: 'login',
            email: '  USER@EXAMPLE.COM  '
        });

        expect(
            GoogleAuthDatabase.execute
        ).toHaveBeenCalledWith({
            action: 'login',
            email
        });
    });


    test('elimina espacios del nombre', async () => {

        await handler({
            action: 'register',
            email,
            nombre: '  Ana López  '
        });

        expect(
            GoogleAuthDatabase.execute
        ).toHaveBeenCalledWith({
            action: 'register',
            email,
            nombre: 'Ana López'
        });
    });


    test.each([
        [undefined],
        [null],
        [{}],
        [{ action: 'login' }],
        [{ action: 'login', email: 'invalid' }],
        [{ action: 'delete', email }],
        [{ action: 'register', email }],
        [{
            action: 'register',
            email,
            nombre: ''
        }],
        [{
            action: 'register',
            email,
            nombre: '   '
        }],
        [{
            action: 'login',
            email,
            nombre: 'Unexpected name'
        }],
        [{
            action: 'login',
            email,
            idToken: 'unexpected-token'
        }],
        [{
            action: 'register',
            email,
            nombre: 'Ana López',
            rol_id: 1
        }]
    ])('rechaza parámetros internos inválidos', async (
        event
    ) => {

        await expect(
            handler(event)
        ).resolves.toEqual({
            success: false,
            statusCode: 400,
            message: 'Parámetros internos inválidos'
        });

        expect(
            GoogleAuthDatabase.execute
        ).not.toHaveBeenCalled();
    });


    test.each([
        [400, 'Operación no válida'],
        [404, 'No existe una cuenta registrada con este correo'],
        [409, 'Este correo ya se encuentra registrado']
    ])('devuelve error de negocio: %s', async (
        statusCode,
        message
    ) => {

        GoogleAuthDatabase.execute.mockRejectedValue({
            statusCode,
            message
        });

        const event = statusCode === 409
            ? {
                action: 'register',
                email,
                nombre: 'Ana López'
            }
            : {
                action: 'login',
                email
            };

        await expect(
            handler(event)
        ).resolves.toEqual({
            success: false,
            statusCode,
            message
        });
    });


    test('error PostgreSQL: devuelve 500 sin detalles sensibles', async () => {

        GoogleAuthDatabase.execute.mockRejectedValue(
            new Error('Sensitive database error')
        );

        await expect(
            handler({
                action: 'login',
                email
            })
        ).resolves.toEqual({
            success: false,
            statusCode: 500,
            message: 'Error interno del servidor'
        });
    });


    test('error con código desconocido: devuelve 500', async () => {

        GoogleAuthDatabase.execute.mockRejectedValue({
            statusCode: 999,
            message: 'Unknown error'
        });

        await expect(
            handler({
                action: 'login',
                email
            })
        ).resolves.toEqual({
            success: false,
            statusCode: 500,
            message: 'Error interno del servidor'
        });
    });
});