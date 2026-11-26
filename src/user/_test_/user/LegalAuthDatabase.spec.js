jest.mock(
    '@user/controller/user',
    () => ({
        createOneUser: jest.fn(),
        getUserProfile: jest.fn(),
        getPendingLegalAcceptances: jest.fn(),
        registerLegalAcceptances: jest.fn()
    })
);

const UserController = require(
    '@user/controller/user'
);

const LegalAuthDatabase = require(
    '@user/services/user/LegalAuthDatabase'
);

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

const profileParams = {
    action: 'get-user-profile',
    firebaseUid
};

const profileResponse = [{ usuario_id: 25, email: 'user@example.com', avatar_id: 1 }];

const pendingParams = {
    action: 'get-pending-acceptances',
    firebaseUid
};

const acceptanceParams = {
    action: 'register-acceptances',
    firebaseUid,
    documentoLegalIds
};

const usuario = {
    id: 25,
    nombre: 'Ana López',
    email: 'user@example.com'
};

const pendingResponse = {
    success: true,
    documentos: [
        {
            id: 12
        },
        {
            id: 35
        }
    ]
};

const acceptanceResponse = {
    success: true
};

const invalidOperationError = {
    statusCode: 400,
    message: 'Operación legal no válida'
};

const invalidEmailError = {
    statusCode: 400,
    message: 'Identidad de usuario no válida'
};

const invalidUidError = {
    statusCode: 401,
    message: 'Identidad de usuario no válida'
};

const validOperations = [
    {
        action: 'get-user-profile',
        params: profileParams,
        controllerMethod: 'getUserProfile'
    },
    {
        action: 'register-traditional',
        params: registerParams,
        controllerMethod: 'createOneUser'
    },
    {
        action: 'get-pending-acceptances',
        params: pendingParams,
        controllerMethod: 'getPendingLegalAcceptances'
    },
    {
        action: 'register-acceptances',
        params: acceptanceParams,
        controllerMethod: 'registerLegalAcceptances'
    }
];

const expectNoControllerCalls = () => {

    expect(UserController.getUserProfile).not.toHaveBeenCalled();

    expect(
        UserController.createOneUser
    ).not.toHaveBeenCalled();

    expect(
        UserController.getPendingLegalAcceptances
    ).not.toHaveBeenCalled();

    expect(
        UserController.registerLegalAcceptances
    ).not.toHaveBeenCalled();
};

beforeEach(() => {

    jest.resetAllMocks();

    UserController.getUserProfile.mockResolvedValue(profileResponse);

    UserController.createOneUser
        .mockResolvedValue(usuario);

    UserController.getPendingLegalAcceptances
        .mockResolvedValue(pendingResponse);

    UserController.registerLegalAcceptances
        .mockResolvedValue(acceptanceResponse);
});

