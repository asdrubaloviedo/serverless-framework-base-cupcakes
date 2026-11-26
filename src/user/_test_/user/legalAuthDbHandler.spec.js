jest.mock(
    '@user/services/user/LegalAuthDatabase',
    () => ({
        execute: jest.fn()
    })
);

const LegalAuthDatabase = require(
    '@user/services/user/LegalAuthDatabase'
);

const { handler } = require(
    '@user/handlers/legal-auth-db'
);

const firebaseUid = 'AbCdEf123FirebaseUID';

const email = 'user@example.com';

const documentoLegalIds = [12, 35];

const registerEvent = {
    action: 'register-traditional',
    firebaseUid,
    email,
    nombre: 'Ana López',
    pais: 'PER',
    documentoLegalIds
};

const pendingEvent = {
    action: 'get-pending-acceptances',
    firebaseUid
};

const acceptanceEvent = {
    action: 'register-acceptances',
    firebaseUid,
    documentoLegalIds
};

const profileEvent = {
    action: 'get-user-profile',
    firebaseUid
};

const operations = [
    ['get-user-profile', profileEvent],
    ['register-traditional', registerEvent],
    ['get-pending-acceptances', pendingEvent],
    ['register-acceptances', acceptanceEvent]
];

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
        LegalAuthDatabase.execute
    ).not.toHaveBeenCalled();
};


const expectValidEvent = async (
    event,
    expectedParams = event
) => {

    const response = {
        success: true,
        action: expectedParams.action
    };

    LegalAuthDatabase.execute
        .mockResolvedValue(response);

    await expect(
        handler(event)
    ).resolves.toBe(response);

    expect(
        LegalAuthDatabase.execute
    ).toHaveBeenCalledWith(
        expectedParams
    );

    expect(
        LegalAuthDatabase.execute
    ).toHaveBeenCalledTimes(1);
};


