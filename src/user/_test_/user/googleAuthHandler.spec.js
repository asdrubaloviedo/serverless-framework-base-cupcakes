jest.mock(
    '@user/services/user/GoogleAuthUser',
    () => ({
        execute: jest.fn()
    })
);

const GoogleAuthUser = require(
    '@user/services/user/GoogleAuthUser'
);

const { handler } = require(
    '@user/handlers/google-auth'
);

const token = 'valid-test-token-123456789';

const documentoLegalIds = [12, 35];

const loginBody = {
    idToken: token,
    action: 'login'
};

const registerBody = {
    idToken: token,
    action: 'register',
    nombre: 'Ana López',
    documentoLegalIds
};

const loginResponse = {
    success: true,
    action: 'login',
    email: 'a@example.com'
};

const registerResponse = {
    success: true,
    action: 'register',
    email: 'a@example.com'
};

const operations = [
    ['login', loginBody],
    ['register', registerBody]
];

const event = body => ({
    httpMethod: 'POST',
    path: '/cupcakeslife/usuarios/google-auth',
    body: JSON.stringify(body)
});

let errorSpy;

beforeEach(() => {

    jest.resetAllMocks();

    errorSpy = jest.spyOn(console, 'error')
        .mockImplementation(() => {});
});

afterEach(() => {

    jest.restoreAllMocks();
});


const expectInvalidEvent = async (
    request,
    expectedMessage
) => {

    const result = await handler(request);

    expect(result.statusCode)
        .toBe(400);

    const response = JSON.parse(result.body);

    expect(response).toEqual({
        message: expect.any(String)
    });

    expect(response.message.length)
        .toBeGreaterThan(0);

    if (expectedMessage !== undefined) {

        expect(response.message)
            .toBe(expectedMessage);
    }

    expect(
        GoogleAuthUser.execute
    ).not.toHaveBeenCalled();

    return result;
};


const expectInvalidBody = async (
    body,
    expectedMessage
) => {

    return expectInvalidEvent(
        event(body),
        expectedMessage
    );
};