describe('LegalAuthDatabase', () => {

    describe('Validación de operaciones autorizadas', () => {

        test('rechaza la ausencia de parámetros', async () => {

            await expect(
                LegalAuthDatabase.execute()
            ).rejects.toEqual(
                invalidOperationError
            );

            expectNoControllerCalls();
        });

        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['espacios en blanco', '   '],
            ['número', 12345],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['register-traditional']],
            ['login', 'login'],
            ['register', 'register'],
            ['delete', 'delete'],
            ['update', 'update'],
            ['mayúsculas', 'REGISTER-TRADITIONAL'],
            ['espacios externos', ' register-traditional ']
        ])('rechaza una operación no autorizada: %s', async (
            description,
            action
        ) => {

            await expect(
                LegalAuthDatabase.execute({
                    ...registerParams,
                    action
                })
            ).rejects.toEqual(
                invalidOperationError
            );

            expectNoControllerCalls();
        });

        test.each(validOperations)(
            'ejecuta exclusivamente el controlador correspondiente a $action',
            async ({
                params,
                controllerMethod
            }) => {

                await LegalAuthDatabase.execute(
                    params
                );

                expect(
                    UserController[controllerMethod]
                ).toHaveBeenCalledTimes(1);

                const methods = [
                    'createOneUser',
                    'getUserProfile',
                    'getPendingLegalAcceptances',
                    'registerLegalAcceptances'
                ];

                methods
                    .filter(
                        method =>
                            method !== controllerMethod
                    )
                    .forEach(method => {

                        expect(
                            UserController[method]
                        ).not.toHaveBeenCalled();
                    });
            }
        );
    });

    describe('Consulta del perfil autenticado', () => {
        test('devuelve el perfil en el contrato interno esperado', async () => {
            const result = await LegalAuthDatabase.execute(profileParams);
            expect(result).toEqual({ success: true, usuario: profileResponse });
            expect(result.usuario).toBe(profileResponse);
            expect(UserController.getUserProfile).toHaveBeenCalledWith({ firebaseUid });
        });

        test('ignora parámetros ajenos a la consulta', async () => {
            await LegalAuthDatabase.execute({
                ...profileParams,
                email: 'other@example.com',
                nombre: 'Otro usuario',
                pais: 'PER',
                documentoLegalIds
            });
            expect(UserController.getUserProfile).toHaveBeenCalledWith({ firebaseUid });
            expect(UserController.createOneUser).not.toHaveBeenCalled();
            expect(UserController.registerLegalAcceptances).not.toHaveBeenCalled();
            expect(UserController.getPendingLegalAcceptances).not.toHaveBeenCalled();
        });
    });

    describe('Registro tradicional', () => {

        test('registra un usuario con su identidad y documentos legales', async () => {

            await expect(
                LegalAuthDatabase.execute(
                    registerParams
                )
            ).resolves.toEqual({
                success: true,
                usuario
            });

            expect(
                UserController.createOneUser
            ).toHaveBeenCalledWith({
                nombre: 'Ana López',
                email: 'user@example.com',
                firebaseUid,
                pais: 'PER',
                documentoLegalIds
            });

            expect(
                UserController.createOneUser
            ).toHaveBeenCalledTimes(1);
        });

        test('utiliza PER como país predeterminado cuando está ausente', async () => {

            const {
                pais,
                ...paramsWithoutCountry
            } = registerParams;

            await LegalAuthDatabase.execute(
                paramsWithoutCountry
            );

            expect(
                UserController.createOneUser
            ).toHaveBeenCalledWith({
                nombre: 'Ana López',
                email: 'user@example.com',
                firebaseUid,
                pais: 'PER',
                documentoLegalIds
            });
        });

        test('utiliza PER cuando el país es undefined', async () => {

            await LegalAuthDatabase.execute({
                ...registerParams,
                pais: undefined
            });

            expect(
                UserController.createOneUser
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    pais: 'PER'
                })
            );
        });

        test('transmite el país recibido explícitamente', async () => {

            await LegalAuthDatabase.execute({
                ...registerParams,
                pais: 'COL'
            });

            expect(
                UserController.createOneUser
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    pais: 'COL'
                })
            );
        });

        test('conserva los caracteres Unicode del nombre', async () => {

            const nombre = 'María José Muñoz';

            await LegalAuthDatabase.execute({
                ...registerParams,
                nombre
            });

            expect(
                UserController.createOneUser
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    nombre
                })
            );
        });

        test('transmite identificadores de futuras versiones legales', async () => {

            const updatedDocumentIds = [48, 52];

            await LegalAuthDatabase.execute({
                ...registerParams,
                documentoLegalIds:
                    updatedDocumentIds
            });

            expect(
                UserController.createOneUser
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    documentoLegalIds:
                        updatedDocumentIds
                })
            );
        });

        test('conserva el orden original de los documentos legales', async () => {

            const documentIds = [52, 48];

            await LegalAuthDatabase.execute({
                ...registerParams,
                documentoLegalIds: documentIds
            });

            const payload =
                UserController.createOneUser
                    .mock.calls[0][0];

            expect(payload.documentoLegalIds)
                .toBe(documentIds);

            expect(payload.documentoLegalIds)
                .toEqual([52, 48]);
        });

        test('conserva la referencia del usuario devuelto por el controlador', async () => {

            const result =
                await LegalAuthDatabase.execute(
                    registerParams
                );

            expect(result).toEqual({
                success: true,
                usuario
            });

            expect(result.usuario)
                .toBe(usuario);
        });

        test('no transmite propiedades adicionales al controlador', async () => {

            await LegalAuthDatabase.execute({
                ...registerParams,
                idToken: 'firebase-token',
                token: 'another-token',
                password: 'test-password',
                usuarioId: 99,
                firebase_uid: 'OtherUID',
                metodoAceptacion: 'manual',
                fechaAceptacion:
                    '2026-11-24T21:32:35Z'
            });

            expect(
                UserController.createOneUser
            ).toHaveBeenCalledWith({
                nombre: 'Ana López',
                email: 'user@example.com',
                firebaseUid,
                pais: 'PER',
                documentoLegalIds
            });
        });

        test('no modifica los parámetros originales del registro', async () => {

            const immutableParams = Object.freeze({
                ...registerParams,
                documentoLegalIds: Object.freeze([
                    ...documentoLegalIds
                ])
            });

            await expect(
                LegalAuthDatabase.execute(
                    immutableParams
                )
            ).resolves.toEqual({
                success: true,
                usuario
            });

            expect(immutableParams)
                .toEqual(registerParams);
        });
    });

    describe('Validación defensiva del correo electrónico', () => {

        const validEmails = [
            'user@example.com',
            'user.name@example.com',
            'user+test@example.com',
            'user_name@example.com',
            'user-name@example.com',
            'user@sub.example.com'
        ];

        test.each(validEmails)(
            'acepta un correo válido y normalizado: %s',
            async email => {

                await expect(
                    LegalAuthDatabase.execute({
                        ...registerParams,
                        email
                    })
                ).resolves.toEqual({
                    success: true,
                    usuario
                });

                expect(
                    UserController.createOneUser
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        email
                    })
                );
            }
        );

        const invalidEmails = [
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['espacios en blanco', '   '],
            ['número', 12345],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['user@example.com']],
            ['mayúsculas', 'USER@EXAMPLE.COM'],
            ['mayúsculas parciales', 'User@example.com'],
            ['espacio inicial', ' user@example.com'],
            ['espacio final', 'user@example.com '],
            ['espacio interno', 'user name@example.com'],
            ['sin arroba', 'user.example.com'],
            ['sin usuario', '@example.com'],
            ['sin dominio', 'user@'],
            ['sin extensión', 'user@example'],
            ['múltiples arrobas', 'user@@example.com'],
            ['dominio incompleto', 'user@example.'],
            ['tabulación interna', 'user\t@example.com']
        ];

        test.each(invalidEmails)(
            'rechaza el registro con correo inválido: %s',
            async (description, email) => {

                await expect(
                    LegalAuthDatabase.execute({
                        ...registerParams,
                        email
                    })
                ).rejects.toEqual(
                    invalidEmailError
                );

                expectNoControllerCalls();
            }
        );

        test('valida primero el correo cuando también existe un UID inválido', async () => {

            await expect(
                LegalAuthDatabase.execute({
                    ...registerParams,
                    email: 'invalid-email',
                    firebaseUid: ''
                })
            ).rejects.toEqual(
                invalidEmailError
            );

            expectNoControllerCalls();
        });
    });

    describe('Validación defensiva del Firebase UID', () => {

        const invalidUids = [
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['espacios en blanco', '   '],
            ['tabulaciones', '\t\t'],
            ['número', 12345],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['uid']],
            ['más de 128 caracteres', 'A'.repeat(129)]
        ];

        describe.each(validOperations)(
            'operación $action',
            ({
                params,
                controllerMethod
            }) => {

                test.each(invalidUids)(
                    'rechaza un Firebase UID inválido: %s',
                    async (
                        description,
                        invalidUid
                    ) => {

                        await expect(
                            LegalAuthDatabase.execute({
                                ...params,
                                firebaseUid: invalidUid
                            })
                        ).rejects.toEqual(
                            invalidUidError
                        );

                        expectNoControllerCalls();
                    }
                );

                test.each([
                    'A',
                    'AbCdEf123XyZ',
                    'A'.repeat(128)
                ])(
                    'acepta y conserva el Firebase UID válido: %s',
                    async originalUid => {

                        await LegalAuthDatabase.execute({
                            ...params,
                            firebaseUid: originalUid
                        });

                        expect(
                            UserController[
                                controllerMethod
                            ]
                        ).toHaveBeenCalledWith(
                            expect.objectContaining({
                                firebaseUid:
                                    originalUid
                            })
                        );

                        expect(
                            UserController[
                                controllerMethod
                            ]
                        ).toHaveBeenCalledTimes(1);
                    }
                );
            }
        );
    });

    describe('Consulta de aceptaciones legales pendientes', () => {

        test('consulta las aceptaciones pendientes mediante Firebase UID', async () => {

            await expect(
                LegalAuthDatabase.execute(
                    pendingParams
                )
            ).resolves.toBe(
                pendingResponse
            );

            expect(
                UserController
                    .getPendingLegalAcceptances
            ).toHaveBeenCalledWith({
                firebaseUid
            });

            expect(
                UserController
                    .getPendingLegalAcceptances
            ).toHaveBeenCalledTimes(1);
        });

        test('conserva la respuesta cuando no existen documentos pendientes', async () => {

            const response = {
                success: true,
                documentos: []
            };

            UserController
                .getPendingLegalAcceptances
                .mockResolvedValue(response);

            await expect(
                LegalAuthDatabase.execute(
                    pendingParams
                )
            ).resolves.toBe(response);
        });

        test.each([
            undefined,
            null,
            '',
            'invalid-email',
            'USER@EXAMPLE.COM',
            'other@example.com'
        ])(
            'no utiliza el correo recibido para consultar aceptaciones: %p',
            async email => {

                await expect(
                    LegalAuthDatabase.execute({
                        ...pendingParams,
                        email
                    })
                ).resolves.toBe(
                    pendingResponse
                );

                expect(
                    UserController
                        .getPendingLegalAcceptances
                ).toHaveBeenCalledWith({
                    firebaseUid
                });
            }
        );

        test('ignora propiedades ajenas a la identidad Firebase', async () => {

            await LegalAuthDatabase.execute({
                ...pendingParams,
                usuarioId: 99,
                firebase_uid: 'OtherUID',
                nombre: 'Otro usuario',
                pais: 'COL',
                documentoLegalIds,
                idToken: 'firebase-token',
                metodoAceptacion: 'manual'
            });

            expect(
                UserController
                    .getPendingLegalAcceptances
            ).toHaveBeenCalledWith({
                firebaseUid
            });
        });

        test('no modifica los parámetros originales de la consulta', async () => {

            const immutableParams =
                Object.freeze({
                    ...pendingParams
                });

            await expect(
                LegalAuthDatabase.execute(
                    immutableParams
                )
            ).resolves.toBe(
                pendingResponse
            );

            expect(immutableParams)
                .toEqual(pendingParams);
        });
    });

    describe('Registro de aceptaciones legales posteriores', () => {

        test('registra las aceptaciones utilizando el Firebase UID', async () => {

            await expect(
                LegalAuthDatabase.execute(
                    acceptanceParams
                )
            ).resolves.toBe(
                acceptanceResponse
            );

            expect(
                UserController
                    .registerLegalAcceptances
            ).toHaveBeenCalledWith({
                firebaseUid,
                documentoLegalIds
            });

            expect(
                UserController
                    .registerLegalAcceptances
            ).toHaveBeenCalledTimes(1);
        });

        test('transmite identificadores de futuras versiones legales', async () => {

            const updatedDocumentIds = [48, 52];

            await LegalAuthDatabase.execute({
                ...acceptanceParams,
                documentoLegalIds:
                    updatedDocumentIds
            });

            expect(
                UserController
                    .registerLegalAcceptances
            ).toHaveBeenCalledWith({
                firebaseUid,
                documentoLegalIds:
                    updatedDocumentIds
            });
        });

        test('conserva los identificadores y su orden original', async () => {

            const documentIds = [52, 48];

            await LegalAuthDatabase.execute({
                ...acceptanceParams,
                documentoLegalIds: documentIds
            });

            const payload =
                UserController
                    .registerLegalAcceptances
                    .mock.calls[0][0];

            expect(payload.documentoLegalIds)
                .toBe(documentIds);

            expect(payload.documentoLegalIds)
                .toEqual([52, 48]);
        });

        test.each([
            undefined,
            null,
            '',
            'invalid-email',
            'USER@EXAMPLE.COM',
            'other@example.com'
        ])(
            'no utiliza el correo recibido para registrar aceptaciones: %p',
            async email => {

                await expect(
                    LegalAuthDatabase.execute({
                        ...acceptanceParams,
                        email
                    })
                ).resolves.toBe(
                    acceptanceResponse
                );

                expect(
                    UserController
                        .registerLegalAcceptances
                ).toHaveBeenCalledWith({
                    firebaseUid,
                    documentoLegalIds
                });
            }
        );

        test('no permite transmitir datos de aceptación ajenos al contrato interno', async () => {

            await LegalAuthDatabase.execute({
                ...acceptanceParams,
                usuarioId: 99,
                firebase_uid: 'OtherUID',
                email: 'other@example.com',
                metodoAceptacion: 'manual',
                fechaAceptacion:
                    '2026-11-24T21:32:35Z',
                idToken: 'firebase-token',
                token: 'another-token',
                version: '1.0'
            });

            expect(
                UserController
                    .registerLegalAcceptances
            ).toHaveBeenCalledWith({
                firebaseUid,
                documentoLegalIds
            });
        });

        test('no modifica los parámetros originales de aceptación', async () => {

            const immutableParams = Object.freeze({
                ...acceptanceParams,
                documentoLegalIds: Object.freeze([
                    ...documentoLegalIds
                ])
            });

            await expect(
                LegalAuthDatabase.execute(
                    immutableParams
                )
            ).resolves.toBe(
                acceptanceResponse
            );

            expect(immutableParams)
                .toEqual(acceptanceParams);
        });
    });

    describe('Delegación de validaciones de documentos legales', () => {

        const operationsWithDocuments = [
            {
                action: 'register-traditional',
                params: registerParams,
                controllerMethod: 'createOneUser'
            },
            {
                action: 'register-acceptances',
                params: acceptanceParams,
                controllerMethod:
                    'registerLegalAcceptances'
            }
        ];

        const invalidDocumentIds = [
            ['undefined', undefined],
            ['null', null],
            ['arreglo vacío', []],
            ['cadena', '12,35'],
            ['número', 12],
            ['objeto', {}],
            ['identificador negativo', [-1, 35]],
            ['identificador cero', [0, 35]],
            ['identificador decimal', [1.5, 35]],
            ['identificadores duplicados', [12, 12]],
            ['identificador como cadena', ['12', 35]]
        ];

        describe.each(operationsWithDocuments)(
            'operación $action',
            ({
                params,
                controllerMethod
            }) => {

                test.each(invalidDocumentIds)(
                    'delega y propaga el rechazo de documentos inválidos: %s',
                    async (
                        description,
                        documentIds
                    ) => {

                        const error = {
                            statusCode: 400,
                            message:
                                'Documentos legales inválidos'
                        };

                        UserController[
                            controllerMethod
                        ].mockRejectedValue(error);

                        await expect(
                            LegalAuthDatabase.execute({
                                ...params,
                                documentoLegalIds:
                                    documentIds
                            })
                        ).rejects.toBe(error);

                        expect(
                            UserController[
                                controllerMethod
                            ]
                        ).toHaveBeenCalledWith(
                            expect.objectContaining({
                                documentoLegalIds:
                                    documentIds
                            })
                        );

                        expect(
                            UserController[
                                controllerMethod
                            ]
                        ).toHaveBeenCalledTimes(1);
                    }
                );
            }
        );
    });

    describe('Propagación de errores controlados', () => {

        const controlledErrors = [
            [400, 'Parámetros inválidos'],
            [401, 'Identidad de usuario no válida'],
            [403, 'Operación no permitida'],
            [404, 'Usuario no registrado'],
            [409, 'Conflicto de documentos legales'],
            [500, 'Error interno del servidor'],
            [503, 'Servicio no disponible']
        ];

        describe.each(validOperations)(
            'operación $action',
            ({
                params,
                controllerMethod
            }) => {

                test.each(controlledErrors)(
                    'propaga sin modificar el error %i',
                    async (
                        statusCode,
                        message
                    ) => {

                        const error = {
                            statusCode,
                            message
                        };

                        UserController[
                            controllerMethod
                        ].mockRejectedValue(error);

                        await expect(
                            LegalAuthDatabase.execute(
                                params
                            )
                        ).rejects.toBe(error);

                        expect(
                            UserController[
                                controllerMethod
                            ]
                        ).toHaveBeenCalledTimes(1);
                    }
                );

                test('propaga una excepción inesperada del controlador', async () => {

                    const error = new Error(
                        'Unexpected controller error'
                    );

                    UserController[
                        controllerMethod
                    ].mockRejectedValue(error);

                    await expect(
                        LegalAuthDatabase.execute(
                            params
                        )
                    ).rejects.toBe(error);

                    expect(
                        UserController[
                            controllerMethod
                        ]
                    ).toHaveBeenCalledTimes(1);
                });

                test('propaga una excepción síncrona del controlador', async () => {

                    const error = new Error(
                        'Synchronous controller error'
                    );

                    UserController[
                        controllerMethod
                    ].mockImplementation(() => {

                        throw error;
                    });

                    await expect(
                        LegalAuthDatabase.execute(
                            params
                        )
                    ).rejects.toBe(error);

                    expect(
                        UserController[
                            controllerMethod
                        ]
                    ).toHaveBeenCalledTimes(1);
                });
            }
        );
    });

    describe('Seguridad del contrato interno', () => {

        test.each(validOperations)(
            'no utiliza identificadores alternativos durante $action',
            async ({
                params,
                controllerMethod
            }) => {

                await LegalAuthDatabase.execute({
                    ...params,
                    uid: 'ForgedUID',
                    firebase_uid: 'AnotherUID',
                    usuarioId: 999,
                    userId: 888
                });

                const payload =
                    UserController[
                        controllerMethod
                    ].mock.calls[0][0];

                expect(payload.firebaseUid)
                    .toBe(firebaseUid);

                expect(payload)
                    .not.toHaveProperty('uid');

                expect(payload)
                    .not.toHaveProperty('firebase_uid');

                expect(payload)
                    .not.toHaveProperty('usuarioId');

                expect(payload)
                    .not.toHaveProperty('userId');
            }
        );

        test.each(validOperations)(
            'no transmite credenciales durante $action',
            async ({
                params,
                controllerMethod
            }) => {

                await LegalAuthDatabase.execute({
                    ...params,
                    idToken: 'firebase-id-token',
                    token: 'another-token',
                    authorization: 'Bearer token',
                    password: 'test-password'
                });

                const payload =
                    UserController[
                        controllerMethod
                    ].mock.calls[0][0];

                expect(payload)
                    .not.toHaveProperty('idToken');

                expect(payload)
                    .not.toHaveProperty('token');

                expect(payload)
                    .not.toHaveProperty('authorization');

                expect(payload)
                    .not.toHaveProperty('password');
            }
        );

        test.each(validOperations)(
            'no sustituye un Firebase UID ausente por identificadores alternativos durante $action',
            async ({ params }) => {

                await expect(
                    LegalAuthDatabase.execute({
                        ...params,
                        firebaseUid: undefined,
                        uid: 'AlternativeUID',
                        firebase_uid: 'AnotherUID',
                        usuarioId: 99
                    })
                ).rejects.toEqual(
                    invalidUidError
                );

                expectNoControllerCalls();
            }
        );
    });
});