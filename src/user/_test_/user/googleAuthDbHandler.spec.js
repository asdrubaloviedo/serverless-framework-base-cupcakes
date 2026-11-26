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

const firebaseUid = 'AbCdEf123FirebaseUID';

const documentoLegalIds = [12, 35];

const loginEvent = {
    action: 'login',
    email,
    firebaseUid
};

const registerEvent = {
    action: 'register',
    email,
    firebaseUid,
    nombre: 'Ana López',
    documentoLegalIds
};

const invalidParamsResponse = {
    success: false,
    statusCode: 400,
    message: 'Parámetros internos inválidos'
};

const internalErrorResponse = {
    success: false,
    statusCode: 500,
    message: 'Error interno del servidor'
};

const operations = [
    ['login', loginEvent],
    ['register', registerEvent]
];

let logSpy;
let warnSpy;
let errorSpy;

beforeEach(() => {

    jest.resetAllMocks();

    logSpy = jest.spyOn(console, 'log')
        .mockImplementation(() => {});

    warnSpy = jest.spyOn(console, 'warn')
        .mockImplementation(() => {});

    errorSpy = jest.spyOn(console, 'error')
        .mockImplementation(() => {});
});

afterEach(() => {

    jest.restoreAllMocks();
});


const expectInvalidEvent = async event => {

    await expect(
        handler(event)
    ).resolves.toEqual(
        invalidParamsResponse
    );

    expect(
        GoogleAuthDatabase.execute
    ).not.toHaveBeenCalled();
};