describe('Google Auth Handler', () => {

    /*
     * =====================================================
     * CASOS ORIGINALES CONSERVADOS Y READAPTADOS
     * =====================================================
     */

    describe('Casos originales', () => {

        test('login válido: responde 200', async () => {

            GoogleAuthUser.execute.mockResolvedValue(
                loginResponse
            );

            const result = await handler(
                event(loginBody)
            );

            expect(result.statusCode)
                .toBe(200);

            expect(JSON.parse(result.body))
                .toEqual(loginResponse);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(loginBody);
        });


        test('registro válido: responde 200', async () => {

            GoogleAuthUser.execute.mockResolvedValue(
                registerResponse
            );

            const result = await handler(
                event(registerBody)
            );

            expect(result.statusCode)
                .toBe(200);

            expect(JSON.parse(result.body))
                .toMatchObject({
                    success: true,
                    action: 'register'
                });

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(registerBody);
        });


        test.each([
            [
                404,
                'No existe una cuenta registrada con este correo'
            ],
            [
                409,
                'Este correo ya se encuentra registrado'
            ],
            [
                401,
                'Token de Firebase inválido o expirado'
            ],
            [
                403,
                'Se requiere una cuenta de Google verificada'
            ],
            [
                502,
                'No fue posible completar la operación'
            ]
        ])('error de negocio: HTTP %s', async (
            statusCode,
            message
        ) => {

            GoogleAuthUser.execute.mockRejectedValue({
                statusCode,
                message
            });

            const body = statusCode === 409
                ? registerBody
                : loginBody;

            const result = await handler(
                event(body)
            );

            expect(result.statusCode)
                .toBe(statusCode);

            expect(JSON.parse(result.body))
                .toEqual({
                    message
                });

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(body);
        });


        test.each([
            [{
                action: 'login'
            }],
            [{
                idToken: token
            }],
            [{
                idToken: 'short',
                action: 'login'
            }],
            [{
                idToken: token,
                action: 'delete'
            }],
            [{
                ...loginBody,
                email: 'forged@example.com'
            }],
            [{
                ...registerBody,
                nombre: 'a'.repeat(51)
            }]
        ])('solicitud inválida: responde 400', async body => {

            await expectInvalidBody(body);
        });


        test('solicitud sin body: responde 400', async () => {

            await expectInvalidEvent({});
        });


        test('JSON inválido: responde 400', async () => {

            await expectInvalidEvent(
                {
                    body: '{invalid'
                },
                'JSON inválido'
            );
        });


        test('acepta un body previamente convertido a objeto', async () => {

            GoogleAuthUser.execute.mockResolvedValue(
                loginResponse
            );

            const result = await handler({
                body: loginBody
            });

            expect(result.statusCode)
                .toBe(200);
        });


        test('error inesperado: responde 500 sin exponer detalles', async () => {

            GoogleAuthUser.execute.mockRejectedValue(
                new Error('Sensitive internal error')
            );

            const result = await handler(
                event(loginBody)
            );

            expect(result.statusCode)
                .toBe(500);

            expect(JSON.parse(result.body))
                .toEqual({
                    message: 'Error interno del servidor'
                });
        });
    });


    /*
     * =====================================================
     * HTTP REQUEST BODY
     * =====================================================
     */

    describe('Interpretación del cuerpo de la solicitud HTTP', () => {

        test.each([
            ['undefined', undefined],
            ['null', null],
            ['evento vacío', {}],
            ['body undefined', { body: undefined }],
            ['body null', { body: null }],
            ['body vacío', { body: '' }],
            ['body false', { body: false }],
            ['body cero', { body: 0 }]
        ])('rechaza una solicitud sin body válido: %s', async (
            description,
            request
        ) => {

            await expectInvalidEvent(request);
        });


        test.each([
            ['JSON incompleto', '{"action":'],
            ['objeto sin cerrar', '{"action":"login"'],
            ['arreglo sin cerrar', '[1,2'],
            ['comillas simples', "{'action':'login'}"],
            ['coma final', '{"action":"login",}'],
            ['texto plano', 'invalid-json'],
            ['espacios', '   '],
            ['tabulaciones', '\t\t']
        ])('rechaza JSON mal formado: %s', async (
            description,
            body
        ) => {

            await expectInvalidEvent(
                { body },
                'JSON inválido'
            );
        });


        test.each([
            ['null', null],
            ['booleano true', true],
            ['booleano false', false],
            ['número', 123],
            ['cadena', 'login'],
            ['arreglo vacío', []],
            ['arreglo con solicitud', [loginBody]],
            ['objeto vacío', {}]
        ])('rechaza JSON válido con estructura incorrecta: %s', async (
            description,
            body
        ) => {

            await expectInvalidBody(body);
        });


        test.each(operations)(
            'acepta un body de tipo objeto para %s',
            async (
                action,
                body
            ) => {

                const response = {
                    success: true,
                    action
                };

                GoogleAuthUser.execute
                    .mockResolvedValue(response);

                const result = await handler({
                    body
                });

                expect(result.statusCode)
                    .toBe(200);

                expect(JSON.parse(result.body))
                    .toEqual(response);

                expect(
                    GoogleAuthUser.execute
                ).toHaveBeenCalledWith(body);

                expect(
                    GoogleAuthUser.execute
                ).toHaveBeenCalledTimes(1);
            }
        );


        test('acepta JSON con espacios y saltos de línea', async () => {

            GoogleAuthUser.execute
                .mockResolvedValue(loginResponse);

            const result = await handler({
                body: JSON.stringify(
                    loginBody,
                    null,
                    4
                )
            });

            expect(result.statusCode)
                .toBe(200);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(loginBody);
        });


        test('no interpreta automáticamente un body codificado en Base64', async () => {

            const encodedBody = Buffer.from(
                JSON.stringify(loginBody)
            ).toString('base64');

            await expectInvalidEvent(
                {
                    body: encodedBody,
                    isBase64Encoded: true
                },
                'JSON inválido'
            );
        });


        test('no utiliza queryStringParameters como sustituto del body', async () => {

            await expectInvalidEvent({
                queryStringParameters: loginBody
            });
        });


        test('no utiliza pathParameters como sustituto del body', async () => {

            await expectInvalidEvent({
                pathParameters: loginBody
            });
        });
    });


    /*
     * =====================================================
     * FIREBASE ID TOKEN
     * =====================================================
     */

    describe('Validación estructural del Firebase ID Token', () => {

        const validTokens = [
            ['longitud mínima', 'A'.repeat(20)],
            ['longitud superior al mínimo', 'A'.repeat(21)],
            ['mayúsculas y minúsculas', 'AbCdEf123XyZ456Token789'],
            ['formato JWT simulado', 'header.payload.signature'],
            ['token largo', 'A'.repeat(4096)]
        ];

        const invalidTokens = [
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['un carácter', 'A'],
            ['19 caracteres', 'A'.repeat(19)],
            ['número', 123456789],
            ['booleano true', true],
            ['booleano false', false],
            ['objeto', {}],
            ['arreglo vacío', []],
            ['arreglo con token', [token]]
        ];


        describe.each(operations)(
            'operación %s',
            (action, body) => {

                test.each(validTokens)(
                    'transmite exactamente el token: %s',
                    async (
                        description,
                        originalToken
                    ) => {

                        const params = {
                            ...body,
                            idToken: originalToken
                        };

                        GoogleAuthUser.execute
                            .mockResolvedValue({
                                success: true,
                                action
                            });

                        const result = await handler(
                            event(params)
                        );

                        expect(result.statusCode)
                            .toBe(200);

                        expect(
                            GoogleAuthUser.execute
                        ).toHaveBeenCalledWith(params);

                        expect(
                            GoogleAuthUser.execute
                                .mock.calls[0][0]
                                .idToken
                        ).toBe(originalToken);
                    }
                );


                test.each(invalidTokens)(
                    'rechaza token estructuralmente inválido: %s',
                    async (
                        description,
                        invalidToken
                    ) => {

                        await expectInvalidBody({
                            ...body,
                            idToken: invalidToken
                        });
                    }
                );


                test('conserva los espacios exteriores del token', async () => {

                    const originalToken =
                        `  ${token}  `;

                    GoogleAuthUser.execute
                        .mockResolvedValue({
                            success: true,
                            action
                        });

                    const result = await handler(
                        event({
                            ...body,
                            idToken: originalToken
                        })
                    );

                    expect(result.statusCode)
                        .toBe(200);

                    expect(
                        GoogleAuthUser.execute
                    ).toHaveBeenCalledWith({
                        ...body,
                        idToken: originalToken
                    });
                });


                test('delega al servicio la autenticidad de un token compuesto por espacios', async () => {

                    const invalidToken =
                        ' '.repeat(20);

                    GoogleAuthUser.execute
                        .mockRejectedValue({
                            statusCode: 401,
                            message:
                                'Token de Firebase inválido o expirado'
                        });

                    const result = await handler(
                        event({
                            ...body,
                            idToken: invalidToken
                        })
                    );

                    expect(result.statusCode)
                        .toBe(401);

                    expect(
                        GoogleAuthUser.execute
                    ).toHaveBeenCalledWith({
                        ...body,
                        idToken: invalidToken
                    });
                });
            }
        );
    });


    /*
     * =====================================================
     * ACTION
     * =====================================================
     */

    describe('Validación de la acción solicitada', () => {

        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['mayúsculas login', 'LOGIN'],
            ['mayúsculas register', 'REGISTER'],
            ['espacios exteriores', ' login '],
            ['acción desconocida', 'update'],
            ['acción delete', 'delete'],
            ['número', 1],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['login']]
        ])('rechaza acción inválida: %s', async (
            description,
            action
        ) => {

            await expectInvalidBody({
                ...loginBody,
                action
            });
        });


        test('no obtiene la acción desde los parámetros de la URL', async () => {

            await expectInvalidEvent({
                queryStringParameters: {
                    action: 'login'
                },
                body: JSON.stringify({
                    idToken: token
                })
            });
        });
    });


    /*
     * =====================================================
     * OPTIONAL NAME
     * =====================================================
     */

    describe('Validación y normalización del nombre opcional', () => {

        const validNames = [
            ['cadena vacía', '', ''],
            ['espacios', '   ', ''],
            ['un carácter', 'A', 'A'],
            ['nombre normal', 'Ana López', 'Ana López'],
            [
                'espacios exteriores',
                '  Ana López  ',
                'Ana López'
            ],
            [
                'espacios interiores',
                'Ana  López',
                'Ana  López'
            ],
            [
                'Unicode',
                'María José Muñoz',
                'María José Muñoz'
            ],
            [
                'tabulaciones exteriores',
                '\tAna López\n',
                'Ana López'
            ],
            [
                'longitud máxima',
                'A'.repeat(50),
                'A'.repeat(50)
            ],
            [
                'longitud máxima después de trim',
                `  ${'A'.repeat(50)}  `,
                'A'.repeat(50)
            ]
        ];

        const invalidNames = [
            ['null', null],
            ['51 caracteres', 'A'.repeat(51)],
            ['100 caracteres', 'A'.repeat(100)],
            ['número', 123],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', ['Ana López']]
        ];


        describe.each(operations)(
            'operación %s',
            (action, body) => {

                test.each(validNames)(
                    'normaliza el nombre: %s',
                    async (
                        description,
                        originalName,
                        normalizedName
                    ) => {

                        GoogleAuthUser.execute
                            .mockResolvedValue({
                                success: true,
                                action
                            });

                        const result = await handler(
                            event({
                                ...body,
                                nombre: originalName
                            })
                        );

                        expect(result.statusCode)
                            .toBe(200);

                        expect(
                            GoogleAuthUser.execute
                        ).toHaveBeenCalledWith({
                            ...body,
                            nombre: normalizedName
                        });
                    }
                );


                test.each(invalidNames)(
                    'rechaza nombre inválido: %s',
                    async (
                        description,
                        nombre
                    ) => {

                        await expectInvalidBody({
                            ...body,
                            nombre
                        });
                    }
                );


                test('acepta la ausencia del nombre', async () => {

                    const {
                        nombre: omittedName,
                        ...params
                    } = body;

                    GoogleAuthUser.execute
                        .mockResolvedValue({
                            success: true,
                            action
                        });

                    const result = await handler(
                        event(params)
                    );

                    expect(result.statusCode)
                        .toBe(200);

                    expect(
                        GoogleAuthUser.execute
                    ).toHaveBeenCalledWith(params);

                    expect(
                        GoogleAuthUser.execute
                            .mock.calls[0][0]
                    ).not.toHaveProperty('nombre');
                });
            }
        );
    });


    /*
     * =====================================================
     * LEGAL DOCUMENTS
     * =====================================================
     */

    describe('Documentos legales obligatorios durante el registro', () => {

        test.each([
            ['identificadores mínimos', [1, 2]],
            ['versiones actuales simuladas', [12, 35]],
            ['versiones futuras simuladas', [48, 52]],
            ['orden inverso', [52, 48]],
            ['identificadores no consecutivos', [100, 500]]
        ])('acepta dos documentos legales válidos: %s', async (
            description,
            documentIds
        ) => {

            const params = {
                ...registerBody,
                documentoLegalIds: documentIds
            };

            GoogleAuthUser.execute
                .mockResolvedValue(registerResponse);

            const result = await handler(
                event(params)
            );

            expect(result.statusCode)
                .toBe(200);

            expect(JSON.parse(result.body))
                .toEqual(registerResponse);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(params);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledTimes(1);
        });


        test.each([
            ['arreglo vacío', []],
            ['un documento', [12]],
            ['tres documentos', [12, 35, 48]],
            ['cuatro documentos', [12, 35, 48, 52]]
        ])('rechaza cantidad incorrecta de documentos: %s', async (
            description,
            documentIds
        ) => {

            await expectInvalidBody(
                {
                    ...registerBody,
                    documentoLegalIds: documentIds
                },
                'Debe aceptar los dos documentos legales obligatorios'
            );
        });


        test.each([
            [12, 12],
            [35, 35],
            [48, 48]
        ])('rechaza documentos duplicados: %i y %i', async (
            firstId,
            secondId
        ) => {

            await expectInvalidBody(
                {
                    ...registerBody,
                    documentoLegalIds: [
                        firstId,
                        secondId
                    ]
                },
                'Los documentos legales no pueden estar duplicados'
            );
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['identificador cero', [0, 35]],
            ['segundo identificador cero', [12, 0]],
            ['identificador negativo', [-12, 35]],
            ['segundo identificador negativo', [12, -35]],
            ['identificador decimal', [12.5, 35]],
            ['segundo identificador decimal', [12, 35.5]],
            ['identificador como cadena', ['12', 35]],
            ['ambos como cadenas', ['12', '35']],
            ['identificador null', [null, 35]],
            ['identificador booleano', [true, 35]],
            ['identificador objeto', [{ id: 12 }, 35]],
            ['identificador arreglo', [[12], 35]],
            ['cadena separada por comas', '12,35'],
            ['número', 12],
            ['booleano', true],
            ['objeto', { first: 12, second: 35 }]
        ])('rechaza documentos legales inválidos: %s', async (
            description,
            documentIds
        ) => {

            await expectInvalidBody({
                ...registerBody,
                documentoLegalIds: documentIds
            });
        });


        test.each([
            ['NaN', NaN],
            ['Infinity', Infinity],
            ['undefined', undefined]
        ])('rechaza identificadores no válidos en un body objeto: %s', async (
            description,
            documentId
        ) => {

            await expectInvalidEvent({
                body: {
                    ...registerBody,
                    documentoLegalIds: [
                        documentId,
                        35
                    ]
                }
            });
        });


        test('rechaza el registro sin documentoLegalIds', async () => {

            const {
                documentoLegalIds: omittedIds,
                ...params
            } = registerBody;

            await expectInvalidBody(params);
        });


        test.each([
            ['arreglo válido', [12, 35]],
            ['arreglo vacío', []],
            ['null', null],
            ['cadena', '12,35'],
            ['número', 12]
        ])('rechaza documentoLegalIds durante login: %s', async (
            description,
            documentIds
        ) => {

            await expectInvalidBody({
                ...loginBody,
                documentoLegalIds: documentIds
            });
        });


        test('rechaza documentoLegalIds undefined durante login con body objeto', async () => {

            await expectInvalidEvent({
                body: {
                    ...loginBody,
                    documentoLegalIds: undefined
                }
            });
        });


        test('delega al servicio la validación de vigencia de los documentos', async () => {

            const params = {
                ...registerBody,
                documentoLegalIds: [100, 200]
            };

            GoogleAuthUser.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message:
                        'Documentos legales no vigentes'
                });

            const result = await handler(
                event(params)
            );

            expect(result.statusCode)
                .toBe(409);

            expect(JSON.parse(result.body))
                .toEqual({
                    message:
                        'Documentos legales no vigentes'
                });

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(params);
        });
    });


    /*
     * =====================================================
     * STRICT REQUEST CONTRACT
     * =====================================================
     */

    describe('Protección del contrato público de autenticación', () => {

        const unexpectedFields = [
            ['firebaseUid', 'ForgedFirebaseUID'],
            ['firebase_uid', 'ForgedFirebaseUID'],
            ['uid', 'ForgedFirebaseUID'],
            ['email', 'forged@example.com'],
            ['email_verified', true],
            ['provider', 'google.com'],
            ['usuarioId', 99],
            ['usuario_id', 99],
            ['rol_id', 1],
            ['password', 'unexpected-password'],
            ['token', 'unexpected-token'],
            ['authorization', 'Bearer unexpected-token'],
            ['pais', 'PER'],
            ['metodoAceptacion', 'manual'],
            ['fechaAceptacion', '2026-11-24T21:32:35Z'],
            ['version', '1.0'],
            ['headers', { authorization: 'Bearer token' }],
            ['extra', 'unexpected-value']
        ];


        describe.each(operations)(
            'operación %s',
            (action, body) => {

                test.each(unexpectedFields)(
                    'rechaza la propiedad adicional %s',
                    async (
                        fieldName,
                        fieldValue
                    ) => {

                        await expectInvalidBody({
                            ...body,
                            [fieldName]: fieldValue
                        });
                    }
                );


                test('rechaza una propiedad adicional undefined en un body objeto', async () => {

                    await expectInvalidEvent({
                        body: {
                            ...body,
                            extra: undefined
                        }
                    });
                });


                test('no transmite propiedades externas al body HTTP', async () => {

                    GoogleAuthUser.execute
                        .mockResolvedValue({
                            success: true,
                            action
                        });

                    const result = await handler({
                        ...event(body),
                        firebaseUid: 'ForgedFirebaseUID',
                        email: 'forged@example.com',
                        headers: {
                            authorization:
                                'Bearer unexpected-token'
                        },
                        requestContext: {
                            authorizer: {
                                uid: 'AnotherUID'
                            }
                        },
                        queryStringParameters: {
                            usuarioId: 99
                        }
                    });

                    expect(result.statusCode)
                        .toBe(200);

                    expect(
                        GoogleAuthUser.execute
                    ).toHaveBeenCalledWith(body);
                });
            }
        );


        test('no utiliza el encabezado Authorization como sustituto de idToken', async () => {

            await expectInvalidEvent({
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'login'
                })
            });
        });


        test('no utiliza token como alias de idToken', async () => {

            await expectInvalidBody({
                action: 'login',
                token
            });
        });


        test('no utiliza firebaseUid como sustituto de idToken', async () => {

            await expectInvalidBody({
                action: 'login',
                firebaseUid: 'FirebaseUID123'
            });
        });
    });


    /*
     * =====================================================
     * IMMUTABILITY
     * =====================================================
     */

    describe('Inmutabilidad de los parámetros recibidos', () => {

        test('no modifica el body original de login', async () => {

            const body = Object.freeze({
                ...loginBody,
                nombre: '  Ana López  '
            });

            GoogleAuthUser.execute
                .mockResolvedValue(loginResponse);

            await handler({
                body
            });

            expect(body).toEqual({
                ...loginBody,
                nombre: '  Ana López  '
            });

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith({
                ...loginBody,
                nombre: 'Ana López'
            });
        });


        test('no modifica el body original de registro', async () => {

            const body = Object.freeze({
                ...registerBody,
                nombre: '  Ana López  ',
                documentoLegalIds: Object.freeze([
                    52,
                    48
                ])
            });

            GoogleAuthUser.execute
                .mockResolvedValue(registerResponse);

            await handler({
                body
            });

            expect(body).toEqual({
                ...registerBody,
                nombre: '  Ana López  ',
                documentoLegalIds: [52, 48]
            });

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith({
                ...registerBody,
                documentoLegalIds: [52, 48]
            });
        });


        test('construye parámetros validados independientes del body original', async () => {

            GoogleAuthUser.execute
                .mockResolvedValue(registerResponse);

            await handler({
                body: registerBody
            });

            const params =
                GoogleAuthUser.execute
                    .mock.calls[0][0];

            expect(params)
                .not.toBe(registerBody);

            expect(params)
                .toEqual(registerBody);

            expect(params.documentoLegalIds)
                .not.toBe(documentoLegalIds);

            expect(params.documentoLegalIds)
                .toEqual(documentoLegalIds);
        });
    });


    /*
     * =====================================================
     * HTTP SUCCESS RESPONSE
     * =====================================================
     */

    describe('Construcción de respuestas HTTP exitosas', () => {

        describe.each(operations)(
            'operación %s',
            (action, body) => {

                test('devuelve statusCode 200 y body serializado', async () => {

                    const response = {
                        success: true,
                        action,
                        usuario: {
                            id: 25,
                            nombre: 'Ana López',
                            email: 'a@example.com'
                        }
                    };

                    GoogleAuthUser.execute
                        .mockResolvedValue(response);

                    const result = await handler(
                        event(body)
                    );

                    expect(result).toEqual({
                        statusCode: 200,
                        body: JSON.stringify(response)
                    });

                    expect(typeof result.body)
                        .toBe('string');

                    expect(
                        GoogleAuthUser.execute
                    ).toHaveBeenCalledTimes(1);
                });


                test('conserva las propiedades de la respuesta del servicio', async () => {

                    const response = {
                        success: true,
                        action,
                        email: 'a@example.com',
                        datosAdicionales: {
                            usuarioId: 25
                        }
                    };

                    GoogleAuthUser.execute
                        .mockResolvedValue(response);

                    const result = await handler(
                        event(body)
                    );

                    expect(JSON.parse(result.body))
                        .toEqual(response);
                });


                test('no modifica la respuesta original del servicio', async () => {

                    const response = Object.freeze({
                        success: true,
                        action
                    });

                    GoogleAuthUser.execute
                        .mockResolvedValue(response);

                    const result = await handler(
                        event(body)
                    );

                    expect(JSON.parse(result.body))
                        .toEqual(response);

                    expect(response).toEqual({
                        success: true,
                        action
                    });
                });
            }
        );


        test('conserva una respuesta con documentos legales pendientes', async () => {

            const response = {
                success: true,
                action: 'login',
                documentosPendientes: [
                    { id: 48 },
                    { id: 52 }
                ]
            };

            GoogleAuthUser.execute
                .mockResolvedValue(response);

            const result = await handler(
                event(loginBody)
            );

            expect(result.statusCode)
                .toBe(200);

            expect(JSON.parse(result.body))
                .toEqual(response);
        });


        test('conserva una respuesta de registro con documentos aceptados', async () => {

            const response = {
                success: true,
                action: 'register',
                documentoLegalIds
            };

            GoogleAuthUser.execute
                .mockResolvedValue(response);

            const result = await handler(
                event(registerBody)
            );

            expect(result.statusCode)
                .toBe(200);

            expect(JSON.parse(result.body))
                .toEqual(response);
        });


        test.each([
            ['null', null],
            ['booleano true', true],
            ['booleano false', false],
            ['objeto vacío', {}],
            ['arreglo vacío', []]
        ])('serializa sin validar una respuesta resuelta de tipo %s', async (
            description,
            response
        ) => {

            GoogleAuthUser.execute
                .mockResolvedValue(response);

            const result = await handler(
                event(loginBody)
            );

            expect(result.statusCode)
                .toBe(200);

            expect(JSON.parse(result.body))
                .toEqual(response);
        });


        test('documenta la respuesta actual cuando el servicio devuelve undefined', async () => {

            GoogleAuthUser.execute
                .mockResolvedValue(undefined);

            const result = await handler(
                event(loginBody)
            );

            expect(result).toEqual({
                statusCode: 200,
                body: undefined
            });
        });


        test('devuelve HTTP 200 si el servicio resuelve una respuesta success false', async () => {

            const response = {
                success: false,
                statusCode: 409,
                message: 'Conflicto de registro'
            };

            GoogleAuthUser.execute
                .mockResolvedValue(response);

            const result = await handler(
                event(registerBody)
            );

            expect(result.statusCode)
                .toBe(200);

            expect(JSON.parse(result.body))
                .toEqual(response);
        });
    });


    /*
     * =====================================================
     * CONTROLLED HTTP ERRORS
     * =====================================================
     */

    describe('Propagación de errores HTTP controlados', () => {

        const controlledErrors = [
            [400, 'Operación no válida'],
            [401, 'Token de Firebase inválido o expirado'],
            [403, 'Se requiere una cuenta de Google verificada'],
            [404, 'Usuario no registrado'],
            [409, 'Conflicto de registro'],
            [502, 'No fue posible completar la operación'],
            [503, 'Servicio de autenticación no disponible']
        ];


        describe.each(operations)(
            'operación %s',
            (action, body) => {

                test.each(controlledErrors)(
                    'devuelve HTTP %i conservando el mensaje',
                    async (
                        statusCode,
                        message
                    ) => {

                        GoogleAuthUser.execute
                            .mockRejectedValue({
                                statusCode,
                                message
                            });

                        const result = await handler(
                            event(body)
                        );

                        expect(result).toEqual({
                            statusCode,
                            body: JSON.stringify({
                                message
                            })
                        });

                        expect(
                            GoogleAuthUser.execute
                        ).toHaveBeenCalledWith(body);

                        expect(
                            GoogleAuthUser.execute
                        ).toHaveBeenCalledTimes(1);
                    }
                );


                test('no reintenta automáticamente una operación fallida', async () => {

                    GoogleAuthUser.execute
                        .mockRejectedValue({
                            statusCode: 503,
                            message:
                                'Servicio no disponible'
                        });

                    const result = await handler(
                        event(body)
                    );

                    expect(result.statusCode)
                        .toBe(503);

                    expect(
                        GoogleAuthUser.execute
                    ).toHaveBeenCalledTimes(1);
                });
            }
        );


        test.each([
            'Respuesta interna inválida',
            'No fue posible completar la operación'
        ])('conserva el mensaje de comunicación interna: %s', async message => {

            GoogleAuthUser.execute
                .mockRejectedValue({
                    statusCode: 502,
                    message
                });

            const result = await handler(
                event(loginBody)
            );

            expect(result.statusCode)
                .toBe(502);

            expect(JSON.parse(result.body))
                .toEqual({
                    message
                });
        });


        test.each([
            ['400', 400],
            ['401', 401],
            ['403', 403],
            ['404', 404],
            ['409', 409],
            ['502', 502],
            ['503', 503]
        ])('convierte el código de error %s al número %i', async (
            originalCode,
            expectedCode
        ) => {

            GoogleAuthUser.execute
                .mockRejectedValue({
                    statusCode: originalCode,
                    message: 'Controlled error'
                });

            const result = await handler(
                event(loginBody)
            );

            expect(result.statusCode)
                .toBe(expectedCode);

            expect(JSON.parse(result.body))
                .toEqual({
                    message: 'Controlled error'
                });
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['booleano false', false],
            ['cero', 0]
        ])('utiliza un mensaje genérico cuando el error 409 contiene message %s', async (
            description,
            message
        ) => {

            GoogleAuthUser.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message
                });

            const result = await handler(
                event(registerBody)
            );

            expect(result.statusCode)
                .toBe(409);

            expect(JSON.parse(result.body))
                .toEqual({
                    message:
                        'No fue posible completar la operación'
                });
        });


        test('no transmite propiedades adicionales de un error controlado', async () => {

            GoogleAuthUser.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message: 'Conflicto de registro',
                    code: '23505',
                    detail: 'Sensitive database detail',
                    stack: 'Sensitive stack trace',
                    query: 'SELECT sensitive_data',
                    idToken: token
                });

            const result = await handler(
                event(registerBody)
            );

            expect(result.statusCode)
                .toBe(409);

            expect(JSON.parse(result.body))
                .toEqual({
                    message: 'Conflicto de registro'
                });
        });
    });


    /*
     * =====================================================
     * INTERNAL ERRORS
     * =====================================================
     */

    describe('Protección frente a errores internos', () => {

        test.each([
            ['500 numérico', 500],
            ['500 como cadena', '500'],
            ['undefined', undefined],
            ['null', null],
            ['cero', 0],
            ['cero como cadena', '0'],
            ['cadena vacía', ''],
            ['cadena no numérica', 'unknown'],
            ['NaN', NaN],
            ['booleano false', false],
            ['objeto vacío', {}]
        ])('devuelve HTTP 500 y mensaje genérico para statusCode %s', async (
            description,
            statusCode
        ) => {

            GoogleAuthUser.execute
                .mockRejectedValue({
                    statusCode,
                    message: 'Sensitive internal message',
                    detail: 'Sensitive internal detail'
                });

            const result = await handler(
                event(loginBody)
            );

            expect(result).toEqual({
                statusCode: 500,
                body: JSON.stringify({
                    message: 'Error interno del servidor'
                })
            });
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena', 'Sensitive internal error'],
            ['número', 123],
            ['booleano', true],
            ['objeto vacío', {}],
            ['arreglo', []],
            ['Error', new Error('Sensitive internal error')],
            ['TypeError', new TypeError('Sensitive type error')]
        ])('controla una excepción de tipo %s', async (
            description,
            error
        ) => {

            GoogleAuthUser.execute
                .mockRejectedValue(error);

            const result = await handler(
                event(registerBody)
            );

            expect(result.statusCode)
                .toBe(500);

            expect(JSON.parse(result.body))
                .toEqual({
                    message: 'Error interno del servidor'
                });
        });


        test('controla una excepción síncrona del servicio', async () => {

            GoogleAuthUser.execute
                .mockImplementation(() => {

                    throw new Error(
                        'Sensitive synchronous error'
                    );
                });

            const result = await handler(
                event(loginBody)
            );

            expect(result.statusCode)
                .toBe(500);

            expect(JSON.parse(result.body))
                .toEqual({
                    message: 'Error interno del servidor'
                });
        });


        test('controla un error de serialización de una respuesta circular', async () => {

            const response = {
                success: true
            };

            response.circular = response;

            GoogleAuthUser.execute
                .mockResolvedValue(response);

            const result = await handler(
                event(loginBody)
            );

            expect(result.statusCode)
                .toBe(500);

            expect(JSON.parse(result.body))
                .toEqual({
                    message: 'Error interno del servidor'
                });
        });


        test('controla un error de serialización de BigInt', async () => {

            GoogleAuthUser.execute
                .mockResolvedValue({
                    success: true,
                    usuarioId: BigInt(25)
                });

            const result = await handler(
                event(registerBody)
            );

            expect(result.statusCode)
                .toBe(500);

            expect(JSON.parse(result.body))
                .toEqual({
                    message: 'Error interno del servidor'
                });
        });
    });


    /*
     * =====================================================
     * CURRENT STATUS CODE BEHAVIOR
     * =====================================================
     *
     * Estas pruebas documentan el comportamiento actual.
     * No representan una recomendación para aceptar
     * códigos HTTP arbitrarios.
     */

    describe('Comportamiento actual de códigos HTTP no restringidos', () => {

        test.each([
            200,
            201,
            302,
            405,
            422,
            429,
            501,
            504,
            999,
            -1,
            400.5
        ])('documenta la propagación del código numérico %p', async statusCode => {

            GoogleAuthUser.execute
                .mockRejectedValue({
                    statusCode,
                    message: 'Simulated error'
                });

            const result = await handler(
                event(loginBody)
            );

            expect(result.statusCode)
                .toBe(statusCode);

            expect(JSON.parse(result.body))
                .toEqual({
                    message: 'Simulated error'
                });
        });
    });


    /*
     * =====================================================
     * SAFE LOGGING
     * =====================================================
     */

    describe('Registro seguro de errores', () => {

        test.each(operations)(
            'no registra errores durante una operación %s exitosa',
            async (
                action,
                body
            ) => {

                GoogleAuthUser.execute
                    .mockResolvedValue({
                        success: true,
                        action
                    });

                await handler(event(body));

                expect(errorSpy)
                    .not.toHaveBeenCalled();
            }
        );


        test('registra únicamente el código HTTP de una solicitud inválida', async () => {

            await expectInvalidBody({
                ...loginBody,
                firebaseUid: 'ForgedFirebaseUID'
            });

            expect(errorSpy)
                .toHaveBeenCalledTimes(1);

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[GoogleAuthHandler] Error',
                    {
                        statusCode: 400,
                        code: undefined
                    }
                );
        });


        test('no registra el contenido de un JSON inválido', async () => {

            const invalidJson =
                `{"idToken":"${token}"`;

            await expectInvalidEvent(
                {
                    body: invalidJson
                },
                'JSON inválido'
            );

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[GoogleAuthHandler] Error',
                    {
                        statusCode: 400,
                        code: undefined
                    }
                );

            expect(
                JSON.stringify(errorSpy.mock.calls)
            ).not.toContain(token);
        });


        test('no registra el token ni los documentos legales de una solicitud inválida', async () => {

            await expectInvalidBody({
                ...registerBody,
                documentoLegalIds: [12, 12]
            });

            const logs = JSON.stringify(
                errorSpy.mock.calls
            );

            expect(logs)
                .not.toContain(token);

            expect(logs)
                .not.toContain(registerBody.nombre);

            expect(logs)
                .not.toContain('documentoLegalIds');
        });


        test('registra únicamente statusCode y code de un error controlado', async () => {

            GoogleAuthUser.execute
                .mockRejectedValue({
                    statusCode: 401,
                    code: 'auth/id-token-expired',
                    message: 'Token inválido',
                    idToken: token
                });

            await handler(event(loginBody));

            expect(errorSpy)
                .toHaveBeenCalledTimes(1);

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[GoogleAuthHandler] Error',
                    {
                        statusCode: 401,
                        code: 'auth/id-token-expired'
                    }
                );

            expect(
                JSON.stringify(errorSpy.mock.calls)
            ).not.toContain(token);
        });


        test('no registra el mensaje ni el stack de una excepción inesperada', async () => {

            const error = Object.assign(
                new Error('Sensitive internal message'),
                {
                    code: 'INTERNAL_ERROR',
                    detail: 'Sensitive internal detail'
                }
            );

            GoogleAuthUser.execute
                .mockRejectedValue(error);

            await handler(event(registerBody));

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[GoogleAuthHandler] Error',
                    {
                        statusCode: undefined,
                        code: 'INTERNAL_ERROR'
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
                .not.toContain('stack');
        });


        test('registra el statusCode original antes de convertirlo a número', async () => {

            GoogleAuthUser.execute
                .mockRejectedValue({
                    statusCode: '409',
                    code: 'LEGAL_CONFLICT',
                    message: 'Conflicto legal'
                });

            const result = await handler(
                event(registerBody)
            );

            expect(result.statusCode)
                .toBe(409);

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[GoogleAuthHandler] Error',
                    {
                        statusCode: '409',
                        code: 'LEGAL_CONFLICT'
                    }
                );
        });


        test('controla y registra una excepción null sin exponer información adicional', async () => {

            GoogleAuthUser.execute
                .mockRejectedValue(null);

            const result = await handler(
                event(loginBody)
            );

            expect(result.statusCode)
                .toBe(500);

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[GoogleAuthHandler] Error',
                    {
                        statusCode: undefined,
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

        test('espera la resolución del servicio antes de construir la respuesta HTTP', async () => {

            let resolveService;

            GoogleAuthUser.execute
                .mockImplementation(
                    () => new Promise(resolve => {

                        resolveService = resolve;
                    })
                );

            let completed = false;

            const operation = handler(
                event(loginBody)
            ).then(result => {

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

            const result = await operation;

            expect(result.statusCode)
                .toBe(200);

            expect(JSON.parse(result.body))
                .toEqual(loginResponse);

            expect(completed)
                .toBe(true);
        });


        test('controla un rechazo asíncrono posterior a la invocación', async () => {

            let rejectService;

            GoogleAuthUser.execute
                .mockImplementation(
                    () => new Promise(
                        (resolve, reject) => {

                            rejectService = reject;
                        }
                    )
                );

            const operation = handler(
                event(registerBody)
            );

            rejectService({
                statusCode: 503,
                message: 'Servicio no disponible'
            });

            const result = await operation;

            expect(result.statusCode)
                .toBe(503);

            expect(JSON.parse(result.body))
                .toEqual({
                    message: 'Servicio no disponible'
                });
        });


        test('mantiene independientes las solicitudes concurrentes de login y registro', async () => {

            const resolveOperations = {};

            GoogleAuthUser.execute
                .mockImplementation(
                    params => new Promise(resolve => {

                        resolveOperations[
                            params.action
                        ] = resolve;
                    })
                );

            const loginOperation = handler(
                event(loginBody)
            );

            const registerOperation = handler(
                event(registerBody)
            );

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledTimes(2);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenNthCalledWith(
                1,
                loginBody
            );

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenNthCalledWith(
                2,
                registerBody
            );

            resolveOperations.register(
                registerResponse
            );

            const registerResult =
                await registerOperation;

            expect(registerResult.statusCode)
                .toBe(200);

            expect(JSON.parse(registerResult.body))
                .toEqual(registerResponse);

            resolveOperations.login(
                loginResponse
            );

            const loginResult =
                await loginOperation;

            expect(loginResult.statusCode)
                .toBe(200);

            expect(JSON.parse(loginResult.body))
                .toEqual(loginResponse);
        });


        test('una solicitud inválida no interfiere con una solicitud válida concurrente', async () => {

            let resolveService;

            GoogleAuthUser.execute
                .mockImplementation(
                    () => new Promise(resolve => {

                        resolveService = resolve;
                    })
                );

            const validOperation = handler(
                event(loginBody)
            );

            const invalidOperation = handler(
                event({
                    ...registerBody,
                    documentoLegalIds: []
                })
            );

            const invalidResult =
                await invalidOperation;

            expect(invalidResult.statusCode)
                .toBe(400);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledTimes(1);

            resolveService(loginResponse);

            const validResult =
                await validOperation;

            expect(validResult.statusCode)
                .toBe(200);

            expect(JSON.parse(validResult.body))
                .toEqual(loginResponse);
        });
    });


    /*
     * =====================================================
     * ROUTING RESPONSIBILITY
     * =====================================================
     *
     * El handler no comprueba directamente el método HTTP
     * ni la ruta. Esa responsabilidad corresponde a la
     * configuración de API Gateway y Serverless.
     */

    describe('Delimitación de responsabilidades de enrutamiento', () => {

        test('procesa una solicitud válida sin httpMethod ni path', async () => {

            GoogleAuthUser.execute
                .mockResolvedValue(loginResponse);

            const result = await handler({
                body: JSON.stringify(loginBody)
            });

            expect(result.statusCode)
                .toBe(200);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(loginBody);
        });


        test('documenta que el handler no valida directamente httpMethod', async () => {

            GoogleAuthUser.execute
                .mockResolvedValue(loginResponse);

            const result = await handler({
                ...event(loginBody),
                httpMethod: 'GET'
            });

            expect(result.statusCode)
                .toBe(200);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(loginBody);
        });


        test('documenta que el handler no valida directamente path', async () => {

            GoogleAuthUser.execute
                .mockResolvedValue(loginResponse);

            const result = await handler({
                ...event(loginBody),
                path: '/unexpected-path'
            });

            expect(result.statusCode)
                .toBe(200);

            expect(
                GoogleAuthUser.execute
            ).toHaveBeenCalledWith(loginBody);
        });
    });
});