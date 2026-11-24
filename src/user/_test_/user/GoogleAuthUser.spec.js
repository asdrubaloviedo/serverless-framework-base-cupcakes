jest.mock(
    '@user/services/user/FirebaseAuthService',
    () => ({
        getAuth: jest.fn()
    })
);

jest.mock(
    '@user/services/user/GoogleAuthLambdaService',
    () => ({
        execute: jest.fn()
    })
);

const FirebaseAuthService = require(
    '@user/services/user/FirebaseAuthService'
);

const GoogleAuthLambdaService = require(
    '@user/services/user/GoogleAuthLambdaService'
);

const GoogleAuthUser = require(
    '@user/services/user/GoogleAuthUser'
);

const verifyIdToken = jest.fn();

const token = 'valid-test-token-123456789';

const decoded = {
    email: 'USER@EXAMPLE.COM',
    email_verified: true,
    name: 'Nombre Google',
    firebase: {
        sign_in_provider: 'google.com'
    }
};

beforeEach(() => {

    jest.resetAllMocks();

    FirebaseAuthService.getAuth.mockReturnValue({
        verifyIdToken
    });

    verifyIdToken.mockResolvedValue(decoded);
});

describe('GoogleAuthUser', () => {

    test('login válido: verifica identidad y delega operación', async () => {

        const response = {
            success: true,
            action: 'login',
            email: 'user@example.com'
        };

        GoogleAuthLambdaService.execute.mockResolvedValue(
            response
        );

        await expect(
            GoogleAuthUser.execute({
                idToken: token,
                action: 'login'
            })
        ).resolves.toEqual(response);

        expect(verifyIdToken).toHaveBeenCalledWith(
            token,
            true
        );

        expect(
            GoogleAuthLambdaService.execute
        ).toHaveBeenCalledWith({
            action: 'login',
            email: 'user@example.com'
        });
    });


    test('registro válido: utiliza el nombre recibido', async () => {

        GoogleAuthLambdaService.execute.mockResolvedValue({
            success: true,
            action: 'register',
            email: 'user@example.com'
        });

        await GoogleAuthUser.execute({
            idToken: token,
            action: 'register',
            nombre: 'Ana López'
        });

        expect(
            GoogleAuthLambdaService.execute
        ).toHaveBeenCalledWith({
            action: 'register',
            email: 'user@example.com',
            nombre: 'Ana López'
        });
    });


    test('registro sin nombre: utiliza el nombre de Firebase', async () => {

        await GoogleAuthUser.execute({
            idToken: token,
            action: 'register'
        });

        expect(
            GoogleAuthLambdaService.execute
        ).toHaveBeenCalledWith({
            action: 'register',
            email: 'user@example.com',
            nombre: 'Nombre Google'
        });
    });


    test('registro sin nombre de Firebase: utiliza el prefijo del correo', async () => {

        verifyIdToken.mockResolvedValue({
            ...decoded,
            name: undefined
        });

        await GoogleAuthUser.execute({
            idToken: token,
            action: 'register'
        });

        expect(
            GoogleAuthLambdaService.execute
        ).toHaveBeenCalledWith({
            action: 'register',
            email: 'user@example.com',
            nombre: 'user'
        });
    });


    test('normaliza espacios y mayúsculas del correo', async () => {

        verifyIdToken.mockResolvedValue({
            ...decoded,
            email: '  USER@EXAMPLE.COM  '
        });

        await GoogleAuthUser.execute({
            idToken: token,
            action: 'login'
        });

        expect(
            GoogleAuthLambdaService.execute
        ).toHaveBeenCalledWith({
            action: 'login',
            email: 'user@example.com'
        });
    });


    test('token inválido: 401 sin invocar la Lambda interna', async () => {

        verifyIdToken.mockRejectedValue(
            new Error('Invalid token')
        );

        await expect(
            GoogleAuthUser.execute({
                idToken: token,
                action: 'login'
            })
        ).rejects.toMatchObject({
            statusCode: 401
        });

        expect(
            GoogleAuthLambdaService.execute
        ).not.toHaveBeenCalled();
    });


    test('error al inicializar Firebase: 401', async () => {

        FirebaseAuthService.getAuth.mockImplementation(() => {
            throw new Error('Firebase unavailable');
        });

        await expect(
            GoogleAuthUser.execute({
                idToken: token,
                action: 'login'
            })
        ).rejects.toMatchObject({
            statusCode: 401
        });

        expect(
            GoogleAuthLambdaService.execute
        ).not.toHaveBeenCalled();
    });


    test.each([
        [{ ...decoded, email_verified: false }],
        [{ ...decoded, email: '' }],
        [{ ...decoded, email: null }],
        [{ ...decoded, firebase: undefined }],
        [{
            ...decoded,
            firebase: {
                sign_in_provider: 'password'
            }
        }]
    ])('identidad no válida: 403', async (claims) => {

        verifyIdToken.mockResolvedValue(claims);

        await expect(
            GoogleAuthUser.execute({
                idToken: token,
                action: 'login'
            })
        ).rejects.toMatchObject({
            statusCode: 403
        });

        expect(
            GoogleAuthLambdaService.execute
        ).not.toHaveBeenCalled();
    });


    test.each([
        [404, 'No existe una cuenta registrada con este correo'],
        [409, 'Este correo ya se encuentra registrado'],
        [500, 'Error interno del servidor'],
        [502, 'No fue posible completar la operación']
    ])('propaga error de la Lambda interna: %s', async (
        statusCode,
        message
    ) => {

        GoogleAuthLambdaService.execute.mockRejectedValue({
            statusCode,
            message
        });

        await expect(
            GoogleAuthUser.execute({
                idToken: token,
                action: 'login'
            })
        ).rejects.toEqual({
            statusCode,
            message
        });
    });
});