describe('Google Auth Database Handler', () => {

    /*
     * =====================================================
     * CASOS ORIGINALES CONSERVADOS Y READAPTADOS
     * =====================================================
     */

    describe('Casos originales', () => {

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
                handler(loginEvent)
            ).resolves.toEqual(response);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith(loginEvent);
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
                handler(registerEvent)
            ).resolves.toEqual(response);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith(registerEvent);
        });


        test('normaliza el correo electrónico', async () => {

            GoogleAuthDatabase.execute.mockResolvedValue({
                success: true,
                action: 'login',
                email
            });

            await handler({
                ...loginEvent,
                email: '  USER@EXAMPLE.COM  '
            });

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith(loginEvent);
        });


        test('elimina espacios del nombre', async () => {

            await handler({
                ...registerEvent,
                nombre: '  Ana López  '
            });

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith(registerEvent);
        });


        test.each([
            [undefined],
            [null],
            [{}],
            [{
                action: 'login',
                firebaseUid
            }],
            [{
                ...loginEvent,
                email: 'invalid'
            }],
            [{
                ...loginEvent,
                action: 'delete'
            }],
            [{
                action: 'register',
                email,
                firebaseUid,
                documentoLegalIds
            }],
            [{
                ...registerEvent,
                nombre: ''
            }],
            [{
                ...registerEvent,
                nombre: '   '
            }],
            [{
                ...loginEvent,
                nombre: 'Unexpected name'
            }],
            [{
                ...loginEvent,
                idToken: 'unexpected-token'
            }],
            [{
                ...registerEvent,
                rol_id: 1
            }]
        ])('rechaza parámetros internos inválidos', async event => {

            await expectInvalidEvent(event);
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
                ? registerEvent
                : loginEvent;

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
                handler(loginEvent)
            ).resolves.toEqual(
                internalErrorResponse
            );
        });


        test('error con código desconocido: devuelve 500', async () => {

            GoogleAuthDatabase.execute.mockRejectedValue({
                statusCode: 999,
                message: 'Unknown error'
            });

            await expect(
                handler(loginEvent)
            ).resolves.toEqual(
                internalErrorResponse
            );
        });
    });


    /*
     * =====================================================
     * FIREBASE UID
     * =====================================================
     */

    describe('Validación de la identidad Firebase', () => {

        const validUids = [
            ['longitud mínima', 'A'],
            ['mayúsculas y minúsculas', 'AbCdEf123XyZ'],
            ['caracteres especiales', 'Firebase_UID-123'],
            ['longitud máxima', 'A'.repeat(128)],
            ['espacios exteriores', '  FirebaseUID123  '],
            ['espacios interiores', 'Firebase UID 123']
        ];

        const invalidUids = [
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['espacios', '   '],
            ['tabulaciones', '\t\t'],
            ['saltos de línea', '\n\n'],
            ['espacios combinados', ' \t\n '],
            ['129 caracteres', 'A'.repeat(129)],
            ['256 caracteres', 'A'.repeat(256)],
            ['número', 123],
            ['booleano true', true],
            ['booleano false', false],
            ['objeto', {}],
            ['arreglo vacío', []],
            ['arreglo con UID', ['FirebaseUID123']]
        ];


        describe.each(operations)(
            'operación %s',
            (action, event) => {

                test.each(validUids)(
                    'conserva exactamente el Firebase UID: %s',
                    async (
                        description,
                        originalUid
                    ) => {

                        const params = {
                            ...event,
                            firebaseUid: originalUid
                        };

                        const response = {
                            success: true,
                            action
                        };

                        GoogleAuthDatabase.execute
                            .mockResolvedValue(response);

                        await expect(
                            handler(params)
                        ).resolves.toBe(response);

                        expect(
                            GoogleAuthDatabase.execute
                        ).toHaveBeenCalledWith(params);

                        expect(
                            GoogleAuthDatabase.execute
                        ).toHaveBeenCalledTimes(1);

                        expect(
                            GoogleAuthDatabase.execute
                                .mock.calls[0][0]
                                .firebaseUid
                        ).toBe(originalUid);
                    }
                );


                test.each(invalidUids)(
                    'rechaza Firebase UID inválido: %s',
                    async (
                        description,
                        invalidUid
                    ) => {

                        await expectInvalidEvent({
                            ...event,
                            firebaseUid: invalidUid
                        });
                    }
                );


                test('rechaza la ausencia de Firebase UID', async () => {

                    const {
                        firebaseUid: omittedUid,
                        ...params
                    } = event;

                    await expectInvalidEvent(params);
                });


                test('no admite uid como sustituto de firebaseUid', async () => {

                    const {
                        firebaseUid: omittedUid,
                        ...params
                    } = event;

                    await expectInvalidEvent({
                        ...params,
                        uid: firebaseUid
                    });
                });


                test('no admite firebase_uid como sustituto de firebaseUid', async () => {

                    const {
                        firebaseUid: omittedUid,
                        ...params
                    } = event;

                    await expectInvalidEvent({
                        ...params,
                        firebase_uid: firebaseUid
                    });
                });
            }
        );
    });


    /*
     * =====================================================
     * EMAIL
     * =====================================================
     */

    describe('Validación y normalización del correo electrónico', () => {

        const validEmails = [
            [
                'USER@EXAMPLE.COM',
                'user@example.com'
            ],
            [
                '  User@Example.Com  ',
                'user@example.com'
            ],
            [
                '\tUser@Example.Com\n',
                'user@example.com'
            ],
            [
                'User+Tag@Example.Com',
                'user+tag@example.com'
            ],
            [
                'User@Sub.Example.Com',
                'user@sub.example.com'
            ]
        ];

        const invalidEmails = [
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['espacios', '   '],
            ['sin arroba', 'user.example.com'],
            ['sin usuario', '@example.com'],
            ['sin dominio', 'user@'],
            ['sin extensión', 'user@example'],
            ['dos arrobas', 'user@@example.com'],
            ['espacio interior', 'user name@example.com'],
            ['número', 123],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', [email]]
        ];


        describe.each(operations)(
            'operación %s',
            (action, event) => {

                test.each(validEmails)(
                    'normaliza %s como %s',
                    async (
                        originalEmail,
                        normalizedEmail
                    ) => {

                        await handler({
                            ...event,
                            email: originalEmail
                        });

                        expect(
                            GoogleAuthDatabase.execute
                        ).toHaveBeenCalledWith({
                            ...event,
                            email: normalizedEmail
                        });

                        expect(
                            GoogleAuthDatabase.execute
                                .mock.calls[0][0]
                                .firebaseUid
                        ).toBe(firebaseUid);
                    }
                );


                test.each(invalidEmails)(
                    'rechaza correo inválido: %s',
                    async (
                        description,
                        invalidEmail
                    ) => {

                        await expectInvalidEvent({
                            ...event,
                            email: invalidEmail
                        });
                    }
                );
            }
        );
    });


    /*
     * =====================================================
     * REGISTER NAME
     * =====================================================
     */

    describe('Validación del nombre durante el registro', () => {

        test.each([
            ['  María José Muñoz  ', 'María José Muñoz'],
            ['\tAna López\n', 'Ana López'],
            ['A', 'A'],
            ['Ana  López', 'Ana  López'],
            ['Jean-Pierre', 'Jean-Pierre']
        ])('normaliza el nombre %s como %s', async (
            originalName,
            normalizedName
        ) => {

            await handler({
                ...registerEvent,
                nombre: originalName
            });

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith({
                ...registerEvent,
                nombre: normalizedName
            });
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['tabulaciones', '\t\t'],
            ['saltos de línea', '\n\n'],
            ['número', 123],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['Ana López']]
        ])('rechaza nombre inválido: %s', async (
            description,
            invalidName
        ) => {

            await expectInvalidEvent({
                ...registerEvent,
                nombre: invalidName
            });
        });


        test('el esquema interno no impone una longitud máxima al nombre', async () => {

            const nombre = 'A'.repeat(129);

            await handler({
                ...registerEvent,
                nombre
            });

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith({
                ...registerEvent,
                nombre
            });
        });
    });


    /*
     * =====================================================
     * LEGAL DOCUMENTS
     * =====================================================
     */

    describe('Validación de documentos legales durante el registro', () => {

        test.each([
            ['identificadores mínimos', [1, 2]],
            ['versiones actuales simuladas', [12, 35]],
            ['versiones futuras simuladas', [48, 52]],
            ['orden inverso', [52, 48]],
            ['identificadores no consecutivos', [100, 500]]
        ])('acepta dos identificadores válidos: %s', async (
            description,
            documentIds
        ) => {

            const params = {
                ...registerEvent,
                documentoLegalIds: documentIds
            };

            const response = {
                success: true,
                action: 'register'
            };

            GoogleAuthDatabase.execute
                .mockResolvedValue(response);

            await expect(
                handler(params)
            ).resolves.toBe(response);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith(params);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledTimes(1);

            expect(
                GoogleAuthDatabase.execute
                    .mock.calls[0][0]
                    .documentoLegalIds
            ).toEqual(documentIds);
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['arreglo vacío', []],
            ['un identificador', [12]],
            ['tres identificadores', [12, 35, 48]],
            ['cuatro identificadores', [12, 35, 48, 52]],
            ['identificadores duplicados', [12, 12]],
            ['identificador cero', [0, 35]],
            ['segundo identificador cero', [12, 0]],
            ['identificador negativo', [-12, 35]],
            ['segundo identificador negativo', [12, -35]],
            ['identificador decimal', [12.5, 35]],
            ['segundo identificador decimal', [12, 35.5]],
            ['identificador como cadena', ['12', 35]],
            ['ambos como cadenas', ['12', '35']],
            ['identificador null', [null, 35]],
            ['identificador undefined', [undefined, 35]],
            ['identificador booleano', [true, 35]],
            ['identificador objeto', [{ id: 12 }, 35]],
            ['identificador arreglo', [[12], 35]],
            ['NaN', [NaN, 35]],
            ['Infinity', [Infinity, 35]],
            ['cadena separada por comas', '12,35'],
            ['número', 12],
            ['booleano', true],
            ['objeto', { first: 12, second: 35 }]
        ])('rechaza documentos legales inválidos: %s', async (
            description,
            documentIds
        ) => {

            await expectInvalidEvent({
                ...registerEvent,
                documentoLegalIds: documentIds
            });
        });


        test('rechaza el registro sin la propiedad documentoLegalIds', async () => {

            const {
                documentoLegalIds: omittedIds,
                ...params
            } = registerEvent;

            await expectInvalidEvent(params);
        });


        test.each([
            ['arreglo válido', [12, 35]],
            ['arreglo vacío', []],
            ['null', null],
            ['undefined', undefined]
        ])('rechaza documentoLegalIds durante login: %s', async (
            description,
            documentIds
        ) => {

            await expectInvalidEvent({
                ...loginEvent,
                documentoLegalIds: documentIds
            });
        });


        test('no modifica el arreglo original de documentos legales', async () => {

            const originalDocumentIds =
                Object.freeze([52, 48]);

            const event = Object.freeze({
                ...registerEvent,
                documentoLegalIds: originalDocumentIds
            });

            await handler(event);

            expect(originalDocumentIds)
                .toEqual([52, 48]);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith({
                ...registerEvent,
                documentoLegalIds: [52, 48]
            });
        });


        test('delega la validación de vigencia de los documentos legales al servicio', async () => {

            const event = {
                ...registerEvent,
                documentoLegalIds: [100, 200]
            };

            const error = {
                statusCode: 409,
                message: 'Documentos legales no vigentes'
            };

            GoogleAuthDatabase.execute
                .mockRejectedValue(error);

            await expect(
                handler(event)
            ).resolves.toEqual({
                success: false,
                statusCode: 409,
                message: error.message
            });

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith(event);
        });
    });


    /*
     * =====================================================
     * INTERNAL REQUEST CONTRACT
     * =====================================================
     */

    describe('Contrato estricto de la solicitud interna', () => {

        const unexpectedFields = [
            ['idToken', 'unexpected-token'],
            ['token', 'unexpected-token'],
            ['authorization', 'Bearer unexpected-token'],
            ['headers', { authorization: 'Bearer token' }],
            ['password', 'unexpected-password'],
            ['uid', 'AlternativeUID'],
            ['firebase_uid', 'AlternativeUID'],
            ['usuarioId', 99],
            ['usuario_id', 99],
            ['rol_id', 1],
            ['provider', 'google.com'],
            ['email_verified', true],
            ['metodoAceptacion', 'manual'],
            ['fechaAceptacion', '2026-11-24T21:32:35Z'],
            ['pais', 'PER'],
            ['extra', undefined]
        ];


        describe.each(operations)(
            'operación %s',
            (action, event) => {

                test.each(unexpectedFields)(
                    'rechaza la propiedad adicional %s',
                    async (
                        fieldName,
                        fieldValue
                    ) => {

                        await expectInvalidEvent({
                            ...event,
                            [fieldName]: fieldValue
                        });
                    }
                );
            }
        );


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['mayúsculas', 'LOGIN'],
            ['espacios exteriores', ' login '],
            ['acción desconocida', 'update'],
            ['número', 1],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['login']]
        ])('rechaza acción inválida: %s', async (
            description,
            action
        ) => {

            await expectInvalidEvent({
                ...loginEvent,
                action
            });
        });


        test.each([
            ['cadena JSON', JSON.stringify(loginEvent)],
            ['arreglo vacío', []],
            ['arreglo con evento', [loginEvent]],
            ['número', 123],
            ['booleano', true],
            ['evento HTTP', {
                body: JSON.stringify(loginEvent)
            }],
            ['evento HTTP con headers', {
                headers: {
                    authorization: 'Bearer token'
                },
                body: JSON.stringify(loginEvent)
            }]
        ])('rechaza formato de evento no permitido: %s', async (
            description,
            event
        ) => {

            await expectInvalidEvent(event);
        });


        test('rechaza el nombre durante login incluso cuando es undefined', async () => {

            await expectInvalidEvent({
                ...loginEvent,
                nombre: undefined
            });
        });
    });


    /*
     * =====================================================
     * NORMALIZATION AND IMMUTABILITY
     * =====================================================
     */

    describe('Normalización e inmutabilidad de parámetros', () => {

        test('normaliza correo y nombre sin modificar el Firebase UID', async () => {

            const event = {
                ...registerEvent,
                email: '  USER@EXAMPLE.COM  ',
                nombre: '  Ana López  ',
                firebaseUid: 'AbCdEf123XyZ'
            };

            await handler(event);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith({
                ...registerEvent,
                firebaseUid: 'AbCdEf123XyZ'
            });
        });


        test('no modifica el evento original de login', async () => {

            const event = Object.freeze({
                ...loginEvent,
                email: '  USER@EXAMPLE.COM  '
            });

            await handler(event);

            expect(event).toEqual({
                ...loginEvent,
                email: '  USER@EXAMPLE.COM  '
            });

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith(loginEvent);
        });


        test('no modifica el evento original de registro', async () => {

            const event = Object.freeze({
                ...registerEvent,
                email: '  USER@EXAMPLE.COM  ',
                nombre: '  Ana López  ',
                documentoLegalIds: Object.freeze([
                    ...documentoLegalIds
                ])
            });

            await handler(event);

            expect(event).toEqual({
                ...registerEvent,
                email: '  USER@EXAMPLE.COM  ',
                nombre: '  Ana López  '
            });

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledWith(registerEvent);
        });


        test('Zod construye un objeto validado independiente del evento original', async () => {

            await handler(registerEvent);

            const params =
                GoogleAuthDatabase.execute
                    .mock.calls[0][0];

            expect(params)
                .not.toBe(registerEvent);

            expect(params)
                .toEqual(registerEvent);

            expect(params.documentoLegalIds)
                .not.toBe(documentoLegalIds);

            expect(params.documentoLegalIds)
                .toEqual(documentoLegalIds);
        });
    });


    /*
     * =====================================================
     * SUCCESS RESPONSE
     * =====================================================
     */

    describe('Contrato de respuesta exitosa', () => {

        describe.each(operations)(
            'operación %s',
            (action, event) => {

                test('conserva exactamente la referencia de la respuesta', async () => {

                    const response = {
                        success: true,
                        action,
                        email,
                        usuario: {
                            id: 25,
                            nombre: 'Ana López'
                        }
                    };

                    GoogleAuthDatabase.execute
                        .mockResolvedValue(response);

                    await expect(
                        handler(event)
                    ).resolves.toBe(response);

                    expect(
                        GoogleAuthDatabase.execute
                    ).toHaveBeenCalledTimes(1);
                });


                test('no convierte el resultado interno en una respuesta HTTP', async () => {

                    const response = {
                        success: true,
                        action,
                        email
                    };

                    GoogleAuthDatabase.execute
                        .mockResolvedValue(response);

                    const result = await handler(event);

                    expect(result).toEqual(response);

                    expect(result)
                        .not.toHaveProperty('body');

                    expect(result)
                        .not.toHaveProperty('headers');

                    expect(result)
                        .not.toHaveProperty('statusCode');
                });


                test('no modifica la respuesta original del servicio', async () => {

                    const response = Object.freeze({
                        success: true,
                        action,
                        email
                    });

                    GoogleAuthDatabase.execute
                        .mockResolvedValue(response);

                    await expect(
                        handler(event)
                    ).resolves.toBe(response);
                });
            }
        );


        test('conserva una respuesta con aceptaciones legales pendientes', async () => {

            const response = {
                success: true,
                action: 'login',
                documentosPendientes: [
                    { id: 48 },
                    { id: 52 }
                ]
            };

            GoogleAuthDatabase.execute
                .mockResolvedValue(response);

            await expect(
                handler(loginEvent)
            ).resolves.toBe(response);
        });


        test('conserva una respuesta con documentos legales registrados', async () => {

            const response = {
                success: true,
                action: 'register',
                documentoLegalIds
            };

            GoogleAuthDatabase.execute
                .mockResolvedValue(response);

            await expect(
                handler(registerEvent)
            ).resolves.toBe(response);
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['booleano', true],
            ['objeto vacío', {}]
        ])('devuelve sin validar una respuesta resuelta de tipo %s', async (
            description,
            response
        ) => {

            GoogleAuthDatabase.execute
                .mockResolvedValue(response);

            await expect(
                handler(loginEvent)
            ).resolves.toBe(response);
        });


        test('conserva una respuesta de negocio resuelta con success false', async () => {

            const response = {
                success: false,
                statusCode: 409,
                message: 'Conflicto de registro'
            };

            GoogleAuthDatabase.execute
                .mockResolvedValue(response);

            await expect(
                handler(registerEvent)
            ).resolves.toBe(response);
        });
    });


    /*
     * =====================================================
     * CONTROLLED ERRORS
     * =====================================================
     */

    describe('Propagación de errores controlados', () => {

        const controlledErrors = [
            [400, 'Operación no válida'],
            [401, 'Identidad de usuario no válida'],
            [404, 'Usuario no registrado'],
            [409, 'Conflicto de identidad'],
            [503, 'Servicio no disponible']
        ];


        describe.each(operations)(
            'operación %s',
            (action, event) => {

                test.each(controlledErrors)(
                    'propaga el error permitido %i',
                    async (
                        statusCode,
                        message
                    ) => {

                        GoogleAuthDatabase.execute
                            .mockRejectedValue({
                                statusCode,
                                message
                            });

                        await expect(
                            handler(event)
                        ).resolves.toEqual({
                            success: false,
                            statusCode,
                            message
                        });

                        expect(
                            GoogleAuthDatabase.execute
                        ).toHaveBeenCalledWith(event);

                        expect(
                            GoogleAuthDatabase.execute
                        ).toHaveBeenCalledTimes(1);
                    }
                );
            }
        );


        test('no devuelve propiedades adicionales de un error controlado', async () => {

            GoogleAuthDatabase.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message: 'Conflicto de registro',
                    code: '23505',
                    detail: 'Sensitive database detail',
                    stack: 'Sensitive stack trace',
                    query: 'SELECT sensitive_data'
                });

            await expect(
                handler(registerEvent)
            ).resolves.toEqual({
                success: false,
                statusCode: 409,
                message: 'Conflicto de registro'
            });
        });


        test('no reintenta automáticamente un registro fallido', async () => {

            GoogleAuthDatabase.execute
                .mockRejectedValue({
                    statusCode: 503,
                    message: 'Servicio no disponible'
                });

            await handler(registerEvent);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledTimes(1);
        });
    });


    /*
     * =====================================================
     * UNEXPECTED ERRORS
     * =====================================================
     */

    describe('Tratamiento de errores inesperados', () => {

        test.each([
            ['200', 200],
            ['201', 201],
            ['302', 302],
            ['403', 403],
            ['405', 405],
            ['422', 422],
            ['429', 429],
            ['500', 500],
            ['501', 501],
            ['502', 502],
            ['504', 504],
            ['negativo', -1],
            ['cero', 0],
            ['decimal', 400.5],
            ['NaN', NaN],
            ['Infinity', Infinity],
            ['cadena 400', '400'],
            ['cadena 401', '401'],
            ['cadena 404', '404'],
            ['cadena 409', '409'],
            ['cadena 503', '503'],
            ['undefined', undefined],
            ['null', null],
            ['booleano', true],
            ['objeto', {}]
        ])('normaliza a 500 el código no permitido: %s', async (
            description,
            statusCode
        ) => {

            GoogleAuthDatabase.execute
                .mockRejectedValue({
                    statusCode,
                    message: 'Sensitive internal error'
                });

            await expect(
                handler(loginEvent)
            ).resolves.toEqual(
                internalErrorResponse
            );

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledTimes(1);
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena', 'Unexpected error'],
            ['número', 123],
            ['booleano', true],
            ['objeto vacío', {}],
            ['arreglo', []],
            ['Error', new Error('Unexpected failure')],
            ['TypeError', new TypeError('Unexpected type')]
        ])('controla una excepción de tipo %s', async (
            description,
            error
        ) => {

            GoogleAuthDatabase.execute
                .mockRejectedValue(error);

            await expect(
                handler(registerEvent)
            ).resolves.toEqual(
                internalErrorResponse
            );
        });


        test('controla una excepción síncrona del servicio', async () => {

            GoogleAuthDatabase.execute
                .mockImplementation(() => {

                    throw new Error(
                        'Synchronous database error'
                    );
                });

            await expect(
                handler(loginEvent)
            ).resolves.toEqual(
                internalErrorResponse
            );
        });


        test('no expone detalles sensibles de PostgreSQL en la respuesta', async () => {

            const error = Object.assign(
                new Error(
                    'Sensitive database connection details'
                ),
                {
                    code: '23505',
                    detail: 'Sensitive constraint detail',
                    table: 'usuario',
                    query: 'SELECT sensitive_data'
                }
            );

            GoogleAuthDatabase.execute
                .mockRejectedValue(error);

            const response = await handler(registerEvent);

            expect(response)
                .toEqual(internalErrorResponse);

            expect(response)
                .not.toHaveProperty('code');

            expect(response)
                .not.toHaveProperty('detail');

            expect(response)
                .not.toHaveProperty('stack');

            expect(response)
                .not.toHaveProperty('query');
        });
    });


    /*
     * =====================================================
     * SAFE LOGGING
     * =====================================================
     */

    describe('Registro seguro de operaciones', () => {

        test.each(operations)(
            'registra únicamente la acción durante una operación %s exitosa',
            async (
                action,
                event
            ) => {

                GoogleAuthDatabase.execute
                    .mockResolvedValue({
                        success: true,
                        action
                    });

                await handler(event);

                expect(logSpy)
                    .toHaveBeenCalledTimes(2);

                expect(logSpy)
                    .toHaveBeenNthCalledWith(
                        1,
                        '[GoogleAuthDB] Iniciando operación',
                        { action }
                    );

                expect(logSpy)
                    .toHaveBeenNthCalledWith(
                        2,
                        '[GoogleAuthDB] Operación completada',
                        { action }
                    );

                expect(warnSpy)
                    .not.toHaveBeenCalled();

                expect(errorSpy)
                    .not.toHaveBeenCalled();
            }
        );


        test('no registra los datos sensibles de una solicitud inválida', async () => {

            const event = {
                ...registerEvent,
                idToken: 'SensitiveFirebaseToken',
                password: 'SensitivePassword'
            };

            await expectInvalidEvent(event);

            expect(warnSpy)
                .toHaveBeenCalledTimes(1);

            expect(warnSpy)
                .toHaveBeenCalledWith(
                    '[GoogleAuthDB] Solicitud interna inválida'
                );

            expect(logSpy)
                .not.toHaveBeenCalled();

            expect(errorSpy)
                .not.toHaveBeenCalled();

            const logs = JSON.stringify(
                warnSpy.mock.calls
            );

            expect(logs)
                .not.toContain(event.idToken);

            expect(logs)
                .not.toContain(event.password);

            expect(logs)
                .not.toContain(firebaseUid);

            expect(logs)
                .not.toContain(email);
        });


        test('no registra el correo ni el Firebase UID durante login', async () => {

            await handler(loginEvent);

            const logs = JSON.stringify(
                logSpy.mock.calls
            );

            expect(logs)
                .not.toContain(email);

            expect(logs)
                .not.toContain(firebaseUid);
        });


        test('no registra el nombre ni los documentos legales durante register', async () => {

            await handler(registerEvent);

            const logs = JSON.stringify(
                logSpy.mock.calls
            );

            expect(logs)
                .not.toContain(registerEvent.nombre);

            expect(logs)
                .not.toContain('documentoLegalIds');

            expect(logs)
                .not.toContain(email);

            expect(logs)
                .not.toContain(firebaseUid);
        });


        test('registra únicamente el statusCode y code de un error PostgreSQL', async () => {

            const error = Object.assign(
                new Error('Sensitive database message'),
                {
                    code: '23505',
                    detail: 'Sensitive database detail',
                    query: 'SELECT sensitive_data'
                }
            );

            GoogleAuthDatabase.execute
                .mockRejectedValue(error);

            await handler(registerEvent);

            expect(errorSpy)
                .toHaveBeenCalledTimes(1);

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[GoogleAuthDB] Error',
                    {
                        statusCode: 500,
                        code: '23505'
                    }
                );

            const logs = JSON.stringify(
                errorSpy.mock.calls
            );

            expect(logs)
                .not.toContain(error.message);

            expect(logs)
                .not.toContain(error.detail);

            expect(logs)
                .not.toContain(error.query);
        });


        test('registra el código HTTP permitido de un error de negocio', async () => {

            GoogleAuthDatabase.execute
                .mockRejectedValue({
                    statusCode: 409,
                    code: 'LEGAL_CONFLICT',
                    message: 'Conflicto de documentos legales'
                });

            await handler(registerEvent);

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[GoogleAuthDB] Error',
                    {
                        statusCode: 409,
                        code: 'LEGAL_CONFLICT'
                    }
                );
        });


        test('no registra una operación completada cuando el servicio falla', async () => {

            GoogleAuthDatabase.execute
                .mockRejectedValue(
                    new Error('Database unavailable')
                );

            await handler(loginEvent);

            expect(logSpy)
                .toHaveBeenCalledTimes(1);

            expect(logSpy)
                .toHaveBeenCalledWith(
                    '[GoogleAuthDB] Iniciando operación',
                    {
                        action: 'login'
                    }
                );

            expect(logSpy)
                .not.toHaveBeenCalledWith(
                    '[GoogleAuthDB] Operación completada',
                    {
                        action: 'login'
                    }
                );

            expect(errorSpy)
                .toHaveBeenCalledTimes(1);
        });


        test('no registra errores internos cuando la validación rechaza el evento', async () => {

            await expectInvalidEvent({});

            expect(warnSpy)
                .toHaveBeenCalledTimes(1);

            expect(errorSpy)
                .not.toHaveBeenCalled();
        });
    });


    /*
     * =====================================================
     * ASYNCHRONOUS EXECUTION
     * =====================================================
     */

    describe('Comportamiento asíncrono del handler', () => {

        test('espera la resolución del servicio antes de devolver el resultado', async () => {

            let resolveDatabase;

            GoogleAuthDatabase.execute
                .mockImplementation(
                    () => new Promise(resolve => {

                        resolveDatabase = resolve;
                    })
                );

            let completed = false;

            const response = {
                success: true,
                action: 'login'
            };

            const operation = handler(loginEvent)
                .then(result => {

                    completed = true;

                    return result;
                });

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledTimes(1);

            await Promise.resolve();

            expect(completed)
                .toBe(false);

            expect(logSpy)
                .toHaveBeenCalledTimes(1);

            resolveDatabase(response);

            await expect(operation)
                .resolves.toBe(response);

            expect(completed)
                .toBe(true);

            expect(logSpy)
                .toHaveBeenCalledTimes(2);
        });


        test('controla un rechazo asíncrono posterior a la invocación', async () => {

            let rejectDatabase;

            GoogleAuthDatabase.execute
                .mockImplementation(
                    () => new Promise(
                        (resolve, reject) => {

                            rejectDatabase = reject;
                        }
                    )
                );

            const operation = handler(registerEvent);

            rejectDatabase({
                statusCode: 503,
                message: 'Servicio no disponible'
            });

            await expect(operation)
                .resolves.toEqual({
                    success: false,
                    statusCode: 503,
                    message: 'Servicio no disponible'
                });

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledTimes(1);
        });


        test('mantiene independientes las operaciones concurrentes de login y register', async () => {

            const resolveOperations = {};

            GoogleAuthDatabase.execute
                .mockImplementation(
                    params => new Promise(resolve => {

                        resolveOperations[
                            params.action
                        ] = resolve;
                    })
                );

            const loginResponse = {
                success: true,
                action: 'login'
            };

            const registerResponse = {
                success: true,
                action: 'register'
            };

            const loginOperation =
                handler(loginEvent);

            const registerOperation =
                handler(registerEvent);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledTimes(2);

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenNthCalledWith(
                1,
                loginEvent
            );

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenNthCalledWith(
                2,
                registerEvent
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


        test('una solicitud inválida no interfiere con una operación válida concurrente', async () => {

            let resolveDatabase;

            GoogleAuthDatabase.execute
                .mockImplementation(
                    () => new Promise(resolve => {

                        resolveDatabase = resolve;
                    })
                );

            const validOperation =
                handler(loginEvent);

            const invalidOperation =
                handler({
                    ...registerEvent,
                    documentoLegalIds: []
                });

            await expect(invalidOperation)
                .resolves.toEqual(
                    invalidParamsResponse
                );

            expect(
                GoogleAuthDatabase.execute
            ).toHaveBeenCalledTimes(1);

            const response = {
                success: true,
                action: 'login'
            };

            resolveDatabase(response);

            await expect(validOperation)
                .resolves.toBe(response);
        });
    });
});