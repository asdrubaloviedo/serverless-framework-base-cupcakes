
jest.mock('@user/repositories', () => {

    const mockGetByFirebaseUid = jest.fn();
    const mockCreate = jest.fn();
    const mockUpdate = jest.fn();

    return {

        UserRepository: jest.fn().mockImplementation(() => ({

            getByFirebaseUid: mockGetByFirebaseUid,

            create: mockCreate,

            update: mockUpdate
        })),

        __mocks__: {

            mockGetByFirebaseUid,

            mockCreate,

            mockUpdate
        }
    };
});


jest.mock(
    '@user/services/user/LegalAcceptanceService',
    () => ({

        validateRegistrationDocuments: jest.fn(),

        registerInitialAcceptances: jest.fn(),

        registerPendingAcceptances: jest.fn()
    })
);


const {

    UserRepository,

    __mocks__

} = require('@user/repositories');


const LegalAcceptanceService = require(
    '@user/services/user/LegalAcceptanceService'
);


const GetUserProfile = require(
    '../../services/user/GetUserProfile'
);


describe('GetUserProfile Service', () => {

    const firebaseUid = 'AbCdEf123FirebaseUID';

    const validParams = {
        firebaseUid
    };

    const retrievedUser = [
        {
            usuario_id: 10,
            primer_nombre: 'Juan',
            segundo_nombre: 'Carlos',
            primer_apellido: 'indefinido',
            segundo_apellido: 'indefinido',
            pais: 'PER',
            edad: 1,
            sexo: 'i',
            email: 'usuario@example.com',
            avatar_id: 1,
            rol_id: 7,
            estado_id: 1,
            avatar_nombre: 'avatar_generico',
            avatar_url: 'https://example.com/avatar.png'
        }
    ];


    beforeEach(() => {

        jest.clearAllMocks();

        __mocks__.mockGetByFirebaseUid.mockReset();

        __mocks__.mockCreate.mockReset();

        __mocks__.mockUpdate.mockReset();

        __mocks__.mockGetByFirebaseUid
            .mockResolvedValue(retrievedUser);
    });


    /*
     * =====================================================
     * SUCCESSFUL PROFILE RETRIEVAL
     * =====================================================
     */

    describe('Consulta exitosa del perfil', () => {

        test('devuelve los datos del usuario autenticado', async () => {

            const result =
                await GetUserProfile.execute(validParams);

            expect(result).toEqual(retrievedUser);

            expect(result).toHaveLength(1);
        });


        test('devuelve la información del avatar', async () => {

            const result =
                await GetUserProfile.execute(validParams);

            expect(result[0]).toEqual(
                expect.objectContaining({

                    avatar_id: 1,

                    avatar_nombre: 'avatar_generico',

                    avatar_url:
                        'https://example.com/avatar.png'
                })
            );
        });


        test('conserva la respuesta original del repositorio', async () => {

            const result =
                await GetUserProfile.execute(validParams);

            expect(result).toBe(retrievedUser);
        });


        test('instancia el repositorio una sola vez', async () => {

            await GetUserProfile.execute(validParams);

            expect(UserRepository)
                .toHaveBeenCalledTimes(1);
        });


        test('consulta el usuario una sola vez', async () => {

            await GetUserProfile.execute(validParams);

            expect(__mocks__.mockGetByFirebaseUid)
                .toHaveBeenCalledTimes(1);
        });


        test('consulta exclusivamente mediante Firebase UID', async () => {

            await GetUserProfile.execute(validParams);

            expect(__mocks__.mockGetByFirebaseUid)
                .toHaveBeenCalledWith({
                    firebaseUid
                });
        });
    });


    /*
     * =====================================================
     * FIREBASE UID VALIDATION
     * =====================================================
     */

    describe('Validación del Firebase UID', () => {

        test.each([

            ['UID ausente', undefined],

            ['UID nulo', null],

            ['UID vacío', ''],

            ['UID con espacios', '   '],

            ['UID con tabulaciones', '\t\t'],

            ['UID con saltos de línea', '\n\n'],

            ['UID numérico', 12345],

            ['UID booleano', true],

            ['UID como objeto', {}],

            ['UID como arreglo', []],

            ['UID superior a 128 caracteres', 'a'.repeat(129)]

        ])('rechaza %s', async (description, invalidUid) => {

            await expect(

                GetUserProfile.execute({
                    firebaseUid: invalidUid
                })

            ).rejects.toEqual({

                statusCode: 401,

                message: 'Identidad de usuario no válida'
            });

            expect(UserRepository)
                .not.toHaveBeenCalled();

            expect(__mocks__.mockGetByFirebaseUid)
                .not.toHaveBeenCalled();
        });


        test('rechaza una solicitud sin parámetros', async () => {

            await expect(

                GetUserProfile.execute()

            ).rejects.toEqual({

                statusCode: 401,

                message: 'Identidad de usuario no válida'
            });

            expect(UserRepository)
                .not.toHaveBeenCalled();
        });


        test('rechaza un objeto de parámetros vacío', async () => {

            await expect(

                GetUserProfile.execute({})

            ).rejects.toEqual({

                statusCode: 401,

                message: 'Identidad de usuario no válida'
            });

            expect(UserRepository)
                .not.toHaveBeenCalled();
        });


        test('acepta un UID de un carácter', async () => {

            const minimumUid = 'A';

            await expect(

                GetUserProfile.execute({
                    firebaseUid: minimumUid
                })

            ).resolves.toEqual(retrievedUser);

            expect(__mocks__.mockGetByFirebaseUid)
                .toHaveBeenCalledWith({

                    firebaseUid: minimumUid
                });
        });


        test('acepta un UID de 128 caracteres', async () => {

            const maximumUid = 'A'.repeat(128);

            await expect(

                GetUserProfile.execute({
                    firebaseUid: maximumUid
                })

            ).resolves.toEqual(retrievedUser);

            expect(__mocks__.mockGetByFirebaseUid)
                .toHaveBeenCalledWith({

                    firebaseUid: maximumUid
                });
        });


        test('conserva mayúsculas y minúsculas del UID', async () => {

            const originalUid = 'AbCdEf123XyZ';

            await GetUserProfile.execute({

                firebaseUid: originalUid
            });

            expect(__mocks__.mockGetByFirebaseUid)
                .toHaveBeenCalledWith({

                    firebaseUid: originalUid
                });
        });


        test('no modifica ni normaliza el UID recibido', async () => {

            const originalUid = ' AbCdEf123XyZ ';

            await GetUserProfile.execute({

                firebaseUid: originalUid
            });

            expect(__mocks__.mockGetByFirebaseUid)
                .toHaveBeenCalledWith({

                    firebaseUid: originalUid
                });
        });
    });


    /*
     * =====================================================
     * IDENTITY ISOLATION
     * =====================================================
     */

    describe('Aislamiento de identidad', () => {

        test('no utiliza el correo recibido como parámetro adicional', async () => {

            await GetUserProfile.execute({

                firebaseUid,

                email: 'otro@example.com'
            });

            expect(__mocks__.mockGetByFirebaseUid)
                .toHaveBeenCalledWith({

                    firebaseUid
                });
        });


        test('no utiliza identificadores adicionales del usuario', async () => {

            await GetUserProfile.execute({

                firebaseUid,

                usuarioId: 999,

                usuario_id: 888,

                firebase_uid: 'OtherFirebaseUid'
            });

            expect(__mocks__.mockGetByFirebaseUid)
                .toHaveBeenCalledWith({

                    firebaseUid
                });
        });


        test('no utiliza identificadores de documentos legales', async () => {

            await GetUserProfile.execute({

                firebaseUid,

                documentoLegalIds: [12, 35]
            });

            expect(__mocks__.mockGetByFirebaseUid)
                .toHaveBeenCalledWith({

                    firebaseUid
                });
        });
    });


    /*
     * =====================================================
     * USER NOT FOUND
     * =====================================================
     */

    describe('Usuario no registrado', () => {

        test('devuelve error 404 si no existe el usuario', async () => {

            __mocks__.mockGetByFirebaseUid
                .mockResolvedValue([]);

            await expect(

                GetUserProfile.execute(validParams)

            ).rejects.toEqual({

                statusCode: 404,

                message: 'Usuario no registrado'
            });
        });


        test('no crea automáticamente un usuario inexistente', async () => {

            __mocks__.mockGetByFirebaseUid
                .mockResolvedValue([]);

            await expect(

                GetUserProfile.execute(validParams)

            ).rejects.toMatchObject({

                statusCode: 404
            });

            expect(__mocks__.mockCreate)
                .not.toHaveBeenCalled();

            expect(__mocks__.mockUpdate)
                .not.toHaveBeenCalled();
        });
    });


    /*
     * =====================================================
     * INVALID REPOSITORY RESPONSES
     * =====================================================
     */

    describe('Respuestas inválidas del repositorio', () => {

        test.each([

            ['respuesta nula', null],

            ['respuesta indefinida', undefined],

            ['respuesta como objeto', {}],

            ['respuesta como texto', 'invalid'],

            ['respuesta numérica', 123],

            ['respuesta booleana', false]

        ])('rechaza %s', async (description, invalidResponse) => {

            __mocks__.mockGetByFirebaseUid
                .mockResolvedValue(invalidResponse);

            await expect(

                GetUserProfile.execute(validParams)

            ).rejects.toEqual({

                statusCode: 500,

                message: 'Error interno del servidor'
            });
        });


        test('rechaza múltiples usuarios asociados al mismo UID', async () => {

            __mocks__.mockGetByFirebaseUid
                .mockResolvedValue([

                    retrievedUser[0],

                    {
                        ...retrievedUser[0],

                        usuario_id: 20,

                        email: 'otro@example.com'
                    }
                ]);

            await expect(

                GetUserProfile.execute(validParams)

            ).rejects.toEqual({

                statusCode: 500,

                message: 'Error interno del servidor'
            });
        });
    });


    /*
     * =====================================================
     * DATABASE ERRORS
     * =====================================================
     */

    describe('Errores del repositorio', () => {

        test('propaga errores inesperados de PostgreSQL', async () => {

            const error = new Error(
                'Database connection error'
            );

            __mocks__.mockGetByFirebaseUid
                .mockRejectedValue(error);

            await expect(

                GetUserProfile.execute(validParams)

            ).rejects.toBe(error);
        });


        test('propaga errores funcionales controlados', async () => {

            const error = {

                statusCode: 503,

                message: 'Servicio no disponible'
            };

            __mocks__.mockGetByFirebaseUid
                .mockRejectedValue(error);

            await expect(

                GetUserProfile.execute(validParams)

            ).rejects.toBe(error);
        });


        test('no reintenta automáticamente una consulta fallida', async () => {

            __mocks__.mockGetByFirebaseUid
                .mockRejectedValue(
                    new Error('Database error')
                );

            await expect(

                GetUserProfile.execute(validParams)

            ).rejects.toThrow('Database error');

            expect(__mocks__.mockGetByFirebaseUid)
                .toHaveBeenCalledTimes(1);
        });
    });


    /*
     * =====================================================
     * READ-ONLY OPERATION
     * =====================================================
     */

    describe('Operación exclusivamente de lectura', () => {

        test('no crea usuarios durante la consulta', async () => {

            await GetUserProfile.execute(validParams);

            expect(__mocks__.mockCreate)
                .not.toHaveBeenCalled();
        });


        test('no actualiza usuarios durante la consulta', async () => {

            await GetUserProfile.execute(validParams);

            expect(__mocks__.mockUpdate)
                .not.toHaveBeenCalled();
        });


        test('no valida documentos legales para registrar usuarios', async () => {

            await GetUserProfile.execute(validParams);

            expect(
                LegalAcceptanceService
                    .validateRegistrationDocuments
            ).not.toHaveBeenCalled();
        });


        test('no registra aceptaciones legales iniciales', async () => {

            await GetUserProfile.execute(validParams);

            expect(
                LegalAcceptanceService
                    .registerInitialAcceptances
            ).not.toHaveBeenCalled();
        });


        test('no registra aceptaciones legales posteriores', async () => {

            await GetUserProfile.execute(validParams);

            expect(
                LegalAcceptanceService
                    .registerPendingAcceptances
            ).not.toHaveBeenCalled();
        });


        test('no registra aceptaciones si el usuario no existe', async () => {

            __mocks__.mockGetByFirebaseUid
                .mockResolvedValue([]);

            await expect(

                GetUserProfile.execute(validParams)

            ).rejects.toMatchObject({

                statusCode: 404
            });

            expect(
                LegalAcceptanceService
                    .registerInitialAcceptances
            ).not.toHaveBeenCalled();

            expect(
                LegalAcceptanceService
                    .registerPendingAcceptances
            ).not.toHaveBeenCalled();
        });


        test('no modifica usuarios si ocurre un error de base de datos', async () => {

            __mocks__.mockGetByFirebaseUid
                .mockRejectedValue(
                    new Error('Database error')
                );

            await expect(

                GetUserProfile.execute(validParams)

            ).rejects.toThrow('Database error');

            expect(__mocks__.mockCreate)
                .not.toHaveBeenCalled();

            expect(__mocks__.mockUpdate)
                .not.toHaveBeenCalled();

            expect(
                LegalAcceptanceService
                    .registerInitialAcceptances
            ).not.toHaveBeenCalled();

            expect(
                LegalAcceptanceService
                    .registerPendingAcceptances
            ).not.toHaveBeenCalled();
        });
    });
});
