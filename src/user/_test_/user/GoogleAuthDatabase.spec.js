jest.mock(
    '@user/repositories',
    () => ({
        UserRepository: jest.fn()
    })
);

const { UserRepository } = require(
    '@user/repositories'
);

const GoogleAuthDatabase = require(
    '@user/services/user/GoogleAuthDatabase'
);

const existsByEmail = jest.fn();
const registerGoogle = jest.fn();

const email = 'user@example.com';

beforeEach(() => {

    jest.resetAllMocks();

    UserRepository.mockImplementation(() => ({
        existsByEmail,
        registerGoogle
    }));
});

describe('GoogleAuthDatabase', () => {

    test('login existente: permite acceso sin insertar', async () => {

        existsByEmail.mockResolvedValue(true);

        await expect(
            GoogleAuthDatabase.execute({
                action: 'login',
                email
            })
        ).resolves.toEqual({
            success: true,
            action: 'login',
            email
        });

        expect(existsByEmail).toHaveBeenCalledWith({
            email
        });

        expect(registerGoogle).not.toHaveBeenCalled();
    });


    test('login inexistente: responde 404 sin insertar', async () => {

        existsByEmail.mockResolvedValue(false);

        await expect(
            GoogleAuthDatabase.execute({
                action: 'login',
                email
            })
        ).rejects.toEqual({
            statusCode: 404,
            message: 'No existe una cuenta registrada con este correo'
        });

        expect(registerGoogle).not.toHaveBeenCalled();
    });


    test('registro nuevo: crea usuario correctamente', async () => {

        registerGoogle.mockResolvedValue([
            {
                usuario_id: 42
            }
        ]);

        await expect(
            GoogleAuthDatabase.execute({
                action: 'register',
                email,
                nombre: 'Ana López'
            })
        ).resolves.toEqual({
            success: true,
            action: 'register',
            email
        });

        expect(registerGoogle).toHaveBeenCalledWith({
            nombre: 'Ana López',
            email
        });

        expect(existsByEmail).not.toHaveBeenCalled();
    });


    test('registro duplicado: responde 409', async () => {

        registerGoogle.mockResolvedValue([]);

        await expect(
            GoogleAuthDatabase.execute({
                action: 'register',
                email,
                nombre: 'Ana López'
            })
        ).rejects.toEqual({
            statusCode: 409,
            message: 'Este correo ya se encuentra registrado'
        });
    });


    test('operación desconocida: responde 400', async () => {

        await expect(
            GoogleAuthDatabase.execute({
                action: 'delete',
                email
            })
        ).rejects.toEqual({
            statusCode: 400,
            message: 'Operación no válida'
        });

        expect(existsByEmail).not.toHaveBeenCalled();
        expect(registerGoogle).not.toHaveBeenCalled();
    });


    test('error PostgreSQL durante login: se propaga', async () => {

        existsByEmail.mockRejectedValue(
            new Error('DB unavailable')
        );

        await expect(
            GoogleAuthDatabase.execute({
                action: 'login',
                email
            })
        ).rejects.toThrow('DB unavailable');
    });


    test('error PostgreSQL durante registro: se propaga', async () => {

        registerGoogle.mockRejectedValue(
            new Error('DB unavailable')
        );

        await expect(
            GoogleAuthDatabase.execute({
                action: 'register',
                email,
                nombre: 'Ana López'
            })
        ).rejects.toThrow('DB unavailable');
    });
});