describe('Legal Auth Database Handler', () => {

    /*
     * =====================================================
     * SUPPORTED OPERATIONS
     * =====================================================
     */

    describe('Operaciones internas admitidas', () => {

        test.each(operations)(
            'ejecuta correctamente la operación %s',
            async (action, event) => {

                await expectValidEvent(event);
            }
        );


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['objeto vacío', {}],
            ['arreglo vacío', []],
            ['arreglo con evento', [registerEvent]],
            ['cadena vacía', ''],
            ['cadena JSON', JSON.stringify(registerEvent)],
            ['número', 123],
            ['booleano true', true],
            ['booleano false', false],
            ['evento HTTP', {
                body: JSON.stringify(registerEvent)
            }],
            ['evento HTTP con headers', {
                headers: {
                    authorization: 'Bearer token'
                },
                body: JSON.stringify(registerEvent)
            }]
        ])('rechaza formato de evento inválido: %s', async (
            description,
            event
        ) => {

            await expectInvalidEvent(event);
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['login', 'login'],
            ['register', 'register'],
            ['delete', 'delete'],
            ['update', 'update'],
            ['mayúsculas', 'REGISTER-TRADITIONAL'],
            ['espacios exteriores', ' register-traditional '],
            ['número', 123],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['register-traditional']]
        ])('rechaza acción no permitida: %s', async (
            description,
            action
        ) => {

            await expectInvalidEvent({
                ...registerEvent,
                action
            });
        });


        test('rechaza la ausencia de la propiedad action', async () => {

            const {
                action: omittedAction,
                ...params
            } = registerEvent;

            await expectInvalidEvent(params);
        });
    });


    /*
     * =====================================================
     * FIREBASE UID
     * =====================================================
     */

    describe('Validación de identidad Firebase', () => {

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
            ['arreglo con UID', [firebaseUid]]
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

                        await expectValidEvent(params);

                        expect(
                            LegalAuthDatabase.execute
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


                test('rechaza uid como sustituto de firebaseUid', async () => {

                    const {
                        firebaseUid: omittedUid,
                        ...params
                    } = event;

                    await expectInvalidEvent({
                        ...params,
                        uid: firebaseUid
                    });
                });


                test('rechaza firebase_uid como sustituto de firebaseUid', async () => {

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
     * TRADITIONAL REGISTRATION - EMAIL
     * =====================================================
     */

    describe('Correo electrónico durante el registro tradicional', () => {

        test.each([
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
        ])('normaliza %s como %s', async (
            originalEmail,
            normalizedEmail
        ) => {

            await expectValidEvent(
                {
                    ...registerEvent,
                    email: originalEmail
                },
                {
                    ...registerEvent,
                    email: normalizedEmail
                }
            );
        });


        test.each([
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
        ])('rechaza correo inválido: %s', async (
            description,
            invalidEmail
        ) => {

            await expectInvalidEvent({
                ...registerEvent,
                email: invalidEmail
            });
        });


        test('rechaza el registro sin correo electrónico', async () => {

            const {
                email: omittedEmail,
                ...params
            } = registerEvent;

            await expectInvalidEvent(params);
        });
    });


    /*
     * =====================================================
     * TRADITIONAL REGISTRATION - NAME
     * =====================================================
     */

    describe('Nombre durante el registro tradicional', () => {

        test.each([
            ['longitud mínima', 'AB', 'AB'],
            ['nombre normal', 'Ana López', 'Ana López'],
            ['espacios exteriores', '  Ana López  ', 'Ana López'],
            ['espacios interiores', 'Ana   López', 'Ana López'],
            ['tabulaciones interiores', 'Ana\tLópez', 'Ana López'],
            ['saltos de línea', 'Ana\nLópez', 'Ana López'],
            ['Unicode', 'María José Muñoz', 'María José Muñoz'],
            ['nombre compuesto', 'Jean-Pierre', 'Jean-Pierre'],
            ['longitud máxima', 'A'.repeat(50), 'A'.repeat(50)],
            [
                'longitud máxima después de trim',
                `  ${'A'.repeat(50)}  `,
                'A'.repeat(50)
            ]
        ])('normaliza el nombre: %s', async (
            description,
            originalName,
            normalizedName
        ) => {

            await expectValidEvent(
                {
                    ...registerEvent,
                    nombre: originalName
                },
                {
                    ...registerEvent,
                    nombre: normalizedName
                }
            );
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['espacios', '   '],
            ['un carácter', 'A'],
            ['un carácter con espacios', ' A '],
            ['51 caracteres', 'A'.repeat(51)],
            ['100 caracteres', 'A'.repeat(100)],
            ['número', 123],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['Ana López']]
        ])('rechaza nombre inválido: %s', async (
            description,
            nombre
        ) => {

            await expectInvalidEvent({
                ...registerEvent,
                nombre
            });
        });


        test('rechaza el registro sin nombre', async () => {

            const {
                nombre: omittedName,
                ...params
            } = registerEvent;

            await expectInvalidEvent(params);
        });


        test('valida la longitud antes de compactar espacios interiores', async () => {

            const nombre =
                `Ana${' '.repeat(50)}López`;

            await expectInvalidEvent({
                ...registerEvent,
                nombre
            });
        });
    });


    /*
     * =====================================================
     * TRADITIONAL REGISTRATION - COUNTRY
     * =====================================================
     */

    describe('País durante el registro tradicional', () => {

        test.each([
            ['PER', 'PER'],
            ['per', 'PER'],
            ['PeR', 'PER'],
            ['  per  ', 'PER'],
            ['\tper\n', 'PER'],
            ['ven', 'VEN'],
            ['col', 'COL'],
            ['usa', 'USA'],
            ['ZZZ', 'ZZZ']
        ])('normaliza el país %s como %s', async (
            originalCountry,
            normalizedCountry
        ) => {

            await expectValidEvent(
                {
                    ...registerEvent,
                    pais: originalCountry
                },
                {
                    ...registerEvent,
                    pais: normalizedCountry
                }
            );
        });


        test.each([
            ['null', null],
            ['cadena vacía', ''],
            ['espacios', '   '],
            ['un carácter', 'P'],
            ['dos caracteres', 'PE'],
            ['cuatro caracteres', 'PERU'],
            ['caracteres numéricos', '123'],
            ['alfanumérico', 'PE1'],
            ['carácter especial', 'P-R'],
            ['espacio interior', 'P R'],
            ['carácter no ASCII', 'PÉR'],
            ['número', 123],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['PER']]
        ])('rechaza país inválido: %s', async (
            description,
            pais
        ) => {

            await expectInvalidEvent({
                ...registerEvent,
                pais
            });
        });


        test('utiliza PER cuando no recibe la propiedad pais', async () => {

            const {
                pais: omittedCountry,
                ...params
            } = registerEvent;

            await expectValidEvent(
                params,
                registerEvent
            );
        });


        test('utiliza PER cuando pais es undefined', async () => {

            await expectValidEvent(
                {
                    ...registerEvent,
                    pais: undefined
                },
                registerEvent
            );
        });
    });


    /*
     * =====================================================
     * LEGAL DOCUMENTS - COMMON VALIDATION
     * =====================================================
     */

    describe('Validación común de documentos legales', () => {

        const documentOperations = [
            ['register-traditional', registerEvent],
            ['register-acceptances', acceptanceEvent]
        ];

        const validDocuments = [
            ['identificadores mínimos', [1, 2]],
            ['versiones actuales simuladas', [12, 35]],
            ['versiones futuras simuladas', [48, 52]],
            ['orden inverso', [52, 48]],
            ['identificadores no consecutivos', [100, 500]]
        ];

        const invalidDocuments = [
            ['undefined', undefined],
            ['null', null],
            ['arreglo vacío', []],
            ['tres documentos', [12, 35, 48]],
            ['cuatro documentos', [12, 35, 48, 52]],
            ['duplicados', [12, 12]],
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
        ];


        describe.each(documentOperations)(
            'operación %s',
            (action, event) => {

                test.each(validDocuments)(
                    'acepta dos documentos válidos: %s',
                    async (
                        description,
                        documentIds
                    ) => {

                        await expectValidEvent({
                            ...event,
                            documentoLegalIds: documentIds
                        });

                        expect(
                            LegalAuthDatabase.execute
                                .mock.calls[0][0]
                                .documentoLegalIds
                        ).toEqual(documentIds);
                    }
                );


                test.each(invalidDocuments)(
                    'rechaza documentos inválidos: %s',
                    async (
                        description,
                        documentIds
                    ) => {

                        await expectInvalidEvent({
                            ...event,
                            documentoLegalIds: documentIds
                        });
                    }
                );


                test('rechaza la ausencia de documentoLegalIds', async () => {

                    const {
                        documentoLegalIds: omittedIds,
                        ...params
                    } = event;

                    await expectInvalidEvent(params);
                });


                test('no modifica el arreglo original de documentos legales', async () => {

                    const originalIds =
                        Object.freeze([52, 48]);

                    const params = Object.freeze({
                        ...event,
                        documentoLegalIds: originalIds
                    });

                    await expectValidEvent(params);

                    expect(originalIds)
                        .toEqual([52, 48]);

                    expect(
                        LegalAuthDatabase.execute
                            .mock.calls[0][0]
                            .documentoLegalIds
                    ).not.toBe(originalIds);
                });
            }
        );
    });


    /*
     * =====================================================
     * LEGAL DOCUMENTS - OPERATION SPECIFIC RULES
     * =====================================================
     */

    describe('Cantidad de documentos según la operación', () => {

        test.each([
            [1],
            [12],
            [35],
            [48]
        ])('rechaza el registro tradicional con un único documento %i', async documentId => {

            await expectInvalidEvent({
                ...registerEvent,
                documentoLegalIds: [documentId]
            });
        });


        test.each([
            [1],
            [12],
            [35],
            [48]
        ])('acepta el registro posterior de un único documento %i', async documentId => {

            await expectValidEvent({
                ...acceptanceEvent,
                documentoLegalIds: [documentId]
            });
        });


        test.each([
            ['arreglo válido', [12, 35]],
            ['un documento', [12]],
            ['arreglo vacío', []],
            ['null', null],
            ['undefined', undefined]
        ])('rechaza documentoLegalIds durante la consulta: %s', async (
            description,
            documentIds
        ) => {

            await expectInvalidEvent({
                ...pendingEvent,
                documentoLegalIds: documentIds
            });
        });


        test('delega la comprobación de vigencia de documentos durante el registro tradicional', async () => {

            const event = {
                ...registerEvent,
                documentoLegalIds: [100, 200]
            };

            LegalAuthDatabase.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message: 'Documentos legales no vigentes'
                });

            await expect(
                handler(event)
            ).resolves.toEqual({
                success: false,
                statusCode: 409,
                message: 'Documentos legales no vigentes'
            });

            expect(
                LegalAuthDatabase.execute
            ).toHaveBeenCalledWith(event);
        });


        test('delega la comprobación de documentos pendientes durante el registro posterior', async () => {

            const event = {
                ...acceptanceEvent,
                documentoLegalIds: [100]
            };

            LegalAuthDatabase.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message: 'Documento legal no pendiente'
                });

            await expect(
                handler(event)
            ).resolves.toEqual({
                success: false,
                statusCode: 409,
                message: 'Documento legal no pendiente'
            });

            expect(
                LegalAuthDatabase.execute
            ).toHaveBeenCalledWith(event);
        });
    });


    /*
     * =====================================================
     * STRICT INTERNAL CONTRACT
     * =====================================================
     */

    describe('Protección del contrato interno', () => {

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
            ['provider', 'password'],
            ['email_verified', true],
            ['metodoAceptacion', 'manual'],
            ['fechaAceptacion', '2026-11-24T21:32:35Z'],
            ['version', '1.0'],
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


        describe.each([
            ['get-pending-acceptances', pendingEvent],
            ['register-acceptances', acceptanceEvent]
        ])(
            'restricciones específicas de %s',
            (action, event) => {

                test.each([
                    ['email', email],
                    ['nombre', 'Ana López'],
                    ['pais', 'PER'],
                    ['email', undefined],
                    ['nombre', undefined],
                    ['pais', undefined]
                ])('rechaza el campo no permitido %s con valor %p', async (
                    fieldName,
                    fieldValue
                ) => {

                    await expectInvalidEvent({
                        ...event,
                        [fieldName]: fieldValue
                    });
                });
            }
        );


        test('la consulta utiliza exclusivamente action y firebaseUid', async () => {

            await expectValidEvent(pendingEvent);

            const params =
                LegalAuthDatabase.execute
                    .mock.calls[0][0];

            expect(
                Object.keys(params).sort()
            ).toEqual([
                'action',
                'firebaseUid'
            ]);
        });


        test('el registro posterior utiliza exclusivamente los parámetros permitidos', async () => {

            await expectValidEvent(acceptanceEvent);

            const params =
                LegalAuthDatabase.execute
                    .mock.calls[0][0];

            expect(
                Object.keys(params).sort()
            ).toEqual([
                'action',
                'documentoLegalIds',
                'firebaseUid'
            ]);
        });
    });


    /*
     * =====================================================
     * NORMALIZATION AND IMMUTABILITY
     * =====================================================
     */

    describe('Normalización e inmutabilidad de parámetros', () => {

        test('normaliza correo, nombre y país sin modificar Firebase UID', async () => {

            const event = {
                ...registerEvent,
                email: '  USER@EXAMPLE.COM  ',
                nombre: '  Ana   López  ',
                pais: '  per  ',
                firebaseUid: 'AbCdEf123XyZ'
            };

            await expectValidEvent(
                event,
                {
                    ...registerEvent,
                    firebaseUid: 'AbCdEf123XyZ'
                }
            );
        });


        test('no modifica el evento original durante el registro tradicional', async () => {

            const event = Object.freeze({
                ...registerEvent,
                email: '  USER@EXAMPLE.COM  ',
                nombre: '  Ana   López  ',
                pais: '  per  ',
                documentoLegalIds: Object.freeze([
                    ...documentoLegalIds
                ])
            });

            await expectValidEvent(
                event,
                registerEvent
            );

            expect(event).toEqual({
                ...registerEvent,
                email: '  USER@EXAMPLE.COM  ',
                nombre: '  Ana   López  ',
                pais: '  per  '
            });
        });


        test.each(operations)(
            'construye parámetros independientes del evento original durante %s',
            async (action, event) => {

                const immutableEvent =
                    Object.freeze({
                        ...event
                    });

                await expectValidEvent(
                    immutableEvent
                );

                const params =
                    LegalAuthDatabase.execute
                        .mock.calls[0][0];

                expect(params)
                    .not.toBe(immutableEvent);

                expect(params)
                    .toEqual(immutableEvent);
            }
        );


        test('no incorpora pais al evento original cuando aplica el valor por defecto', async () => {

            const {
                pais: omittedCountry,
                ...params
            } = registerEvent;

            const event = Object.freeze(params);

            await expectValidEvent(
                event,
                registerEvent
            );

            expect(event)
                .not.toHaveProperty('pais');
        });
    });


    /*
     * =====================================================
     * SUCCESS RESPONSE
     * =====================================================
     */

    describe('Contrato de respuesta interna exitosa', () => {

        describe.each(operations)(
            'operación %s',
            (action, event) => {

                test('devuelve exactamente la respuesta del servicio', async () => {

                    const response = {
                        success: true,
                        action,
                        datos: {
                            usuarioId: 25
                        }
                    };

                    LegalAuthDatabase.execute
                        .mockResolvedValue(response);

                    await expect(
                        handler(event)
                    ).resolves.toBe(response);

                    expect(
                        LegalAuthDatabase.execute
                    ).toHaveBeenCalledWith(event);

                    expect(
                        LegalAuthDatabase.execute
                    ).toHaveBeenCalledTimes(1);
                });


                test('no transforma el resultado en una respuesta HTTP', async () => {

                    const response = {
                        success: true,
                        action
                    };

                    LegalAuthDatabase.execute
                        .mockResolvedValue(response);

                    const result = await handler(event);

                    expect(result)
                        .toEqual(response);

                    expect(result)
                        .not.toHaveProperty('body');

                    expect(result)
                        .not.toHaveProperty('headers');

                    expect(result)
                        .not.toHaveProperty('statusCode');
                });


                test('no modifica una respuesta inmutable del servicio', async () => {

                    const response = Object.freeze({
                        success: true,
                        action
                    });

                    LegalAuthDatabase.execute
                        .mockResolvedValue(response);

                    await expect(
                        handler(event)
                    ).resolves.toBe(response);
                });
            }
        );


        test('conserva la información del usuario creado mediante registro tradicional', async () => {

            const response = {
                success: true,
                usuario: {
                    id: 25,
                    nombre: 'Ana López',
                    email
                }
            };

            LegalAuthDatabase.execute
                .mockResolvedValue(response);

            await expect(
                handler(registerEvent)
            ).resolves.toBe(response);
        });


        test.each([
            ['sin documentos pendientes', []],
            ['un documento pendiente', [{ id: 48 }]],
            [
                'dos documentos pendientes',
                [{ id: 48 }, { id: 52 }]
            ]
        ])('conserva la respuesta de consulta: %s', async (
            description,
            documents
        ) => {

            const response = {
                success: true,
                documentosPendientes: documents
            };

            LegalAuthDatabase.execute
                .mockResolvedValue(response);

            await expect(
                handler(pendingEvent)
            ).resolves.toBe(response);
        });


        test.each([
            ['un documento aceptado', [48]],
            ['dos documentos aceptados', [48, 52]]
        ])('conserva la respuesta de registro posterior: %s', async (
            description,
            documentIds
        ) => {

            const response = {
                success: true,
                documentoLegalIds: documentIds
            };

            LegalAuthDatabase.execute
                .mockResolvedValue(response);

            await expect(
                handler({
                    ...acceptanceEvent,
                    documentoLegalIds: documentIds
                })
            ).resolves.toBe(response);
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['booleano true', true],
            ['booleano false', false],
            ['objeto vacío', {}],
            ['arreglo vacío', []]
        ])('documenta una respuesta resuelta sin validación estructural: %s', async (
            description,
            response
        ) => {

            LegalAuthDatabase.execute
                .mockResolvedValue(response);

            await expect(
                handler(pendingEvent)
            ).resolves.toBe(response);
        });


        test('conserva una respuesta resuelta con success false', async () => {

            const response = {
                success: false,
                statusCode: 409,
                message: 'Conflicto legal'
            };

            LegalAuthDatabase.execute
                .mockResolvedValue(response);

            await expect(
                handler(acceptanceEvent)
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
            [400, 'Operación legal no válida'],
            [401, 'Identidad de usuario no válida'],
            [403, 'Operación no autorizada'],
            [404, 'Usuario no registrado'],
            [409, 'Conflicto de documentos legales'],
            [503, 'Servicio no disponible']
        ];


        describe.each(operations)(
            'operación %s',
            (action, event) => {

                test.each(controlledErrors)(
                    'conserva el código permitido %i y su mensaje',
                    async (
                        statusCode,
                        message
                    ) => {

                        LegalAuthDatabase.execute
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
                            LegalAuthDatabase.execute
                        ).toHaveBeenCalledWith(event);

                        expect(
                            LegalAuthDatabase.execute
                        ).toHaveBeenCalledTimes(1);
                    }
                );


                test('no reintenta automáticamente una operación fallida', async () => {

                    LegalAuthDatabase.execute
                        .mockRejectedValue({
                            statusCode: 503,
                            message: 'Servicio no disponible'
                        });

                    await handler(event);

                    expect(
                        LegalAuthDatabase.execute
                    ).toHaveBeenCalledTimes(1);
                });
            }
        );


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['número', 123],
            ['booleano true', true],
            ['booleano false', false],
            ['objeto', {}],
            ['arreglo', []]
        ])('protege un error controlado cuyo mensaje es %s', async (
            description,
            message
        ) => {

            LegalAuthDatabase.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message
                });

            await expect(
                handler(acceptanceEvent)
            ).resolves.toEqual({
                success: false,
                statusCode: 409,
                message: 'Error interno del servidor'
            });
        });


        test.each([
            ['cadena vacía', ''],
            ['espacios', '   ']
        ])('documenta que conserva un mensaje de tipo string: %s', async (
            description,
            message
        ) => {

            LegalAuthDatabase.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message
                });

            await expect(
                handler(acceptanceEvent)
            ).resolves.toEqual({
                success: false,
                statusCode: 409,
                message
            });
        });


        test('no transmite propiedades adicionales de un error controlado', async () => {

            LegalAuthDatabase.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message: 'Conflicto legal',
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
                message: 'Conflicto legal'
            });
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
            ['405', 405],
            ['422', 422],
            ['429', 429],
            ['500', 500],
            ['501', 501],
            ['502', 502],
            ['504', 504],
            ['999', 999],
            ['negativo', -1],
            ['cero', 0],
            ['decimal', 400.5],
            ['NaN', NaN],
            ['Infinity', Infinity],
            ['cadena 400', '400'],
            ['cadena 401', '401'],
            ['cadena 403', '403'],
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

            LegalAuthDatabase.execute
                .mockRejectedValue({
                    statusCode,
                    message: 'Sensitive internal error'
                });

            await expect(
                handler(pendingEvent)
            ).resolves.toEqual(
                internalErrorResponse
            );
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

            LegalAuthDatabase.execute
                .mockRejectedValue(error);

            await expect(
                handler(registerEvent)
            ).resolves.toEqual(
                internalErrorResponse
            );
        });


        test('controla una excepción síncrona del servicio', async () => {

            LegalAuthDatabase.execute
                .mockImplementation(() => {

                    throw new Error(
                        'Synchronous database error'
                    );
                });

            await expect(
                handler(acceptanceEvent)
            ).resolves.toEqual(
                internalErrorResponse
            );
        });


        test('no expone detalles sensibles de PostgreSQL', async () => {

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

            LegalAuthDatabase.execute
                .mockRejectedValue(error);

            const result =
                await handler(registerEvent);

            expect(result)
                .toEqual(internalErrorResponse);

            expect(result)
                .not.toHaveProperty('code');

            expect(result)
                .not.toHaveProperty('detail');

            expect(result)
                .not.toHaveProperty('stack');

            expect(result)
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
            'registra únicamente la acción durante %s',
            async (action, event) => {

                LegalAuthDatabase.execute
                    .mockResolvedValue({
                        success: true
                    });

                await handler(event);

                expect(logSpy)
                    .toHaveBeenCalledTimes(2);

                expect(logSpy)
                    .toHaveBeenNthCalledWith(
                        1,
                        '[LegalAuthDB] Iniciando operación',
                        { action }
                    );

                expect(logSpy)
                    .toHaveBeenNthCalledWith(
                        2,
                        '[LegalAuthDB] Operación completada',
                        { action }
                    );

                expect(warnSpy)
                    .not.toHaveBeenCalled();

                expect(errorSpy)
                    .not.toHaveBeenCalled();
            }
        );


        test.each(operations)(
            'no registra información de identidad durante %s',
            async (action, event) => {

                await handler(event);

                const logs = JSON.stringify(
                    logSpy.mock.calls
                );

                expect(logs)
                    .not.toContain(firebaseUid);

                expect(logs)
                    .not.toContain(email);

                expect(logs)
                    .not.toContain(registerEvent.nombre);

                expect(logs)
                    .not.toContain('documentoLegalIds');
            }
        );


        test('no registra el contenido de una solicitud inválida', async () => {

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
                    '[LegalAuthDB] Solicitud interna inválida'
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


        test('registra únicamente statusCode y code de un error PostgreSQL', async () => {

            const error = Object.assign(
                new Error('Sensitive database message'),
                {
                    code: '23505',
                    detail: 'Sensitive database detail',
                    query: 'SELECT sensitive_data'
                }
            );

            LegalAuthDatabase.execute
                .mockRejectedValue(error);

            await handler(registerEvent);

            expect(errorSpy)
                .toHaveBeenCalledTimes(1);

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuthDB] Error',
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


        test('registra el código permitido de un error legal', async () => {

            LegalAuthDatabase.execute
                .mockRejectedValue({
                    statusCode: 409,
                    code: 'LEGAL_CONFLICT',
                    message: 'Conflicto legal'
                });

            await handler(acceptanceEvent);

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuthDB] Error',
                    {
                        statusCode: 409,
                        code: 'LEGAL_CONFLICT'
                    }
                );
        });


        test.each(operations)(
            'no registra una operación completada cuando falla %s',
            async (action, event) => {

                LegalAuthDatabase.execute
                    .mockRejectedValue(
                        new Error('Database unavailable')
                    );

                await handler(event);

                expect(logSpy)
                    .toHaveBeenCalledTimes(1);

                expect(logSpy)
                    .toHaveBeenCalledWith(
                        '[LegalAuthDB] Iniciando operación',
                        { action }
                    );

                expect(logSpy)
                    .not.toHaveBeenCalledWith(
                        '[LegalAuthDB] Operación completada',
                        { action }
                    );

                expect(errorSpy)
                    .toHaveBeenCalledTimes(1);
            }
        );


        test('registra correctamente una excepción null', async () => {

            LegalAuthDatabase.execute
                .mockRejectedValue(null);

            await expect(
                handler(pendingEvent)
            ).resolves.toEqual(
                internalErrorResponse
            );

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuthDB] Error',
                    {
                        statusCode: 500,
                        code: undefined
                    }
                );
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

            LegalAuthDatabase.execute
                .mockImplementation(
                    () => new Promise(resolve => {

                        resolveDatabase = resolve;
                    })
                );

            let completed = false;

            const response = {
                success: true
            };

            const operation =
                handler(registerEvent)
                    .then(result => {

                        completed = true;

                        return result;
                    });

            expect(
                LegalAuthDatabase.execute
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

            LegalAuthDatabase.execute
                .mockImplementation(
                    () => new Promise(
                        (resolve, reject) => {

                            rejectDatabase = reject;
                        }
                    )
                );

            const operation =
                handler(acceptanceEvent);

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
                LegalAuthDatabase.execute
            ).toHaveBeenCalledTimes(1);
        });


        test('mantiene independientes las tres operaciones concurrentes', async () => {

            const resolveOperations = {};

            LegalAuthDatabase.execute
                .mockImplementation(
                    params => new Promise(resolve => {

                        resolveOperations[
                            params.action
                        ] = resolve;
                    })
                );

            const registerResponse = {
                success: true,
                usuario: {
                    id: 25
                }
            };

            const pendingResponse = {
                success: true,
                documentosPendientes: [
                    { id: 48 }
                ]
            };

            const acceptanceResponse = {
                success: true,
                documentoLegalIds
            };

            const registerOperation =
                handler(registerEvent);

            const pendingOperation =
                handler(pendingEvent);

            const acceptanceOperation =
                handler(acceptanceEvent);

            expect(
                LegalAuthDatabase.execute
            ).toHaveBeenCalledTimes(3);

            expect(
                LegalAuthDatabase.execute
            ).toHaveBeenNthCalledWith(
                1,
                registerEvent
            );

            expect(
                LegalAuthDatabase.execute
            ).toHaveBeenNthCalledWith(
                2,
                pendingEvent
            );

            expect(
                LegalAuthDatabase.execute
            ).toHaveBeenNthCalledWith(
                3,
                acceptanceEvent
            );

            resolveOperations[
                'register-acceptances'
            ](acceptanceResponse);

            await expect(acceptanceOperation)
                .resolves.toBe(acceptanceResponse);

            resolveOperations[
                'get-pending-acceptances'
            ](pendingResponse);

            await expect(pendingOperation)
                .resolves.toBe(pendingResponse);

            resolveOperations[
                'register-traditional'
            ](registerResponse);

            await expect(registerOperation)
                .resolves.toBe(registerResponse);
        });


        test('una solicitud inválida no interfiere con una operación válida concurrente', async () => {

            let resolveDatabase;

            LegalAuthDatabase.execute
                .mockImplementation(
                    () => new Promise(resolve => {

                        resolveDatabase = resolve;
                    })
                );

            const validOperation =
                handler(pendingEvent);

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
                LegalAuthDatabase.execute
            ).toHaveBeenCalledTimes(1);

            const response = {
                success: true,
                documentosPendientes: []
            };

            resolveDatabase(response);

            await expect(validOperation)
                .resolves.toBe(response);
        });
    });
});

describe('Consulta interna del perfil', () => {
    test('devuelve exactamente el perfil del servicio', async () => {
        const response = {
            success: true,
            usuario: [{ usuario_id: 25, avatar_id: 1 }]
        };
        LegalAuthDatabase.execute.mockResolvedValue(response);
        await expect(handler(profileEvent)).resolves.toBe(response);
        expect(LegalAuthDatabase.execute).toHaveBeenCalledTimes(1);
        expect(LegalAuthDatabase.execute).toHaveBeenCalledWith(profileEvent);
    });

    test.each([
        ['email', email],
        ['nombre', 'Ana López'],
        ['pais', 'PER'],
        ['documentoLegalIds', [12, 35]],
        ['documentoLegalIds', undefined]
    ])('rechaza el campo adicional %s', async (field, value) => {
        await expectInvalidEvent({ ...profileEvent, [field]: value });
    });

    test('propaga el error de usuario no registrado', async () => {
        LegalAuthDatabase.execute.mockRejectedValue({
            statusCode: 404,
            message: 'Usuario no registrado'
        });
        await expect(handler(profileEvent)).resolves.toEqual({
            success: false,
            statusCode: 404,
            message: 'Usuario no registrado'
        });
    });
});
