jest.mock('@user/services/user', () => ({
    GoogleAuthUser: {
        execute: jest.fn()
    }
}));

const {
    GoogleAuthUser
} = require('@user/services/user');

const UserController = require(
    '@user/controller/user'
);

const idToken =
    'valid-test-token-123456789';

const documentoLegalIds = [12, 35];

const loginParams = {
    idToken,
    action: 'login'
};

const registerParams = {
    idToken,
    action: 'register',
    nombre: 'Juan Perez',
    documentoLegalIds
};

const loginResponse = {
    success: true,
    action: 'login'
};

const registerResponse = {
    success: true,
    action: 'register'
};

describe('GoogleAuthController', () => {

    beforeEach(() => {

        jest.resetAllMocks();
    });


    /*
     * =====================================================
     * CASO ORIGINAL
     * =====================================================
     */

    describe('Caso original conservado', () => {

        test('controller delega los parámetros al servicio GoogleAuthUser', async () => {

            const input = {
                idToken: 'valid-test-token-123456789',
                action: 'login'
            };

            GoogleAuthUser.execute.mockResolvedValue({
                success: true,
                action: 'login'
            });

            await expect(
                UserController.googleAuthUser(input)
            ).resolves.toEqual({
                success: true,
                action: 'login'
            });

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(input);
        });
    });


    /*
     * =====================================================
     * LOGIN
     * =====================================================
     */

    describe('Inicio de sesión mediante Google', () => {

        test('delega explícitamente la acción login', async () => {

            GoogleAuthUser.execute
                .mockResolvedValue(loginResponse);

            await expect(
                UserController.googleAuthUser(
                    loginParams
                )
            ).resolves.toBe(loginResponse);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(
                loginParams
            );

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledTimes(1);
        });


        test('no incorpora documentos legales cuando no fueron recibidos durante el login', async () => {

            GoogleAuthUser.execute
                .mockResolvedValue(loginResponse);

            await UserController.googleAuthUser(
                loginParams
            );

            const payload =
                GoogleAuthUser.execute
                    .mock.calls[0][0];

            expect(payload)
                .toEqual(loginParams);

            expect(payload)
                .not.toHaveProperty(
                    'documentoLegalIds'
                );
        });


        test('no incorpora un nombre durante el login', async () => {

            await UserController.googleAuthUser(
                loginParams
            );

            const payload =
                GoogleAuthUser.execute
                    .mock.calls[0][0];

            expect(payload)
                .not.toHaveProperty('nombre');
        });


        test('conserva la referencia original de los parámetros de login', async () => {

            await UserController.googleAuthUser(
                loginParams
            );

            expect(
                GoogleAuthUser.execute
                    .mock.calls[0][0]
            ).toBe(loginParams);
        });


        test('conserva exactamente el token recibido', async () => {

            const originalToken =
                'AbCdEf123.XyZ456.TokenSignature';

            const params = {
                action: 'login',
                idToken: originalToken
            };

            await UserController.googleAuthUser(
                params
            );

            const payload =
                GoogleAuthUser.execute
                    .mock.calls[0][0];

            expect(payload.idToken)
                .toBe(originalToken);
        });
    });


    /*
     * =====================================================
     * REGISTER
     * =====================================================
     */

    describe('Registro mediante Google', () => {

        test('delega explícitamente la acción register', async () => {

            GoogleAuthUser.execute
                .mockResolvedValue(registerResponse);

            await expect(
                UserController.googleAuthUser(
                    registerParams
                )
            ).resolves.toBe(registerResponse);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(
                registerParams
            );

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledTimes(1);
        });


        test('transmite los documentos legales aceptados durante el registro', async () => {

            await UserController.googleAuthUser(
                registerParams
            );

            const payload =
                GoogleAuthUser.execute
                    .mock.calls[0][0];

            expect(payload.documentoLegalIds)
                .toEqual([12, 35]);

            expect(payload.documentoLegalIds)
                .toBe(documentoLegalIds);
        });


        test('transmite identificadores de futuras versiones legales', async () => {

            const updatedDocumentIds = [
                48,
                52
            ];

            const params = {
                ...registerParams,
                documentoLegalIds:
                    updatedDocumentIds
            };

            await UserController.googleAuthUser(
                params
            );

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(params);

            expect(
                GoogleAuthUser.execute
                    .mock.calls[0][0]
                    .documentoLegalIds
            ).toEqual([48, 52]);
        });


        test('conserva el orden original de los documentos legales', async () => {

            const documentIds = [52, 48];

            const params = {
                ...registerParams,
                documentoLegalIds: documentIds
            };

            await UserController.googleAuthUser(
                params
            );

            expect(
                GoogleAuthUser.execute
                    .mock.calls[0][0]
                    .documentoLegalIds
            ).toEqual([52, 48]);
        });


        test('conserva los caracteres Unicode del nombre', async () => {

            const nombre =
                'María José Muñoz';

            const params = {
                ...registerParams,
                nombre
            };

            await UserController.googleAuthUser(
                params
            );

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(params);

            expect(
                GoogleAuthUser.execute
                    .mock.calls[0][0]
                    .nombre
            ).toBe(nombre);
        });


        test('permite delegar el registro sin un nombre explícito', async () => {

            const params = {
                idToken,
                action: 'register',
                documentoLegalIds
            };

            await UserController.googleAuthUser(
                params
            );

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(params);

            expect(
                GoogleAuthUser.execute
                    .mock.calls[0][0]
            ).not.toHaveProperty('nombre');
        });


        test('no modifica los parámetros originales del registro', async () => {

            const immutableParams =
                Object.freeze({
                    ...registerParams,
                    documentoLegalIds:
                        Object.freeze([
                            ...documentoLegalIds
                        ])
                });

            GoogleAuthUser.execute
                .mockResolvedValue(registerResponse);

            await expect(
                UserController.googleAuthUser(
                    immutableParams
                )
            ).resolves.toBe(registerResponse);

            expect(immutableParams)
                .toEqual(registerParams);

            expect(
                GoogleAuthUser.execute
                    .mock.calls[0][0]
            ).toBe(immutableParams);
        });
    });


    /*
     * =====================================================
     * DELEGACIÓN DE PARÁMETROS
     * =====================================================
     *
     * El controlador no valida ni transforma los parámetros.
     * Estas responsabilidades pertenecen a otras capas.
     */

    describe('Contrato de delegación de parámetros', () => {

        test('delega un objeto vacío cuando no recibe parámetros', async () => {

            await UserController.googleAuthUser();

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith({});

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledTimes(1);
        });


        test('delega un objeto vacío cuando recibe undefined', async () => {

            await UserController.googleAuthUser(
                undefined
            );

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith({});
        });


        test('delega null sin sustituirlo por un objeto vacío', async () => {

            const error = new TypeError(
                'Invalid service parameters'
            );

            GoogleAuthUser.execute
                .mockRejectedValue(error);

            await expect(
                UserController.googleAuthUser(
                    null
                )
            ).rejects.toBe(error);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(null);
        });


        test('no asigna automáticamente una acción cuando está ausente', async () => {

            const params = {
                idToken
            };

            await UserController.googleAuthUser(
                params
            );

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(params);

            expect(
                GoogleAuthUser.execute
                    .mock.calls[0][0]
            ).not.toHaveProperty('action');
        });


        test('delega una acción desconocida sin transformarla', async () => {

            const params = {
                idToken,
                action: 'unknown'
            };

            const error = {
                statusCode: 400,
                message: 'Acción inválida'
            };

            GoogleAuthUser.execute
                .mockRejectedValue(error);

            await expect(
                UserController.googleAuthUser(
                    params
                )
            ).rejects.toBe(error);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(params);
        });


        test('delega los campos adicionales sin interpretarlos como identidad verificada', async () => {

            const params = {
                ...registerParams,
                firebaseUid: 'UntrustedClientUID',
                email: 'untrusted@example.com',
                usuarioId: 99
            };

            GoogleAuthUser.execute
                .mockResolvedValue(registerResponse);

            await expect(
                UserController.googleAuthUser(
                    params
                )
            ).resolves.toBe(registerResponse);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(params);

            expect(
                GoogleAuthUser.execute
                    .mock.calls[0][0]
            ).toBe(params);
        });
    });


    /*
     * =====================================================
     * ERRORES DE AUTENTICACIÓN
     * =====================================================
     */

    describe('Propagación de errores de autenticación', () => {

        test.each([
            ['login', loginParams],
            ['register', registerParams]
        ])(
            'propaga el error 401 de Firebase durante %s',
            async (
                action,
                params
            ) => {

                const error = {
                    statusCode: 401,
                    message:
                        'Token de Firebase inválido o expirado'
                };

                GoogleAuthUser.execute
                    .mockRejectedValue(error);

                await expect(
                    UserController.googleAuthUser(
                        params
                    )
                ).rejects.toBe(error);

                expect(
                    GoogleAuthUser.execute
                ).toHaveBeenCalledWith(params);

                expect(
                    GoogleAuthUser.execute
                ).toHaveBeenCalledTimes(1);
            }
        );


        test('propaga el rechazo de una identidad Firebase inválida', async () => {

            const error = {
                statusCode: 401,
                message:
                    'Identidad de usuario no válida'
            };

            GoogleAuthUser.execute
                .mockRejectedValue(error);

            await expect(
                UserController.googleAuthUser(
                    loginParams
                )
            ).rejects.toBe(error);
        });


        test.each([
            ['login', loginParams],
            ['register', registerParams]
        ])(
            'propaga el error 403 de identidad Google durante %s',
            async (
                action,
                params
            ) => {

                const error = {
                    statusCode: 403,
                    message:
                        'Se requiere una cuenta de Google verificada'
                };

                GoogleAuthUser.execute
                    .mockRejectedValue(error);

                await expect(
                    UserController.googleAuthUser(
                        params
                    )
                ).rejects.toBe(error);

                expect(
                    GoogleAuthUser.execute
                ).toHaveBeenCalledWith(params);
            }
        );
    });


    /*
     * =====================================================
     * ERRORES LEGALES
     * =====================================================
     */

    describe('Propagación de errores legales durante el registro', () => {

        test('propaga el rechazo por ausencia de documentos legales', async () => {

            const params = {
                idToken,
                action: 'register',
                nombre: 'Juan Perez'
            };

            const error = {
                statusCode: 400,
                message:
                    'Documentos legales requeridos'
            };

            GoogleAuthUser.execute
                .mockRejectedValue(error);

            await expect(
                UserController.googleAuthUser(
                    params
                )
            ).rejects.toBe(error);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(params);
        });


        test('propaga el rechazo de documentos legales inválidos', async () => {

            const params = {
                ...registerParams,
                documentoLegalIds: []
            };

            const error = {
                statusCode: 400,
                message:
                    'Documentos legales inválidos'
            };

            GoogleAuthUser.execute
                .mockRejectedValue(error);

            await expect(
                UserController.googleAuthUser(
                    params
                )
            ).rejects.toBe(error);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(params);
        });


        test('propaga un conflicto de documentos legales', async () => {

            const error = {
                statusCode: 409,
                message:
                    'Conflicto de documentos legales'
            };

            GoogleAuthUser.execute
                .mockRejectedValue(error);

            await expect(
                UserController.googleAuthUser(
                    registerParams
                )
            ).rejects.toBe(error);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledTimes(1);
        });
    });


    /*
     * =====================================================
     * ERRORES DE COMUNICACIÓN INTERNA
     * =====================================================
     */

    describe('Propagación de errores de comunicación interna', () => {

        test.each([
            'No fue posible completar la operación',
            'Respuesta interna inválida'
        ])(
            'propaga el error 502: %s',
            async message => {

                const error = {
                    statusCode: 502,
                    message
                };

                GoogleAuthUser.execute
                    .mockRejectedValue(error);

                await expect(
                    UserController.googleAuthUser(
                        loginParams
                    )
                ).rejects.toBe(error);

                expect(
                    GoogleAuthUser.execute
                ).toHaveBeenCalledTimes(1);
            }
        );


        test('no reintenta automáticamente una operación de registro fallida', async () => {

            const error = {
                statusCode: 503,
                message:
                    'Servicio no disponible'
            };

            GoogleAuthUser.execute
                .mockRejectedValue(error);

            await expect(
                UserController.googleAuthUser(
                    registerParams
                )
            ).rejects.toBe(error);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledTimes(1);
        });
    });


    /*
     * =====================================================
     * COMPORTAMIENTO ASÍNCRONO
     * =====================================================
     */

    describe('Comportamiento asíncrono del controlador', () => {

        test('espera la resolución del servicio antes de devolver la respuesta', async () => {

            let resolveService;

            GoogleAuthUser.execute
                .mockImplementation(
                    () => new Promise(resolve => {

                        resolveService = resolve;
                    })
                );

            let completed = false;

            const operation =
                UserController
                    .googleAuthUser(loginParams)
                    .then(result => {

                        completed = true;

                        return result;
                    });

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledTimes(1);

            await Promise.resolve();

            expect(completed)
                .toBe(false);

            resolveService(loginResponse);

            await expect(operation)
                .resolves.toBe(loginResponse);

            expect(completed)
                .toBe(true);
        });


        test('propaga un rechazo asíncrono posterior a la invocación', async () => {

            let rejectService;

            GoogleAuthUser.execute
                .mockImplementation(
                    () => new Promise(
                        (resolve, reject) => {

                            rejectService = reject;
                        }
                    )
                );

            const error = {
                statusCode: 502,
                message:
                    'No fue posible completar la operación'
            };

            const operation =
                UserController.googleAuthUser(
                    registerParams
                );

            const assertion =
                expect(operation)
                    .rejects.toBe(error);

            rejectService(error);

            await assertion;

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledTimes(1);
        });


        test('mantiene independientes las operaciones concurrentes de login y registro', async () => {

            const resolveOperations = {};

            GoogleAuthUser.execute
                .mockImplementation(
                    params => new Promise(resolve => {

                        resolveOperations[
                            params.action
                        ] = resolve;
                    })
                );

            const loginOperation =
                UserController.googleAuthUser(
                    loginParams
                );

            const registerOperation =
                UserController.googleAuthUser(
                    registerParams
                );

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledTimes(2);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenNthCalledWith(
                1,
                loginParams
            );

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenNthCalledWith(
                2,
                registerParams
            );

            resolveOperations.register(
                registerResponse
            );

            await expect(registerOperation)
                .resolves.toBe(registerResponse);

            resolveOperations.login(
                loginResponse
            );

            await expect(loginOperation)
                .resolves.toBe(loginResponse);
        });
    });


    /*
     * =====================================================
     * CARGA DIFERIDA
     * =====================================================
     */


    describe('Carga diferida del servicio GoogleAuthUser', () => {

        test('importar el controlador no carga el módulo de servicios hasta ejecutar googleAuthUser', async () => {

            const isolatedExecute = jest.fn()
                .mockResolvedValue(loginResponse);

            const serviceGetter = jest.fn(
                () => ({
                    execute: isolatedExecute
                })
            );

            const moduleFactory = jest.fn(
                () => ({
                    get GoogleAuthUser() {

                        return serviceGetter();
                    }
                })
            );

            let operation;

            jest.resetModules();

            try {

                jest.isolateModules(() => {

                    jest.doMock(
                        '@user/services/user',
                        moduleFactory
                    );

                    const IsolatedController =
                        require(
                            '@user/controller/user'
                        );

                    expect(moduleFactory)
                        .not.toHaveBeenCalled();

                    expect(serviceGetter)
                        .not.toHaveBeenCalled();

                    expect(isolatedExecute)
                        .not.toHaveBeenCalled();

                    operation =
                        IsolatedController
                            .googleAuthUser(
                                loginParams
                            );

                    expect(moduleFactory)
                        .toHaveBeenCalledTimes(1);

                    expect(serviceGetter)
                        .toHaveBeenCalledTimes(1);

                    expect(isolatedExecute)
                        .toHaveBeenCalledTimes(1);

                    expect(isolatedExecute)
                        .toHaveBeenCalledWith(
                            loginParams
                        );
                });

                await expect(operation)
                    .resolves.toBe(loginResponse);

            } finally {

                jest.resetModules();

                jest.doMock(
                    '@user/services/user',
                    () => ({
                        GoogleAuthUser
                    })
                );
            }
        });
    });

});