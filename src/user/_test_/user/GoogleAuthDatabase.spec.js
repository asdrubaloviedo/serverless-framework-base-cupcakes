
jest.mock('@db/db', () => ({
    tx: jest.fn()
}));

jest.mock(
    '@user/repositories',
    () => ({
        UserRepository: jest.fn()
    })
);

jest.mock(
    '@user/services/user/LegalAcceptanceService',
    () => ({
        validateRegistrationDocuments: jest.fn(),
        registerInitialAcceptances: jest.fn()
    })
);

const db = require('@db/db');

const { UserRepository } = require(
    '@user/repositories'
);

const LegalAcceptanceService = require(
    '@user/services/user/LegalAcceptanceService'
);

const GoogleAuthDatabase = require(
    '@user/services/user/GoogleAuthDatabase'
);

const existsByEmail = jest.fn();
const existsByFirebaseUid = jest.fn();
const registerGoogle = jest.fn();

const transaction = {};

const email = 'user@example.com';

const firebaseUid = 'AbCdEf123FirebaseUID';

const documentoLegalIds = [12, 35];

const loginParams = {
    action: 'login',
    email,
    firebaseUid
};

const registerParams = {
    action: 'register',
    email,
    firebaseUid,
    nombre: 'Ana López',
    documentoLegalIds
};

beforeEach(() => {

    jest.resetAllMocks();

    UserRepository.mockImplementation(() => ({
        existsByEmail,
        existsByFirebaseUid,
        registerGoogle
    }));

    db.tx.mockImplementation(async callback => {
        return callback(transaction);
    });

    existsByFirebaseUid.mockResolvedValue(true);

    registerGoogle.mockResolvedValue([
        {
            usuario_id: 42
        }
    ]);

    LegalAcceptanceService.validateRegistrationDocuments
        .mockResolvedValue(undefined);

    LegalAcceptanceService.registerInitialAcceptances
        .mockResolvedValue(undefined);
});

