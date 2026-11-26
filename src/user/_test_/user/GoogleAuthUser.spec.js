
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

const firebaseUid = 'AbCdEf123FirebaseUID';

const documentoLegalIds = [12, 35];

const decoded = {
    uid: firebaseUid,
    email: 'USER@EXAMPLE.COM',
    email_verified: true,
    name: 'Nombre Google',
    firebase: {
        sign_in_provider: 'google.com'
    }
};

const loginParams = {
    idToken: token,
    action: 'login'
};

const registerParams = {
    idToken: token,
    action: 'register',
    documentoLegalIds
};

beforeEach(() => {

    jest.resetAllMocks();

    FirebaseAuthService.getAuth.mockReturnValue({
        verifyIdToken
    });

    verifyIdToken.mockResolvedValue(decoded);
});

describe('GoogleAuthUser', () => {

    describe('Validaciones existentes readaptadas', () => {

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
                GoogleAuthUser.execute(loginParams)
            ).resolves.toEqual(response);

            expect(verifyIdToken).toHaveBeenCalledWith(
                token,
                true
            );

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith({
                action: 'login',
                email: 'user@example.com',
                firebaseUid
            });
        });

        test('registro válido: utiliza el nombre recibido', async () => {

            GoogleAuthLambdaService.execute.mockResolvedValue({
                success: true,
                action: 'register',
                email: 'user@example.com'
            });

            await GoogleAuthUser.execute({
                ...registerParams,
                nombre: 'Ana López'
            });

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith({
                action: 'register',
                email: 'user@example.com',
                firebaseUid,
                nombre: 'Ana López',
                documentoLegalIds
            });
        });

        test('registro sin nombre: utiliza el nombre de Firebase', async () => {

            await GoogleAuthUser.execute(registerParams);

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith({
                action: 'register',
                email: 'user@example.com',
                firebaseUid,
                nombre: 'Nombre Google',
                documentoLegalIds
            });
        });

        test('registro sin nombre de Firebase: utiliza el prefijo del correo', async () => {

            verifyIdToken.mockResolvedValue({
                ...decoded,
                name: undefined
            });

            await GoogleAuthUser.execute(registerParams);

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith({
                action: 'register',
                email: 'user@example.com',
                firebaseUid,
                nombre: 'user',
                documentoLegalIds
            });
        });

        test('normaliza espacios y mayúsculas del correo', async () => {

            verifyIdToken.mockResolvedValue({
                ...decoded,
                email: '  USER@EXAMPLE.COM  '
            });

            await GoogleAuthUser.execute(loginParams);

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith({
                action: 'login',
                email: 'user@example.com',
                firebaseUid
            });
        });

        test('token inválido: 401 sin invocar la Lambda interna', async () => {

            verifyIdToken.mockRejectedValue(
                new Error('Invalid token')
            );

            await expect(
                GoogleAuthUser.execute(loginParams)
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
                GoogleAuthUser.execute(loginParams)
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
        ])('identidad no válida: 403', async claims => {

            verifyIdToken.mockResolvedValue(claims);

            await expect(
                GoogleAuthUser.execute(loginParams)
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
                GoogleAuthUser.execute(loginParams)
            ).rejects.toEqual({
                statusCode,
                message
            });
        });
    });

    describe('Identificación mediante Firebase UID', () => {

        test.each([
            'login',
            'register'
        ])('conserva mayúsculas y minúsculas del UID durante %s', async action => {

            const originalUid = 'AbCdEf123XyZ';

            verifyIdToken.mockResolvedValue({
                ...decoded,
                uid: originalUid
            });

            await GoogleAuthUser.execute({
                ...registerParams,
                action
            });

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    action,
                    firebaseUid: originalUid
                })
            );
        });

        test.each([
            'login',
            'register'
        ])('acepta un UID de 128 caracteres durante %s', async action => {

            const maximumUid = 'A'.repeat(128);

            verifyIdToken.mockResolvedValue({
                ...decoded,
                uid: maximumUid
            });

            await GoogleAuthUser.execute({
                ...registerParams,
                action
            });

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    action,
                    firebaseUid: maximumUid
                })
            );
        });

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

                    verifyIdToken.mockResolvedValue({
                        ...decoded,
                        uid: invalidUid
                    });

                    await expect(
                        GoogleAuthUser.execute({
                            ...registerParams,
                            action
                        })
                    ).rejects.toEqual({
                        statusCode: 401,
                        message: 'Identidad de usuario no válida'
                    });

                    expect(
                        GoogleAuthLambdaService.execute
                    ).not.toHaveBeenCalled();
                }
            );
        });
    });

    describe('Validación adicional del token Firebase', () => {

        test('comprueba la revocación del token durante el registro', async () => {

            await GoogleAuthUser.execute(registerParams);

            expect(
                FirebaseAuthService.getAuth
            ).toHaveBeenCalledTimes(1);

            expect(verifyIdToken)
                .toHaveBeenCalledTimes(1);

            expect(verifyIdToken)
                .toHaveBeenCalledWith(token, true);
        });

        test.each([
            'auth/id-token-expired',
            'auth/id-token-revoked',
            'auth/user-disabled',
            'auth/invalid-id-token'
        ])('rechaza error Firebase %s sin delegar operación', async code => {

            const error = Object.assign(
                new Error('Firebase authentication failed'),
                { code }
            );

            verifyIdToken.mockRejectedValue(error);

            await expect(
                GoogleAuthUser.execute(loginParams)
            ).rejects.toEqual({
                statusCode: 401,
                message: 'Token de Firebase inválido o expirado'
            });

            expect(
                GoogleAuthLambdaService.execute
            ).not.toHaveBeenCalled();
        });
    });

    describe('Validación adicional de identidad Google', () => {

        test.each([
            [
                'correo no verificado',
                { email_verified: false }
            ],
            [
                'correo sin estado de verificación',
                { email_verified: undefined }
            ],
            [
                'correo con espacios únicamente',
                { email: '   ' }
            ],
            [
                'correo numérico',
                { email: 12345 }
            ],
            [
                'proveedor password',
                {
                    firebase: {
                        sign_in_provider: 'password'
                    }
                }
            ],
            [
                'proveedor anónimo',
                {
                    firebase: {
                        sign_in_provider: 'anonymous'
                    }
                }
            ],
            [
                'proveedor inexistente',
                { firebase: {} }
            ]
        ])('rechaza registro con %s', async (
            description,
            claims
        ) => {

            verifyIdToken.mockResolvedValue({
                ...decoded,
                ...claims
            });

            await expect(
                GoogleAuthUser.execute(registerParams)
            ).rejects.toEqual({
                statusCode: 403,
                message: 'Se requiere una cuenta de Google verificada'
            });

            expect(
                GoogleAuthLambdaService.execute
            ).not.toHaveBeenCalled();
        });
    });

    describe('Documentos legales durante el registro', () => {

        test('transmite los documentos legales aceptados', async () => {

            await GoogleAuthUser.execute(registerParams);

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith({
                action: 'register',
                email: 'user@example.com',
                firebaseUid,
                nombre: 'Nombre Google',
                documentoLegalIds
            });
        });

        test('transmite identificadores de futuras versiones legales', async () => {

            const updatedDocumentIds = [48, 52];

            await GoogleAuthUser.execute({
                ...registerParams,
                documentoLegalIds: updatedDocumentIds
            });

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    documentoLegalIds: updatedDocumentIds
                })
            );
        });

        test('conserva los identificadores y su orden original', async () => {

            const documentIds = [52, 48];

            await GoogleAuthUser.execute({
                ...registerParams,
                documentoLegalIds: documentIds
            });

            const params =
                GoogleAuthLambdaService.execute.mock.calls[0][0];

            expect(params.documentoLegalIds)
                .toBe(documentIds);

            expect(params.documentoLegalIds)
                .toEqual([52, 48]);
        });

        test('no transmite documentos legales durante el login', async () => {

            await GoogleAuthUser.execute({
                ...loginParams,
                documentoLegalIds
            });

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith({
                action: 'login',
                email: 'user@example.com',
                firebaseUid
            });
        });

        test('elimina espacios externos del nombre recibido', async () => {

            await GoogleAuthUser.execute({
                ...registerParams,
                nombre: '  Ana López  '
            });

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    nombre: 'Ana López'
                })
            );
        });
    });

    describe('Seguridad del payload interno', () => {

        test.each([
            'login',
            'register'
        ])('utiliza exclusivamente la identidad del token durante %s', async action => {

            await GoogleAuthUser.execute({
                ...registerParams,
                action,
                email: 'other@example.com',
                firebaseUid: 'ForgedFirebaseUID',
                firebase_uid: 'OtherFirebaseUID',
                usuarioId: 99,
                metodoAceptacion: 'tradicional',
                fechaAceptacion: '2026-11-24T21:32:35Z'
            });

            const expectedParams = {
                action,
                email: 'user@example.com',
                firebaseUid
            };

            if (action === 'register') {

                expectedParams.nombre = 'Nombre Google';

                expectedParams.documentoLegalIds =
                    documentoLegalIds;
            }

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledTimes(1);

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledWith(expectedParams);
        });

        test.each([
            'login',
            'register'
        ])('no transmite el token Firebase hacia la Lambda interna durante %s', async action => {

            await GoogleAuthUser.execute({
                ...registerParams,
                action
            });

            const params =
                GoogleAuthLambdaService.execute.mock.calls[0][0];

            expect(params)
                .not.toHaveProperty('idToken');

            expect(params)
                .not.toHaveProperty('token');

            expect(params)
                .not.toHaveProperty('authorization');

            expect(JSON.stringify(params))
                .not.toContain(token);
        });
    });

    describe('Contrato de respuesta y errores legales', () => {

        test.each([
            'login',
            'register'
        ])('conserva el contrato de respuesta durante %s', async action => {

            const response = {
                success: true,
                action,
                email: 'user@example.com'
            };

            GoogleAuthLambdaService.execute
                .mockResolvedValue(response);

            const result =
                await GoogleAuthUser.execute({
                    ...registerParams,
                    action
                });

            expect(result).toBe(response);

            expect(result)
                .not.toHaveProperty('firebaseUid');

            expect(result)
                .not.toHaveProperty('firebase_uid');

            expect(result)
                .not.toHaveProperty('idToken');
        });

        test.each([
            400,
            401,
            409,
            503
        ])('propaga error interno %i durante el registro', async statusCode => {

            const error = {
                statusCode,
                message: 'Internal legal operation error'
            };

            GoogleAuthLambdaService.execute
                .mockRejectedValue(error);

            await expect(
                GoogleAuthUser.execute(registerParams)
            ).rejects.toBe(error);

            expect(
                GoogleAuthLambdaService.execute
            ).toHaveBeenCalledTimes(1);
        });
    });
});
