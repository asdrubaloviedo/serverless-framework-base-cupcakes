jest.mock(
    '@user/services/user/FirebaseAuthService',
    () => ({
        getAuth: jest.fn()
    })
);

const FirebaseAuthService = require(
    '@user/services/user/FirebaseAuthService'
);

const LegalAuthService = require(
    '@user/services/user/LegalAuthService'
);

const verifyIdToken = jest.fn();

const token = 'valid-firebase-token-123456789';

const firebaseUid = 'AbCdEf123FirebaseUID';

const googleDecoded = {
    uid: firebaseUid,
    email: 'USER@EXAMPLE.COM',
    email_verified: true,
    firebase: {
        sign_in_provider: 'google.com'
    }
};

const passwordDecoded = {
    ...googleDecoded,
    email_verified: false,
    firebase: {
        sign_in_provider: 'password'
    }
};

const requiredTokenError = {
    statusCode: 401,
    message: 'Token de autenticación requerido'
};

const invalidTokenError = {
    statusCode: 401,
    message: 'Token de Firebase inválido o expirado'
};

const invalidIdentityError = {
    statusCode: 403,
    message: 'Identidad de usuario no válida'
};

const unverifiedEmailError = {
    statusCode: 403,
    message: 'Debe verificar su correo electrónico'
};

const unavailableServiceError = {
    statusCode: 503,
    message: 'Servicio de autenticación no disponible'
};

let consoleErrorSpy;

beforeEach(() => {

    jest.resetAllMocks();

    FirebaseAuthService.getAuth.mockReturnValue({
        verifyIdToken
    });

    verifyIdToken.mockResolvedValue(googleDecoded);

    consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
});

afterEach(() => {

    consoleErrorSpy.mockRestore();
});