describe('GoogleAuthDatabase', () => {

    describe('Validaciones existentes readaptadas', () => {

        test('login existente: permite acceso sin insertar', async () => {

            existsByFirebaseUid.mockResolvedValue(true);

            await expect(
                GoogleAuthDatabase.execute(loginParams)
            ).resolves.toEqual({
                success: true,
                action: 'login',
                email
            });

            expect(existsByFirebaseUid)
                .toHaveBeenCalledWith({
                    firebaseUid
                });

            expect(existsByEmail)
                .not.toHaveBeenCalled();

            expect(registerGoogle)
                .not.toHaveBeenCalled();
        });

        test('login inexistente: responde 404 sin insertar', async () => {

            existsByFirebaseUid.mockResolvedValue(false);

            await expect(
                GoogleAuthDatabase.execute(loginParams)
            ).rejects.toEqual({
                statusCode: 404,
                message: 'No existe una cuenta registrada con este correo'
            });

            expect(registerGoogle)
                .not.toHaveBeenCalled();
        });

        test('registro nuevo: crea usuario correctamente', async () => {

            await expect(
                GoogleAuthDatabase.execute(registerParams)
            ).resolves.toEqual({
                success: true,
                action: 'register',
                email
            });

            expect(
                LegalAcceptanceService.validateRegistrationDocuments
            ).toHaveBeenCalledWith({
                documentoLegalIds,
                transaction
            });

            expect(registerGoogle)
                .toHaveBeenCalledWith({
                    nombre: 'Ana López',
                    email,
                    firebaseUid,
                    transaction
                });

            expect(
                LegalAcceptanceService.registerInitialAcceptances
            ).toHaveBeenCalledWith({
                usuarioId: 42,
                documentoLegalIds,
                metodoAceptacion: 'google',
                transaction
            });

            expect(existsByEmail)
                .not.toHaveBeenCalled();

            expect(existsByFirebaseUid)
                .not.toHaveBeenCalled();
        });

        test('registro duplicado: responde 409', async () => {

            registerGoogle.mockResolvedValue([]);

            await expect(
                GoogleAuthDatabase.execute(registerParams)
            ).rejects.toEqual({
                statusCode: 409,
                message: 'Este correo ya se encuentra registrado'
            });

            expect(
                LegalAcceptanceService.registerInitialAcceptances
            ).not.toHaveBeenCalled();
        });

        test('operación desconocida: responde 400', async () => {

            await expect(
                GoogleAuthDatabase.execute({
                    action: 'delete',
                    email,
                    firebaseUid
                })
            ).rejects.toEqual({
                statusCode: 400,
                message: 'Operación no válida'
            });

            expect(existsByEmail)
                .not.toHaveBeenCalled();

            expect(existsByFirebaseUid)
                .not.toHaveBeenCalled();

            expect(registerGoogle)
                .not.toHaveBeenCalled();

            expect(db.tx)
                .not.toHaveBeenCalled();
        });

        test('error PostgreSQL durante login: se propaga', async () => {

            existsByFirebaseUid.mockRejectedValue(
                new Error('DB unavailable')
            );

            await expect(
                GoogleAuthDatabase.execute(loginParams)
            ).rejects.toThrow('DB unavailable');
        });

        test('error PostgreSQL durante registro: se propaga', async () => {

            registerGoogle.mockRejectedValue(
                new Error('DB unavailable')
            );

            await expect(
                GoogleAuthDatabase.execute(registerParams)
            ).rejects.toThrow('DB unavailable');

            expect(
                LegalAcceptanceService.registerInitialAcceptances
            ).not.toHaveBeenCalled();
        });
    });

    describe('Inicio de sesión mediante Firebase UID', () => {

        test('identifica al usuario exclusivamente mediante Firebase UID', async () => {

            await GoogleAuthDatabase.execute(loginParams);

            expect(existsByFirebaseUid)
                .toHaveBeenCalledTimes(1);

            expect(existsByFirebaseUid)
                .toHaveBeenCalledWith({
                    firebaseUid
                });

            expect(existsByEmail)
                .not.toHaveBeenCalled();
        });

        test('no permite acceso por coincidencia de correo si el UID no existe', async () => {

            existsByEmail.mockResolvedValue(true);

            existsByFirebaseUid.mockResolvedValue(false);

            await expect(
                GoogleAuthDatabase.execute(loginParams)
            ).rejects.toMatchObject({
                statusCode: 404
            });

            expect(existsByEmail)
                .not.toHaveBeenCalled();

            expect(registerGoogle)
                .not.toHaveBeenCalled();
        });

        test('conserva mayúsculas y minúsculas del Firebase UID', async () => {

            const originalUid = 'AbCdEf123XyZ';

            await GoogleAuthDatabase.execute({
                ...loginParams,
                firebaseUid: originalUid
            });

            expect(existsByFirebaseUid)
                .toHaveBeenCalledWith({
                    firebaseUid: originalUid
                });
        });

        test('login no inicia transacciones ni registra aceptaciones', async () => {

            await GoogleAuthDatabase.execute(loginParams);

            expect(db.tx)
                .not.toHaveBeenCalled();

            expect(registerGoogle)
                .not.toHaveBeenCalled();

            expect(
                LegalAcceptanceService.validateRegistrationDocuments
            ).not.toHaveBeenCalled();

            expect(
                LegalAcceptanceService.registerInitialAcceptances
            ).not.toHaveBeenCalled();
        });

        test('conserva el contrato anterior de respuesta del login', async () => {

            const result =
                await GoogleAuthDatabase.execute(loginParams);

            expect(result).toEqual({
                success: true,
                action: 'login',
                email
            });

            expect(result)
                .not.toHaveProperty('firebaseUid');

            expect(result)
                .not.toHaveProperty('firebase_uid');
        });
    });

    describe('Validación de Firebase UID', () => {

        const invalidUids = [
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['espacios en blanco', '   '],
            ['número', 12345],
            ['booleano', true],
            ['objeto', {}],
            ['más de 128 caracteres', 'A'.repeat(129)]
        ];

        describe.each([
            'login',
            'register'
        ])('operación %s', action => {

            test.each(invalidUids)(
                'rechaza Firebase UID inválido: %s',
                async (description, invalidUid) => {

                    await expect(
                        GoogleAuthDatabase.execute({
                            ...registerParams,
                            action,
                            firebaseUid: invalidUid
                        })
                    ).rejects.toEqual({
                        statusCode: 401,
                        message: 'Identidad de usuario no válida'
                    });

                    expect(existsByEmail)
                        .not.toHaveBeenCalled();

                    expect(existsByFirebaseUid)
                        .not.toHaveBeenCalled();

                    expect(registerGoogle)
                        .not.toHaveBeenCalled();

                    expect(db.tx)
                        .not.toHaveBeenCalled();

                    expect(
                        LegalAcceptanceService.validateRegistrationDocuments
                    ).not.toHaveBeenCalled();

                    expect(
                        LegalAcceptanceService.registerInitialAcceptances
                    ).not.toHaveBeenCalled();
                }
            );
        });

        test.each([
            'login',
            'register'
        ])('acepta un UID de 128 caracteres durante %s', async action => {

            const maximumUid = 'A'.repeat(128);

            await expect(
                GoogleAuthDatabase.execute({
                    ...registerParams,
                    action,
                    firebaseUid: maximumUid
                })
            ).resolves.toEqual({
                success: true,
                action,
                email
            });

            if (action === 'login') {

                expect(existsByFirebaseUid)
                    .toHaveBeenCalledWith({
                        firebaseUid: maximumUid
                    });

            } else {

                expect(registerGoogle)
                    .toHaveBeenCalledWith({
                        nombre: registerParams.nombre,
                        email,
                        firebaseUid: maximumUid,
                        transaction
                    });
            }
        });
    });

    describe('Validación de documentos legales', () => {

        test.each([
            400,
            409,
            503
        ])('propaga el error legal %i antes de crear el usuario', async statusCode => {

            const error = {
                statusCode,
                message: 'Error de validación legal'
            };

            LegalAcceptanceService.validateRegistrationDocuments
                .mockRejectedValue(error);

            await expect(
                GoogleAuthDatabase.execute(registerParams)
            ).rejects.toBe(error);

            expect(db.tx)
                .toHaveBeenCalledTimes(1);

            expect(registerGoogle)
                .not.toHaveBeenCalled();

            expect(
                LegalAcceptanceService.registerInitialAcceptances
            ).not.toHaveBeenCalled();
        });

        test('propaga errores inesperados durante la validación legal', async () => {

            const error = new Error(
                'Legal validation failed'
            );

            LegalAcceptanceService.validateRegistrationDocuments
                .mockRejectedValue(error);

            await expect(
                GoogleAuthDatabase.execute(registerParams)
            ).rejects.toBe(error);

            expect(registerGoogle)
                .not.toHaveBeenCalled();

            expect(
                LegalAcceptanceService.registerInitialAcceptances
            ).not.toHaveBeenCalled();
        });

        test('utiliza los identificadores de futuras versiones legales', async () => {

            const updatedDocumentIds = [48, 52];

            await GoogleAuthDatabase.execute({
                ...registerParams,
                documentoLegalIds: updatedDocumentIds
            });

            expect(
                LegalAcceptanceService.validateRegistrationDocuments
            ).toHaveBeenCalledWith({
                documentoLegalIds: updatedDocumentIds,
                transaction
            });

            expect(
                LegalAcceptanceService.registerInitialAcceptances
            ).toHaveBeenCalledWith({
                usuarioId: 42,
                documentoLegalIds: updatedDocumentIds,
                metodoAceptacion: 'google',
                transaction
            });
        });
    });

    describe('Registro de aceptaciones iniciales', () => {

        test('utiliza el identificador del usuario recién creado', async () => {

            registerGoogle.mockResolvedValue([
                {
                    usuario_id: 75
                }
            ]);

            await GoogleAuthDatabase.execute(registerParams);

            expect(
                LegalAcceptanceService.registerInitialAcceptances
            ).toHaveBeenCalledWith({
                usuarioId: 75,
                documentoLegalIds,
                metodoAceptacion: 'google',
                transaction
            });
        });

        test('no permite sobrescribir el método de aceptación ni el usuario', async () => {

            await GoogleAuthDatabase.execute({
                ...registerParams,
                usuarioId: 99,
                metodoAceptacion: 'tradicional',
                fechaAceptacion: '2026-11-24T21:32:35Z'
            });

            expect(
                LegalAcceptanceService.registerInitialAcceptances
            ).toHaveBeenCalledWith({
                usuarioId: 42,
                documentoLegalIds,
                metodoAceptacion: 'google',
                transaction
            });
        });

        test.each([
            400,
            409,
            503
        ])('propaga el error %i durante el registro de aceptaciones', async statusCode => {

            const error = {
                statusCode,
                message: 'Error registrando aceptaciones legales'
            };

            LegalAcceptanceService.registerInitialAcceptances
                .mockRejectedValue(error);

            await expect(
                GoogleAuthDatabase.execute(registerParams)
            ).rejects.toBe(error);

            expect(registerGoogle)
                .toHaveBeenCalledTimes(1);

            expect(
                LegalAcceptanceService.registerInitialAcceptances
            ).toHaveBeenCalledTimes(1);
        });

        test('propaga errores inesperados durante la inserción de aceptaciones', async () => {

            const error = new Error(
                'Acceptance insert failed'
            );

            LegalAcceptanceService.registerInitialAcceptances
                .mockRejectedValue(error);

            await expect(
                GoogleAuthDatabase.execute(registerParams)
            ).rejects.toBe(error);
        });

        test('conserva el contrato anterior de respuesta del registro', async () => {

            const result =
                await GoogleAuthDatabase.execute(registerParams);

            expect(result).toEqual({
                success: true,
                action: 'register',
                email
            });

            expect(result)
                .not.toHaveProperty('firebaseUid');

            expect(result)
                .not.toHaveProperty('firebase_uid');
        });
    });

    describe('Transacciones y manejo de errores', () => {

        test('utiliza la misma transacción en todas las operaciones', async () => {

            await GoogleAuthDatabase.execute(registerParams);

            const validationParams =
                LegalAcceptanceService.validateRegistrationDocuments
                    .mock.calls[0][0];

            const creationParams =
                registerGoogle.mock.calls[0][0];

            const acceptanceParams =
                LegalAcceptanceService.registerInitialAcceptances
                    .mock.calls[0][0];

            expect(validationParams.transaction)
                .toBe(transaction);

            expect(creationParams.transaction)
                .toBe(transaction);

            expect(acceptanceParams.transaction)
                .toBe(transaction);

            expect(db.tx)
                .toHaveBeenCalledTimes(1);
        });

        test('ejecuta las operaciones en el orden correcto', async () => {

            await GoogleAuthDatabase.execute(registerParams);

            const validationOrder =
                LegalAcceptanceService.validateRegistrationDocuments
                    .mock.invocationCallOrder[0];

            const creationOrder =
                registerGoogle.mock.invocationCallOrder[0];

            const acceptanceOrder =
                LegalAcceptanceService.registerInitialAcceptances
                    .mock.invocationCallOrder[0];

            expect(validationOrder)
                .toBeLessThan(creationOrder);

            expect(creationOrder)
                .toBeLessThan(acceptanceOrder);
        });

        test('propaga el error si falla la transacción', async () => {

            const error = new Error(
                'Transaction failed'
            );

            db.tx.mockRejectedValue(error);

            await expect(
                GoogleAuthDatabase.execute(registerParams)
            ).rejects.toBe(error);

            expect(
                LegalAcceptanceService.validateRegistrationDocuments
            ).not.toHaveBeenCalled();

            expect(registerGoogle)
                .not.toHaveBeenCalled();

            expect(
                LegalAcceptanceService.registerInitialAcceptances
            ).not.toHaveBeenCalled();
        });

        test('propaga el error del callback transaccional cuando falla una aceptación', async () => {

            const error = new Error(
                'Acceptance transaction failed'
            );

            LegalAcceptanceService.registerInitialAcceptances
                .mockRejectedValue(error);

            db.tx.mockImplementation(async callback => {

                const transactionResult =
                    callback(transaction);

                await expect(transactionResult)
                    .rejects.toBe(error);

                return transactionResult;
            });

            await expect(
                GoogleAuthDatabase.execute(registerParams)
            ).rejects.toBe(error);

            expect(db.tx)
                .toHaveBeenCalledTimes(1);
        });
    });
});