describe('LegalAuthService', () => {

    describe('Extracción del Bearer Token', () => {

        test.each([
            'Authorization',
            'authorization',
            'AUTHORIZATION',
            'AuThOrIzAtIoN'
        ])('reconoce la cabecera %s', headerName => {

            const headers = {
                [headerName]: `Bearer ${token}`
            };

            expect(
                LegalAuthService.getBearerToken(headers)
            ).toBe(token);
        });

        test.each([
            'Bearer',
            'bearer',
            'BEARER',
            'BeArEr'
        ])('reconoce el esquema de autenticación %s', scheme => {

            expect(
                LegalAuthService.getBearerToken({
                    Authorization: `${scheme} ${token}`
                })
            ).toBe(token);
        });

        test.each([
            ' ',
            '  ',
            '   ',
            '\t'
        ])('acepta separadores válidos entre Bearer y el token: %p', separator => {

            expect(
                LegalAuthService.getBearerToken({
                    Authorization:
                        `Bearer${separator}${token}`
                })
            ).toBe(token);
        });

        test('extrae el token cuando existen otras cabeceras HTTP', () => {

            const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Request-Id': 'request-123'
            };

            expect(
                LegalAuthService.getBearerToken(headers)
            ).toBe(token);
        });

        test.each([
            ['cabeceras ausentes', undefined],
            ['cabeceras nulas', null],
            ['cabeceras vacías', {}],
            [
                'cabeceras sin autorización',
                {
                    'Content-Type': 'application/json'
                }
            ],
            [
                'autorización undefined',
                { Authorization: undefined }
            ],
            [
                'autorización nula',
                { Authorization: null }
            ],
            [
                'autorización numérica',
                { Authorization: 12345 }
            ],
            [
                'autorización booleana',
                { Authorization: true }
            ],
            [
                'autorización como objeto',
                {
                    Authorization: {
                        token
                    }
                }
            ],
            [
                'autorización como arreglo',
                {
                    Authorization: [
                        `Bearer ${token}`
                    ]
                }
            ]
        ])('rechaza %s', (description, headers) => {

            expect(
                () => LegalAuthService.getBearerToken(
                    headers
                )
            ).toThrow(
                expect.objectContaining(
                    requiredTokenError
                )
            );

            expect(
                FirebaseAuthService.getAuth
            ).not.toHaveBeenCalled();

            expect(
                verifyIdToken
            ).not.toHaveBeenCalled();
        });

        test.each([
            ['cadena vacía', ''],
            ['espacios únicamente', '   '],
            ['token sin esquema', token],
            ['esquema Basic', `Basic ${token}`],
            ['esquema Token', `Token ${token}`],
            ['Bearer sin token', 'Bearer'],
            ['Bearer con espacios únicamente', 'Bearer   '],
            ['Bearer sin separador', `Bearer${token}`],
            ['token con espacios internos', 'Bearer abc def'],
            ['espacio inicial', ` Bearer ${token}`],
            ['espacio final', `Bearer ${token} `],
            [
                'múltiples tokens',
                `Bearer ${token} another-token`
            ]
        ])('rechaza autorización con %s', (
            description,
            authorization
        ) => {

            expect(
                () => LegalAuthService.getBearerToken({
                    Authorization: authorization
                })
            ).toThrow(
                expect.objectContaining(
                    requiredTokenError
                )
            );
        });

        test('no modifica las cabeceras originales', () => {

            const headers = Object.freeze({
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            });

            expect(
                LegalAuthService.getBearerToken(headers)
            ).toBe(token);

            expect(headers).toEqual({
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            });
        });
    });

    describe('Validación inicial del token Firebase', () => {

        test('rechaza la ausencia de parámetros', async () => {

            await expect(
                LegalAuthService.execute()
            ).rejects.toEqual(requiredTokenError);

            expect(
                FirebaseAuthService.getAuth
            ).not.toHaveBeenCalled();

            expect(
                verifyIdToken
            ).not.toHaveBeenCalled();
        });

        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['espacios en blanco', '   '],
            ['tabulaciones', '\t\t'],
            ['número', 12345],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', [token]]
        ])('rechaza un token inválido: %s', async (
            description,
            idToken
        ) => {

            await expect(
                LegalAuthService.execute({
                    idToken
                })
            ).rejects.toEqual(requiredTokenError);

            expect(
                FirebaseAuthService.getAuth
            ).not.toHaveBeenCalled();

            expect(
                verifyIdToken
            ).not.toHaveBeenCalled();
        });

        test('valida el token comprobando su revocación', async () => {

            await LegalAuthService.execute({
                idToken: token
            });

            expect(
                FirebaseAuthService.getAuth
            ).toHaveBeenCalledTimes(1);

            expect(
                verifyIdToken
            ).toHaveBeenCalledTimes(1);

            expect(
                verifyIdToken
            ).toHaveBeenCalledWith(token, true);
        });

        test('transmite el token original sin modificarlo', async () => {

            const originalToken = ` ${token} `;

            await LegalAuthService.execute({
                idToken: originalToken
            });

            expect(
                verifyIdToken
            ).toHaveBeenCalledWith(
                originalToken,
                true
            );
        });
    });

    describe('Autenticación mediante proveedores permitidos', () => {

        test('autentica una cuenta Google con correo verificado', async () => {

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).resolves.toEqual({
                uid: firebaseUid,
                email: 'user@example.com',
                provider: 'google.com'
            });
        });

        test('autentica una cuenta tradicional con correo verificado', async () => {

            verifyIdToken.mockResolvedValue({
                ...passwordDecoded,
                email_verified: true
            });

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).resolves.toEqual({
                uid: firebaseUid,
                email: 'user@example.com',
                provider: 'password'
            });
        });

        test.each([
            false,
            undefined,
            null
        ])('autentica una cuenta tradicional con email_verified=%p', async emailVerified => {

            verifyIdToken.mockResolvedValue({
                ...passwordDecoded,
                email_verified: emailVerified
            });

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).resolves.toEqual({
                uid: firebaseUid,
                email: 'user@example.com',
                provider: 'password'
            });
        });

        test.each([
            false,
            undefined,
            null,
            'true',
            1
        ])('rechaza una cuenta Google con email_verified=%p', async emailVerified => {

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                email_verified: emailVerified
            });

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).rejects.toEqual(
                unverifiedEmailError
            );
        });

        test.each([
            'anonymous',
            'facebook.com',
            'github.com',
            'apple.com',
            'phone',
            'custom',
            'twitter.com',
            'GOOGLE.COM',
            'PASSWORD',
            '',
            null,
            undefined
        ])('rechaza un proveedor no permitido: %p', async provider => {

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                firebase: {
                    sign_in_provider: provider
                }
            });

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).rejects.toEqual(
                invalidIdentityError
            );
        });

        test.each([
            undefined,
            null,
            {}
        ])('rechaza una identidad sin proveedor Firebase válido: %p', async firebase => {

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                firebase
            });

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).rejects.toEqual(
                invalidIdentityError
            );
        });
    });

    describe('Validación del Firebase UID', () => {

        test.each([
            'password',
            'google.com'
        ])('conserva mayúsculas y minúsculas del UID para %s', async provider => {

            const originalUid = 'AbCdEf123XyZ';

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                uid: originalUid,
                firebase: {
                    sign_in_provider: provider
                }
            });

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).resolves.toEqual({
                uid: originalUid,
                email: 'user@example.com',
                provider
            });
        });

        test.each([
            'password',
            'google.com'
        ])('acepta un UID de un carácter para %s', async provider => {

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                uid: 'A',
                firebase: {
                    sign_in_provider: provider
                }
            });

            const result =
                await LegalAuthService.execute({
                    idToken: token
                });

            expect(result.uid).toBe('A');
        });

        test.each([
            'password',
            'google.com'
        ])('acepta un UID de 128 caracteres para %s', async provider => {

            const maximumUid = 'A'.repeat(128);

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                uid: maximumUid,
                firebase: {
                    sign_in_provider: provider
                }
            });

            const result =
                await LegalAuthService.execute({
                    idToken: token
                });

            expect(result.uid).toBe(maximumUid);

            expect(result.uid).toHaveLength(128);
        });

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

        describe.each([
            'password',
            'google.com'
        ])('proveedor %s', provider => {

            test.each(invalidUids)(
                'rechaza Firebase UID inválido: %s',
                async (description, invalidUid) => {

                    verifyIdToken.mockResolvedValue({
                        ...googleDecoded,
                        uid: invalidUid,
                        firebase: {
                            sign_in_provider: provider
                        }
                    });

                    await expect(
                        LegalAuthService.execute({
                            idToken: token
                        })
                    ).rejects.toEqual(
                        invalidIdentityError
                    );
                }
            );
        });
    });

    describe('Validación y normalización del correo electrónico', () => {

        test.each([
            'password',
            'google.com'
        ])('normaliza mayúsculas del correo para %s', async provider => {

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                email: 'USER@EXAMPLE.COM',
                firebase: {
                    sign_in_provider: provider
                }
            });

            const result =
                await LegalAuthService.execute({
                    idToken: token
                });

            expect(result.email)
                .toBe('user@example.com');
        });

        test.each([
            'password',
            'google.com'
        ])('elimina espacios externos del correo para %s', async provider => {

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                email: '  User@Example.COM  ',
                firebase: {
                    sign_in_provider: provider
                }
            });

            const result =
                await LegalAuthService.execute({
                    idToken: token
                });

            expect(result.email)
                .toBe('user@example.com');
        });

        const invalidEmails = [
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['espacios en blanco', '   '],
            ['número', 12345],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['user@example.com']]
        ];

        describe.each([
            'password',
            'google.com'
        ])('proveedor %s', provider => {

            test.each(invalidEmails)(
                'rechaza correo inválido: %s',
                async (description, invalidEmail) => {

                    verifyIdToken.mockResolvedValue({
                        ...googleDecoded,
                        email: invalidEmail,
                        firebase: {
                            sign_in_provider: provider
                        }
                    });

                    await expect(
                        LegalAuthService.execute({
                            idToken: token
                        })
                    ).rejects.toEqual(
                        invalidIdentityError
                    );
                }
            );
        });
    });

    describe('Tratamiento de errores de Firebase Admin', () => {

        const invalidTokenCodes = [
            'auth/argument-error',
            'auth/invalid-argument',
            'auth/invalid-id-token',
            'auth/id-token-expired',
            'auth/id-token-revoked',
            'auth/user-disabled',
            'auth/user-not-found'
        ];

        test.each(invalidTokenCodes)(
            'responde 401 ante el error Firebase %s',
            async code => {

                const error = Object.assign(
                    new Error('Firebase authentication error'),
                    { code }
                );

                verifyIdToken.mockRejectedValue(error);

                await expect(
                    LegalAuthService.execute({
                        idToken: token
                    })
                ).rejects.toEqual(
                    invalidTokenError
                );

                expect(
                    verifyIdToken
                ).toHaveBeenCalledTimes(1);

                expect(
                    consoleErrorSpy
                ).toHaveBeenCalledWith(
                    '[LegalAuth] Error de autenticación Firebase',
                    { code }
                );
            }
        );

        test.each([
            'auth/internal-error',
            'auth/network-request-failed',
            'auth/invalid-credential',
            'app/no-app',
            'ECONNRESET',
            'ETIMEDOUT',
            'UNKNOWN_ERROR'
        ])('responde 503 ante un error de disponibilidad %s', async code => {

            const error = Object.assign(
                new Error('Sensitive internal information'),
                { code }
            );

            verifyIdToken.mockRejectedValue(error);

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).rejects.toEqual(
                unavailableServiceError
            );

            expect(
                consoleErrorSpy
            ).toHaveBeenCalledWith(
                '[LegalAuth] Error de autenticación Firebase',
                { code }
            );
        });

        test('responde 503 cuando Firebase genera un error sin código', async () => {

            verifyIdToken.mockRejectedValue(
                new Error('Firebase unavailable')
            );

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).rejects.toEqual(
                unavailableServiceError
            );

            expect(
                consoleErrorSpy
            ).toHaveBeenCalledWith(
                '[LegalAuth] Error de autenticación Firebase',
                { code: undefined }
            );
        });

        test('responde 503 cuando falla la inicialización de Firebase', async () => {

            FirebaseAuthService.getAuth
                .mockImplementation(() => {

                    throw new Error(
                        'Firebase initialization failed'
                    );
                });

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).rejects.toEqual(
                unavailableServiceError
            );

            expect(
                verifyIdToken
            ).not.toHaveBeenCalled();
        });

        test('responde 401 cuando la inicialización genera un código de token inválido', async () => {

            FirebaseAuthService.getAuth
                .mockImplementation(() => {

                    throw Object.assign(
                        new Error('Invalid argument'),
                        {
                            code: 'auth/argument-error'
                        }
                    );
                });

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).rejects.toEqual(
                invalidTokenError
            );

            expect(
                verifyIdToken
            ).not.toHaveBeenCalled();
        });

        test('responde 503 cuando Firebase no devuelve una instancia de autenticación', async () => {

            FirebaseAuthService.getAuth
                .mockReturnValue(null);

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).rejects.toEqual(
                unavailableServiceError
            );

            expect(
                verifyIdToken
            ).not.toHaveBeenCalled();
        });

        test('no expone el token ni los detalles sensibles en los logs', async () => {

            const sensitiveMessage =
                `Internal authentication error: ${token}`;

            verifyIdToken.mockRejectedValue(
                Object.assign(
                    new Error(sensitiveMessage),
                    {
                        code: 'auth/internal-error'
                    }
                )
            );

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).rejects.toEqual(
                unavailableServiceError
            );

            expect(
                consoleErrorSpy
            ).toHaveBeenCalledTimes(1);

            expect(
                consoleErrorSpy
            ).toHaveBeenCalledWith(
                '[LegalAuth] Error de autenticación Firebase',
                {
                    code: 'auth/internal-error'
                }
            );

            const logs = JSON.stringify(
                consoleErrorSpy.mock.calls
            );

            expect(logs)
                .not.toContain(token);

            expect(logs)
                .not.toContain(sensitiveMessage);
        });
    });

    describe('Seguridad y contrato de identidad autenticada', () => {

        test.each([
            'password',
            'google.com'
        ])('obtiene exclusivamente la identidad del token para %s', async provider => {

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                firebase: {
                    sign_in_provider: provider
                }
            });

            await expect(
                LegalAuthService.execute({
                    idToken: token,
                    uid: 'ForgedUID',
                    firebaseUid: 'OtherFirebaseUID',
                    firebase_uid: 'AnotherFirebaseUID',
                    email: 'other@example.com',
                    provider: 'anonymous',
                    usuarioId: 99,
                    documentoLegalIds: [12, 35],
                    metodoAceptacion: 'manual'
                })
            ).resolves.toEqual({
                uid: firebaseUid,
                email: 'user@example.com',
                provider
            });
        });

        test.each([
            'password',
            'google.com'
        ])('devuelve únicamente los campos permitidos para %s', async provider => {

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                name: 'Nombre de usuario',
                picture: 'https://example.com/avatar',
                phone_number: '+123456789',
                auth_time: 1234567890,
                exp: 1234569999,
                iat: 1234567890,
                customClaim: 'internal-value',
                firebase: {
                    sign_in_provider: provider
                }
            });

            const result =
                await LegalAuthService.execute({
                    idToken: token
                });

            expect(result).toEqual({
                uid: firebaseUid,
                email: 'user@example.com',
                provider
            });

            expect(
                Object.keys(result).sort()
            ).toEqual([
                'email',
                'provider',
                'uid'
            ]);

            expect(result)
                .not.toHaveProperty('idToken');

            expect(result)
                .not.toHaveProperty('token');

            expect(result)
                .not.toHaveProperty('email_verified');

            expect(result)
                .not.toHaveProperty('firebase');

            expect(result)
                .not.toHaveProperty('customClaim');

            expect(
                JSON.stringify(result)
            ).not.toContain(token);
        });

        test('no modifica los datos originales obtenidos de Firebase', async () => {

            const immutableDecoded = Object.freeze({
                ...googleDecoded,
                firebase: Object.freeze({
                    ...googleDecoded.firebase
                })
            });

            verifyIdToken.mockResolvedValue(
                immutableDecoded
            );

            await expect(
                LegalAuthService.execute({
                    idToken: token
                })
            ).resolves.toEqual({
                uid: firebaseUid,
                email: 'user@example.com',
                provider: 'google.com'
            });

            expect(immutableDecoded)
                .toEqual(googleDecoded);

            expect(immutableDecoded.email)
                .toBe('USER@EXAMPLE.COM');
        });
    });

    describe('Autenticación integrada mediante cabeceras HTTP', () => {

        test('autentica una solicitud HTTP de un usuario Google', async () => {

            await expect(
                LegalAuthService.authenticate({
                    Authorization: `Bearer ${token}`
                })
            ).resolves.toEqual({
                uid: firebaseUid,
                email: 'user@example.com',
                provider: 'google.com'
            });

            expect(
                verifyIdToken
            ).toHaveBeenCalledWith(token, true);

            expect(
                verifyIdToken
            ).toHaveBeenCalledTimes(1);
        });

        test('autentica una solicitud HTTP de un usuario tradicional', async () => {

            verifyIdToken.mockResolvedValue(
                passwordDecoded
            );

            await expect(
                LegalAuthService.authenticate({
                    authorization: `bearer ${token}`
                })
            ).resolves.toEqual({
                uid: firebaseUid,
                email: 'user@example.com',
                provider: 'password'
            });

            expect(
                verifyIdToken
            ).toHaveBeenCalledWith(token, true);
        });

        test.each([
            undefined,
            null,
            {},
            { Authorization: '' },
            { Authorization: 'Bearer' },
            { Authorization: `Basic ${token}` }
        ])('rechaza una solicitud sin Bearer Token válido: %p', async headers => {

            await expect(
                LegalAuthService.authenticate(headers)
            ).rejects.toEqual(
                requiredTokenError
            );

            expect(
                FirebaseAuthService.getAuth
            ).not.toHaveBeenCalled();

            expect(
                verifyIdToken
            ).not.toHaveBeenCalled();
        });

        test.each([
            'auth/id-token-expired',
            'auth/id-token-revoked',
            'auth/user-disabled'
        ])('propaga el error 401 durante authenticate: %s', async code => {

            verifyIdToken.mockRejectedValue(
                Object.assign(
                    new Error('Authentication failed'),
                    { code }
                )
            );

            await expect(
                LegalAuthService.authenticate({
                    Authorization: `Bearer ${token}`
                })
            ).rejects.toEqual(
                invalidTokenError
            );
        });

        test('propaga el error 403 cuando la identidad no es válida', async () => {

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                uid: ''
            });

            await expect(
                LegalAuthService.authenticate({
                    Authorization: `Bearer ${token}`
                })
            ).rejects.toEqual(
                invalidIdentityError
            );
        });

        test('propaga el error 403 cuando el correo Google no está verificado', async () => {

            verifyIdToken.mockResolvedValue({
                ...googleDecoded,
                email_verified: false
            });

            await expect(
                LegalAuthService.authenticate({
                    Authorization: `Bearer ${token}`
                })
            ).rejects.toEqual(
                unverifiedEmailError
            );
        });

        test('propaga el error 503 cuando Firebase no está disponible', async () => {

            verifyIdToken.mockRejectedValue(
                Object.assign(
                    new Error('Firebase unavailable'),
                    {
                        code: 'auth/internal-error'
                    }
                )
            );

            await expect(
                LegalAuthService.authenticate({
                    Authorization: `Bearer ${token}`
                })
            ).rejects.toEqual(
                unavailableServiceError
            );
        });
    });
});