jest.mock(
    '@user/services/user/LegalAuthService',
    () => ({
        authenticate: jest.fn()
    })
);

jest.mock(
    '@user/services/user/LegalAuthLambdaService',
    () => ({
        execute: jest.fn()
    })
);

const LegalAuthService = require(
    '@user/services/user/LegalAuthService'
);

const LegalAuthLambdaService = require(
    '@user/services/user/LegalAuthLambdaService'
);

const { handler } = require(
    '@user/handlers/legal-auth'
);


const firebaseUid = 'AbCdEf123FirebaseUID';

const email = 'user@example.com';

const token = 'simulated-firebase-token';

const documentoLegalIds = [12, 35];

const headers = {
    Authorization: `Bearer ${token}`
};

const passwordIdentity = {
    uid: firebaseUid,
    email,
    provider: 'password'
};

const googleIdentity = {
    uid: firebaseUid,
    email,
    provider: 'google.com'
};


const registerPath = '/insertar-usuario-nuevo';

const pendingPath = '/consultar-aceptaciones-legales';

const acceptancePath = '/registrar-aceptaciones-legales';


const registerBody = {
    nombre: 'Ana López',
    email,
    pais: 'PER',
    documentoLegalIds
};

const pendingBody = {};

const acceptanceBody = {
    documentoLegalIds
};


const registerParams = {
    action: 'register-traditional',
    email,
    firebaseUid,
    nombre: 'Ana López',
    pais: 'PER',
    documentoLegalIds
};

const pendingParams = {
    action: 'get-pending-acceptances',
    firebaseUid
};

const acceptanceParams = {
    action: 'register-acceptances',
    firebaseUid,
    documentoLegalIds
};


const registerResponse = {
    success: true,
    usuario: [
        {
            id: 25,
            nombre: 'Ana López',
            email
        }
    ]
};

const pendingResponse = {
    success: true,
    documentosPendientes: [
        { id: 48 },
        { id: 52 }
    ]
};

const acceptanceResponse = {
    success: true,
    documentoLegalIds
};


const operations = [
    [
        'register-traditional',
        registerPath,
        registerBody,
        registerParams,
        registerResponse,
        registerResponse.usuario
    ],
    [
        'get-pending-acceptances',
        pendingPath,
        pendingBody,
        pendingParams,
        pendingResponse,
        pendingResponse
    ],
    [
        'register-acceptances',
        acceptancePath,
        acceptanceBody,
        acceptanceParams,
        acceptanceResponse,
        acceptanceResponse
    ]
];


const event = (
    path,
    body,
    overrides = {}
) => ({
    httpMethod: 'POST',
    path: `/cupcakeslife/usuarios${path}`,
    headers,
    body: JSON.stringify(body),
    ...overrides
});


const expectHttpResponse = (
    response,
    statusCode,
    body
) => {

    expect(response).toEqual({
        statusCode,
        body: JSON.stringify(body)
    });
};


const expectHttpError = (
    response,
    statusCode,
    message
) => {

    expectHttpResponse(
        response,
        statusCode,
        { message }
    );
};


const expectInvalidEvent = async (
    request,
    expectedMessage
) => {

    const response = await handler(request);

    expect(response.statusCode)
        .toBe(400);

    const body = JSON.parse(response.body);

    expect(body).toEqual({
        message: expect.any(String)
    });

    expect(body.message.length)
        .toBeGreaterThan(0);

    if (expectedMessage !== undefined) {

        expect(body.message)
            .toBe(expectedMessage);
    }

    expect(
        LegalAuthService.authenticate
    ).not.toHaveBeenCalled();

    expect(
        LegalAuthLambdaService.execute
    ).not.toHaveBeenCalled();
};


const expectInvalidBody = async (
    path,
    body,
    expectedMessage
) => {

    await expectInvalidEvent(
        event(path, body),
        expectedMessage
    );
};


const expectSuccessfulOperation = async (
    request,
    params,
    serviceResponse,
    expectedResponse = serviceResponse
) => {

    LegalAuthLambdaService.execute
        .mockResolvedValue(serviceResponse);

    const response = await handler(request);

    expectHttpResponse(
        response,
        200,
        expectedResponse
    );

    expect(
        LegalAuthService.authenticate
    ).toHaveBeenCalledWith(request.headers);

    expect(
        LegalAuthService.authenticate
    ).toHaveBeenCalledTimes(1);

    expect(
        LegalAuthLambdaService.execute
    ).toHaveBeenCalledWith(params);

    expect(
        LegalAuthLambdaService.execute
    ).toHaveBeenCalledTimes(1);
};


let logSpy;
let errorSpy;

let originalEndpointRoot;
let originalUserModule;


beforeEach(() => {

    jest.resetAllMocks();

    originalEndpointRoot =
        process.env.ENDPOINT_ROOT;

    originalUserModule =
        process.env.USER_MODULE;

    delete process.env.ENDPOINT_ROOT;
    delete process.env.USER_MODULE;

    LegalAuthService.authenticate
        .mockResolvedValue(passwordIdentity);

    logSpy = jest.spyOn(console, 'log')
        .mockImplementation(() => {});

    errorSpy = jest.spyOn(console, 'error')
        .mockImplementation(() => {});
});


afterEach(() => {

    if (originalEndpointRoot === undefined) {

        delete process.env.ENDPOINT_ROOT;

    } else {

        process.env.ENDPOINT_ROOT =
            originalEndpointRoot;
    }

    if (originalUserModule === undefined) {

        delete process.env.USER_MODULE;

    } else {

        process.env.USER_MODULE =
            originalUserModule;
    }

    jest.restoreAllMocks();
});


describe('Legal Auth Handler', () => {

    /*
     * =====================================================
     * SUPPORTED OPERATIONS
     * =====================================================
     */

    describe('Operaciones públicas admitidas', () => {

        test.each(operations)(
            'ejecuta correctamente %s',
            async (
                action,
                path,
                body,
                params,
                serviceResponse,
                expectedResponse
            ) => {

                await expectSuccessfulOperation(
                    event(path, body),
                    params,
                    serviceResponse,
                    expectedResponse
                );
            }
        );


        test.each(operations)(
            'autentica antes de invocar la Lambda interna durante %s',
            async (
                action,
                path,
                body,
                params,
                serviceResponse
            ) => {

                LegalAuthLambdaService.execute
                    .mockResolvedValue(serviceResponse);

                await handler(event(path, body));

                const authenticationOrder =
                    LegalAuthService.authenticate
                        .mock.invocationCallOrder[0];

                const invocationOrder =
                    LegalAuthLambdaService.execute
                        .mock.invocationCallOrder[0];

                expect(authenticationOrder)
                    .toBeLessThan(invocationOrder);
            }
        );
    });


    /*
     * =====================================================
     * HTTP METHODS
     * =====================================================
     */

    describe('Validación del método HTTP', () => {

        describe.each(operations)(
            'operación %s',
            (
                action,
                path,
                body,
                params,
                serviceResponse,
                expectedResponse
            ) => {

                test.each([
                    'GET',
                    'PUT',
                    'PATCH',
                    'DELETE',
                    'OPTIONS',
                    'HEAD',
                    '',
                    null,
                    undefined
                ])('rechaza el método %p', async method => {

                    const response = await handler(
                        event(path, body, {
                            httpMethod: method
                        })
                    );

                    expectHttpError(
                        response,
                        405,
                        'Método HTTP no permitido'
                    );

                    expect(
                        LegalAuthService.authenticate
                    ).not.toHaveBeenCalled();

                    expect(
                        LegalAuthLambdaService.execute
                    ).not.toHaveBeenCalled();
                });


                test.each([
                    'POST',
                    'post',
                    'Post'
                ])('acepta el método %s', async method => {

                    await expectSuccessfulOperation(
                        event(path, body, {
                            httpMethod: method
                        }),
                        params,
                        serviceResponse,
                        expectedResponse
                    );
                });
            }
        );


        test('rechaza POST con espacios exteriores', async () => {

            const response = await handler(
                event(pendingPath, {}, {
                    httpMethod: ' POST '
                })
            );

            expectHttpError(
                response,
                405,
                'Método HTTP no permitido'
            );
        });


        test('acepta el formato HTTP API Gateway v2', async () => {

            await expectSuccessfulOperation(
                {
                    rawPath: pendingPath,
                    requestContext: {
                        http: {
                            method: 'POST'
                        }
                    },
                    headers
                },
                pendingParams,
                pendingResponse
            );
        });


        test('prioriza httpMethod sobre requestContext.http.method', async () => {

            const response = await handler({
                httpMethod: 'GET',
                rawPath: pendingPath,
                requestContext: {
                    http: {
                        method: 'POST'
                    }
                },
                headers
            });

            expectHttpError(
                response,
                405,
                'Método HTTP no permitido'
            );
        });


        test.each([
            [undefined],
            [null],
            [{}]
        ])('rechaza un evento sin método HTTP: %p', async request => {

            const response = await handler(request);

            expectHttpError(
                response,
                405,
                'Método HTTP no permitido'
            );

            expect(
                LegalAuthService.authenticate
            ).not.toHaveBeenCalled();
        });
    });


    /*
     * =====================================================
     * ROUTE NORMALIZATION
     * =====================================================
     */

    describe('Normalización de rutas', () => {

        describe.each(operations)(
            'operación %s',
            (
                action,
                path,
                body,
                params,
                serviceResponse,
                expectedResponse
            ) => {

                test.each([
                    ['ruta directa', ''],
                    ['módulo usuario', '/usuarios'],
                    ['raíz API', '/cupcakeslife'],
                    [
                        'raíz y módulo',
                        '/cupcakeslife/usuarios'
                    ]
                ])('acepta %s', async (
                    description,
                    prefix
                ) => {

                    await expectSuccessfulOperation(
                        event(path, body, {
                            path: `${prefix}${path}`
                        }),
                        params,
                        serviceResponse,
                        expectedResponse
                    );
                });


                test('acepta una barra final', async () => {

                    await expectSuccessfulOperation(
                        event(path, body, {
                            path:
                                `/cupcakeslife/usuarios${path}/`
                        }),
                        params,
                        serviceResponse,
                        expectedResponse
                    );
                });


                test('acepta una ruta directa sin barra inicial', async () => {

                    await expectSuccessfulOperation(
                        event(path, body, {
                            path: path.slice(1)
                        }),
                        params,
                        serviceResponse,
                        expectedResponse
                    );
                });


                test.each([
                    'local',
                    'dev',
                    'prod'
                ])('elimina correctamente el stage %s', async stage => {

                    await expectSuccessfulOperation(
                        event(path, body, {
                            path:
                                `/${stage}/cupcakeslife/usuarios${path}`,
                            requestContext: {
                                stage
                            }
                        }),
                        params,
                        serviceResponse,
                        expectedResponse
                    );
                });


                test('utiliza ENDPOINT_ROOT y USER_MODULE personalizados', async () => {

                    process.env.ENDPOINT_ROOT =
                        'custom-api';

                    process.env.USER_MODULE =
                        'custom-users';

                    await expectSuccessfulOperation(
                        event(path, body, {
                            path:
                                `/custom-api/custom-users${path}`
                        }),
                        params,
                        serviceResponse,
                        expectedResponse
                    );
                });


                test('acepta variables de entorno con barra inicial', async () => {

                    process.env.ENDPOINT_ROOT =
                        '/custom-api';

                    process.env.USER_MODULE =
                        '/custom-users';

                    await expectSuccessfulOperation(
                        event(path, body, {
                            path:
                                `/custom-api/custom-users${path}`
                        }),
                        params,
                        serviceResponse,
                        expectedResponse
                    );
                });
            }
        );


        test.each([
            '/',
            '/unknown',
            '/cupcakeslife',
            '/cupcakeslife/usuarios',
            '/cupcakeslife-extra/usuarios/consultar-aceptaciones-legales',
            '/cupcakeslife/usuarios-extra/consultar-aceptaciones-legales',
            '/CONSULTAR-ACEPTACIONES-LEGALES',
            '/consultar-aceptaciones-legales//',
            '/consultar-aceptaciones-legales/extra'
        ])('rechaza la ruta desconocida %s', async path => {

            const response = await handler(
                event(pendingPath, {}, {
                    path
                })
            );

            expectHttpError(
                response,
                404,
                'Endpoint no encontrado'
            );

            expect(
                LegalAuthService.authenticate
            ).not.toHaveBeenCalled();

            expect(
                LegalAuthLambdaService.execute
            ).not.toHaveBeenCalled();
        });


        test('prioriza rawPath sobre path', async () => {

            await expectSuccessfulOperation(
                event(pendingPath, {}, {
                    rawPath: pendingPath,
                    path: '/unknown'
                }),
                pendingParams,
                pendingResponse
            );
        });


        test('rechaza rawPath desconocido aunque path sea válido', async () => {

            const response = await handler(
                event(pendingPath, {}, {
                    rawPath: '/unknown'
                })
            );

            expectHttpError(
                response,
                404,
                'Endpoint no encontrado'
            );

            expect(
                LegalAuthService.authenticate
            ).not.toHaveBeenCalled();
        });


        test('utiliza la ruta raíz cuando no recibe rawPath ni path', async () => {

            const response = await handler({
                httpMethod: 'POST',
                headers
            });

            expectHttpError(
                response,
                404,
                'Endpoint no encontrado'
            );
        });


        test('no elimina un stage que no coincide con requestContext.stage', async () => {

            const response = await handler(
                event(pendingPath, {}, {
                    path:
                        `/prod/cupcakeslife/usuarios${pendingPath}`,
                    requestContext: {
                        stage: 'dev'
                    }
                })
            );

            expectHttpError(
                response,
                404,
                'Endpoint no encontrado'
            );
        });


        test('valida el método antes de comprobar la ruta', async () => {

            const response = await handler({
                httpMethod: 'GET',
                path: '/unknown'
            });

            expectHttpError(
                response,
                405,
                'Método HTTP no permitido'
            );
        });
    });


    /*
     * =====================================================
     * REQUEST BODY
     * =====================================================
     */

    describe('Interpretación del cuerpo HTTP', () => {

        describe.each(operations)(
            'operación %s',
            (
                action,
                path,
                body,
                params,
                serviceResponse,
                expectedResponse
            ) => {

                test('acepta un body previamente convertido a objeto', async () => {

                    await expectSuccessfulOperation(
                        event(path, body, {
                            body
                        }),
                        params,
                        serviceResponse,
                        expectedResponse
                    );
                });


                test('acepta JSON con espacios y saltos de línea', async () => {

                    await expectSuccessfulOperation(
                        event(path, body, {
                            body: JSON.stringify(
                                body,
                                null,
                                4
                            )
                        }),
                        params,
                        serviceResponse,
                        expectedResponse
                    );
                });


                test('decodifica correctamente un body Base64', async () => {

                    const encodedBody = Buffer.from(
                        JSON.stringify(body),
                        'utf8'
                    ).toString('base64');

                    await expectSuccessfulOperation(
                        event(path, body, {
                            body: encodedBody,
                            isBase64Encoded: true
                        }),
                        params,
                        serviceResponse,
                        expectedResponse
                    );
                });


                test.each([
                    '{invalid',
                    '{"nombre":',
                    '{"nombre":"Ana",}',
                    '[1,2',
                    'invalid-json',
                    '   ',
                    '\t\t'
                ])('rechaza JSON mal formado: %p', async malformedBody => {

                    await expectInvalidEvent(
                        event(path, body, {
                            body: malformedBody
                        }),
                        'JSON inválido'
                    );
                });


                test.each([
                    ['null', null],
                    ['booleano true', true],
                    ['booleano false', false],
                    ['número', 123],
                    ['cadena', 'unexpected'],
                    ['arreglo vacío', []],
                    ['arreglo con objeto', [{}]]
                ])('rechaza JSON con estructura incorrecta: %s', async (
                    description,
                    invalidBody
                ) => {

                    await expectInvalidBody(
                        path,
                        invalidBody
                    );
                });


                test('rechaza Base64 cuyo contenido no es JSON válido', async () => {

                    await expectInvalidEvent(
                        event(path, body, {
                            body: Buffer.from(
                                'invalid-json'
                            ).toString('base64'),
                            isBase64Encoded: true
                        }),
                        'JSON inválido'
                    );
                });


                test('rechaza Base64 cuando el indicador no está habilitado', async () => {

                    await expectInvalidEvent(
                        event(path, body, {
                            body: Buffer.from(
                                JSON.stringify(body)
                            ).toString('base64'),
                            isBase64Encoded: false
                        }),
                        'JSON inválido'
                    );
                });
            }
        );


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', '']
        ])('acepta una consulta con body %s', async (
            description,
            body
        ) => {

            await expectSuccessfulOperation(
                event(pendingPath, {}, {
                    body
                }),
                pendingParams,
                pendingResponse
            );
        });


        describe.each([
            [
                'registro tradicional',
                registerPath
            ],
            [
                'registro de aceptaciones',
                acceptancePath
            ]
        ])(
            'body obligatorio durante %s',
            (description, path) => {

                test.each([
                    ['undefined', undefined],
                    ['null', null],
                    ['cadena vacía', '']
                ])('rechaza body %s', async (
                    bodyDescription,
                    body
                ) => {

                    await expectInvalidEvent(
                        event(path, {}, {
                            body
                        })
                    );
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
            'USER@EXAMPLE.COM',
            '  User@Example.Com  ',
            '\tUser@Example.Com\n'
        ])('normaliza el correo %p antes de compararlo', async originalEmail => {

            await expectSuccessfulOperation(
                event(registerPath, {
                    ...registerBody,
                    email: originalEmail
                }),
                registerParams,
                registerResponse,
                registerResponse.usuario
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

            await expectInvalidBody(
                registerPath,
                {
                    ...registerBody,
                    email: invalidEmail
                }
            );
        });


        test('rechaza un correo distinto al autenticado', async () => {

            const response = await handler(
                event(registerPath, {
                    ...registerBody,
                    email: 'another@example.com'
                })
            );

            expectHttpError(
                response,
                403,
                'El correo no coincide con la identidad autenticada'
            );

            expect(
                LegalAuthService.authenticate
            ).toHaveBeenCalledTimes(1);

            expect(
                LegalAuthLambdaService.execute
            ).not.toHaveBeenCalled();
        });


        test('rechaza un correo autenticado que no coincide exactamente con el normalizado', async () => {

            LegalAuthService.authenticate
                .mockResolvedValue({
                    ...passwordIdentity,
                    email: 'USER@EXAMPLE.COM'
                });

            const response = await handler(
                event(registerPath, registerBody)
            );

            expectHttpError(
                response,
                403,
                'El correo no coincide con la identidad autenticada'
            );

            expect(
                LegalAuthLambdaService.execute
            ).not.toHaveBeenCalled();
        });
    });


    /*
     * =====================================================
     * TRADITIONAL REGISTRATION - NAME
     * =====================================================
     */

    describe('Nombre durante el registro tradicional', () => {

        test.each([
            ['AB', 'AB'],
            ['  Ana López  ', 'Ana López'],
            ['Ana   López', 'Ana López'],
            ['Ana\tLópez', 'Ana López'],
            ['Ana\nLópez', 'Ana López'],
            ['María José Muñoz', 'María José Muñoz'],
            ['Jean-Pierre', 'Jean-Pierre'],
            ['A'.repeat(50), 'A'.repeat(50)],
            [
                `  ${'A'.repeat(50)}  `,
                'A'.repeat(50)
            ]
        ])('normaliza el nombre %p como %p', async (
            originalName,
            normalizedName
        ) => {

            await expectSuccessfulOperation(
                event(registerPath, {
                    ...registerBody,
                    nombre: originalName
                }),
                {
                    ...registerParams,
                    nombre: normalizedName
                },
                registerResponse,
                registerResponse.usuario
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

            await expectInvalidBody(
                registerPath,
                {
                    ...registerBody,
                    nombre
                }
            );
        });


        test('valida la longitud antes de compactar espacios interiores', async () => {

            await expectInvalidBody(
                registerPath,
                {
                    ...registerBody,
                    nombre:
                        `Ana${' '.repeat(50)}López`
                }
            );
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
            ['ZZZ', 'ZZZ'],
            [undefined, 'PER'],
            [null, 'PER'],
            ['', 'PER']
        ])('normaliza el país %p como %s', async (
            originalCountry,
            normalizedCountry
        ) => {

            await expectSuccessfulOperation(
                event(registerPath, {
                    ...registerBody,
                    pais: originalCountry
                }),
                {
                    ...registerParams,
                    pais: normalizedCountry
                },
                registerResponse,
                registerResponse.usuario
            );
        });


        test.each([
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

            await expectInvalidBody(
                registerPath,
                {
                    ...registerBody,
                    pais
                }
            );
        });
    });


    /*
     * =====================================================
     * LEGAL DOCUMENT VALIDATION
     * =====================================================
     */

    describe('Validación de documentos legales', () => {

        const documentOperations = [
            [
                'registro tradicional',
                registerPath,
                registerBody,
                registerParams,
                registerResponse,
                registerResponse.usuario
            ],
            [
                'registro posterior',
                acceptancePath,
                acceptanceBody,
                acceptanceParams,
                acceptanceResponse,
                acceptanceResponse
            ]
        ];


        describe.each(documentOperations)(
            '%s',
            (
                description,
                path,
                body,
                params,
                serviceResponse,
                expectedResponse
            ) => {

                test.each([
                    [[1, 2]],
                    [[12, 35]],
                    [[48, 52]],
                    [[52, 48]],
                    [[100, 500]]
                ])('acepta los documentos %p', async documentIds => {

                    await expectSuccessfulOperation(
                        event(path, {
                            ...body,
                            documentoLegalIds: documentIds
                        }),
                        {
                            ...params,
                            documentoLegalIds: documentIds
                        },
                        serviceResponse,
                        expectedResponse
                    );
                });


                test.each([
                    ['undefined', undefined],
                    ['null', null],
                    ['arreglo vacío', []],
                    ['tres documentos', [12, 35, 48]],
                    ['cuatro documentos', [12, 35, 48, 52]],
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
                    ['cadena', '12,35'],
                    ['número', 12],
                    ['booleano', true],
                    ['objeto', { first: 12, second: 35 }]
                ])('rechaza documentos inválidos: %s', async (
                    documentDescription,
                    documentIds
                ) => {

                    await expectInvalidBody(
                        path,
                        {
                            ...body,
                            documentoLegalIds: documentIds
                        }
                    );
                });


                test.each([
                    [[12, 12]],
                    [[35, 35]],
                    [[48, 48]]
                ])('rechaza documentos duplicados: %p', async documentIds => {

                    await expectInvalidBody(
                        path,
                        {
                            ...body,
                            documentoLegalIds: documentIds
                        },
                        'Los documentos legales no pueden estar duplicados'
                    );
                });


                test.each([
                    ['NaN', NaN],
                    ['Infinity', Infinity],
                    ['undefined', undefined]
                ])('rechaza un identificador %s en body objeto', async (
                    documentDescription,
                    documentId
                ) => {

                    await expectInvalidEvent(
                        event(path, body, {
                            body: {
                                ...body,
                                documentoLegalIds: [
                                    documentId,
                                    35
                                ]
                            }
                        })
                    );
                });


                test('rechaza la ausencia de documentoLegalIds', async () => {

                    const {
                        documentoLegalIds: omittedIds,
                        ...remainingBody
                    } = body;

                    await expectInvalidBody(
                        path,
                        remainingBody
                    );
                });
            }
        );


        test.each([
            [[1]],
            [[12]],
            [[48]]
        ])('rechaza registro tradicional con un documento: %p', async documentIds => {

            await expectInvalidBody(
                registerPath,
                {
                    ...registerBody,
                    documentoLegalIds: documentIds
                },
                'Debe aceptar los dos documentos legales obligatorios'
            );
        });


        test.each([
            [[1]],
            [[12]],
            [[48]]
        ])('acepta registro posterior con un documento: %p', async documentIds => {

            const response = {
                success: true,
                documentoLegalIds: documentIds
            };

            await expectSuccessfulOperation(
                event(acceptancePath, {
                    documentoLegalIds: documentIds
                }),
                {
                    ...acceptanceParams,
                    documentoLegalIds: documentIds
                },
                response
            );
        });


        test.each([
            [[]],
            [[12]],
            [[12, 35]],
            [null]
        ])('rechaza documentos legales durante la consulta: %p', async documentIds => {

            await expectInvalidBody(
                pendingPath,
                {
                    documentoLegalIds: documentIds
                }
            );
        });
    });


    /*
     * =====================================================
     * STRICT PUBLIC CONTRACT
     * =====================================================
     */

    describe('Protección del contrato público', () => {

        const unexpectedFields = [
            ['firebaseUid', 'ForgedFirebaseUID'],
            ['firebase_uid', 'ForgedFirebaseUID'],
            ['uid', 'ForgedFirebaseUID'],
            ['usuarioId', 99],
            ['usuario_id', 99],
            ['rol_id', 1],
            ['idToken', 'unexpected-token'],
            ['token', 'unexpected-token'],
            ['password', 'unexpected-password'],
            ['provider', 'password'],
            ['email_verified', true],
            ['authorization', 'Bearer unexpected-token'],
            ['headers', { authorization: 'Bearer token' }],
            ['action', 'register-traditional'],
            ['metodoAceptacion', 'manual'],
            ['fechaAceptacion', '2026-11-24T21:32:35Z'],
            ['version', '1.0'],
            ['extra', 'unexpected-value']
        ];


        describe.each(operations)(
            'operación %s',
            (action, path, body) => {

                test.each(unexpectedFields)(
                    'rechaza la propiedad adicional %s',
                    async (
                        fieldName,
                        fieldValue
                    ) => {

                        await expectInvalidBody(
                            path,
                            {
                                ...body,
                                [fieldName]: fieldValue
                            }
                        );
                    }
                );


                test('rechaza una propiedad adicional undefined en body objeto', async () => {

                    await expectInvalidEvent(
                        event(path, body, {
                            body: {
                                ...body,
                                extra: undefined
                            }
                        })
                    );
                });
            }
        );


        describe.each([
            [
                'consulta de pendientes',
                pendingPath,
                pendingBody
            ],
            [
                'registro de aceptaciones',
                acceptancePath,
                acceptanceBody
            ]
        ])(
            '%s',
            (description, path, body) => {

                test.each([
                    ['email', email],
                    ['nombre', 'Ana López'],
                    ['pais', 'PER']
                ])('rechaza el campo no permitido %s', async (
                    fieldName,
                    fieldValue
                ) => {

                    await expectInvalidBody(
                        path,
                        {
                            ...body,
                            [fieldName]: fieldValue
                        }
                    );
                });
            }
        );


        test('rechaza documentoLegalIds undefined durante la consulta con body objeto', async () => {

            await expectInvalidEvent(
                event(pendingPath, {}, {
                    body: {
                        documentoLegalIds: undefined
                    }
                })
            );
        });


        test.each(operations)(
            'ignora parámetros de identidad externos al body durante %s',
            async (
                action,
                path,
                body,
                params,
                serviceResponse,
                expectedResponse
            ) => {

                await expectSuccessfulOperation(
                    event(path, body, {
                        firebaseUid: 'ForgedUID',
                        email: 'forged@example.com',
                        queryStringParameters: {
                            firebaseUid: 'AnotherUID'
                        },
                        pathParameters: {
                            usuarioId: 99
                        },
                        requestContext: {
                            authorizer: {
                                uid: 'AnotherIdentity'
                            }
                        }
                    }),
                    params,
                    serviceResponse,
                    expectedResponse
                );
            }
        );
    });


    /*
     * =====================================================
     * AUTHENTICATION
     * =====================================================
     */

    describe('Autenticación mediante Firebase', () => {

        describe.each(operations)(
            'operación %s',
            (
                action,
                path,
                body,
                params,
                serviceResponse,
                expectedResponse
            ) => {

                test.each([
                    [
                        'Authorization',
                        { Authorization: `Bearer ${token}` }
                    ],
                    [
                        'authorization',
                        { authorization: `Bearer ${token}` }
                    ],
                    [
                        'capitalización mixta',
                        { aUtHoRiZaTiOn: `Bearer ${token}` }
                    ]
                ])('delega los headers originales: %s', async (
                    description,
                    requestHeaders
                ) => {

                    await expectSuccessfulOperation(
                        event(path, body, {
                            headers: requestHeaders
                        }),
                        params,
                        serviceResponse,
                        expectedResponse
                    );

                    expect(
                        LegalAuthService.authenticate
                            .mock.calls[0][0]
                    ).toBe(requestHeaders);
                });


                test.each([
                    ['undefined', undefined],
                    ['null', null],
                    ['objeto vacío', {}],
                    ['token vacío', { Authorization: '' }],
                    ['sin Bearer', { Authorization: token }]
                ])('propaga el rechazo de autenticación para headers %s', async (
                    description,
                    requestHeaders
                ) => {

                    LegalAuthService.authenticate
                        .mockRejectedValue({
                            statusCode: 401,
                            message:
                                'Token de autenticación requerido'
                        });

                    const response = await handler(
                        event(path, body, {
                            headers: requestHeaders
                        })
                    );

                    expectHttpError(
                        response,
                        401,
                        'Token de autenticación requerido'
                    );

                    expect(
                        LegalAuthService.authenticate
                    ).toHaveBeenCalledWith(
                        requestHeaders
                    );

                    expect(
                        LegalAuthLambdaService.execute
                    ).not.toHaveBeenCalled();
                });


                test.each([
                    [
                        401,
                        'Token de Firebase inválido o expirado'
                    ],
                    [
                        403,
                        'Identidad de usuario no válida'
                    ],
                    [
                        403,
                        'Debe verificar su correo electrónico'
                    ],
                    [
                        503,
                        'Servicio de autenticación no disponible'
                    ]
                ])('propaga el error de autenticación HTTP %i', async (
                    statusCode,
                    message
                ) => {

                    LegalAuthService.authenticate
                        .mockRejectedValue({
                            statusCode,
                            message
                        });

                    const response = await handler(
                        event(path, body)
                    );

                    expectHttpError(
                        response,
                        statusCode,
                        message
                    );

                    expect(
                        LegalAuthService.authenticate
                    ).toHaveBeenCalledTimes(1);

                    expect(
                        LegalAuthLambdaService.execute
                    ).not.toHaveBeenCalled();
                });


                test('protege una excepción inesperada de autenticación', async () => {

                    LegalAuthService.authenticate
                        .mockRejectedValue(
                            new Error(
                                'Sensitive Firebase error'
                            )
                        );

                    const response = await handler(
                        event(path, body)
                    );

                    expectHttpError(
                        response,
                        500,
                        'Error interno del servidor'
                    );

                    expect(
                        LegalAuthLambdaService.execute
                    ).not.toHaveBeenCalled();
                });


                test('no autentica una solicitud cuyo JSON es inválido', async () => {

                    await expectInvalidEvent(
                        event(path, body, {
                            body: '{invalid'
                        }),
                        'JSON inválido'
                    );
                });
            }
        );
    });


    /*
     * =====================================================
     * AUTHENTICATED PROVIDER
     * =====================================================
     */

    describe('Proveedor de identidad autenticado', () => {

        test('permite registro tradicional con proveedor password', async () => {

            await expectSuccessfulOperation(
                event(registerPath, registerBody),
                registerParams,
                registerResponse,
                registerResponse.usuario
            );
        });


        test.each([
            'google.com',
            'facebook.com',
            'anonymous',
            'custom',
            '',
            null,
            undefined
        ])('rechaza registro tradicional con proveedor %p', async provider => {

            LegalAuthService.authenticate
                .mockResolvedValue({
                    ...passwordIdentity,
                    provider
                });

            const response = await handler(
                event(registerPath, registerBody)
            );

            expectHttpError(
                response,
                403,
                'Método de registro no válido'
            );

            expect(
                LegalAuthLambdaService.execute
            ).not.toHaveBeenCalled();
        });


        test('prioriza la validación del proveedor sobre la coincidencia del correo', async () => {

            LegalAuthService.authenticate
                .mockResolvedValue({
                    ...googleIdentity,
                    email: 'another@example.com'
                });

            const response = await handler(
                event(registerPath, registerBody)
            );

            expectHttpError(
                response,
                403,
                'Método de registro no válido'
            );

            expect(
                LegalAuthLambdaService.execute
            ).not.toHaveBeenCalled();
        });


        describe.each([
            [
                'consulta de pendientes',
                pendingPath,
                pendingBody,
                pendingParams,
                pendingResponse
            ],
            [
                'registro de aceptaciones',
                acceptancePath,
                acceptanceBody,
                acceptanceParams,
                acceptanceResponse
            ]
        ])(
            '%s',
            (
                description,
                path,
                body,
                params,
                serviceResponse
            ) => {

                test.each([
                    ['password', passwordIdentity],
                    ['google.com', googleIdentity]
                ])('permite una identidad autenticada mediante %s', async (
                    provider,
                    identity
                ) => {

                    LegalAuthService.authenticate
                        .mockResolvedValue(identity);

                    await expectSuccessfulOperation(
                        event(path, body),
                        params,
                        serviceResponse
                    );
                });
            }
        );
    });


    /*
     * =====================================================
     * TRUSTED IDENTITY
     * =====================================================
     */

    describe('Propagación de identidad autenticada', () => {

        describe.each(operations)(
            'operación %s',
            (
                action,
                path,
                body,
                params,
                serviceResponse,
                expectedResponse
            ) => {

                test.each([
                    'A',
                    'AbCdEf123XyZ',
                    'Firebase_UID-123',
                    'A'.repeat(128)
                ])('conserva exactamente el Firebase UID %p', async uid => {

                    LegalAuthService.authenticate
                        .mockResolvedValue({
                            ...passwordIdentity,
                            uid
                        });

                    await expectSuccessfulOperation(
                        event(path, body),
                        {
                            ...params,
                            firebaseUid: uid
                        },
                        serviceResponse,
                        expectedResponse
                    );
                });


                test('no transmite el token ni los headers a la Lambda interna', async () => {

                    await expectSuccessfulOperation(
                        event(path, body),
                        params,
                        serviceResponse,
                        expectedResponse
                    );

                    const internalParams =
                        LegalAuthLambdaService.execute
                            .mock.calls[0][0];

                    expect(internalParams)
                        .not.toHaveProperty('idToken');

                    expect(internalParams)
                        .not.toHaveProperty('token');

                    expect(internalParams)
                        .not.toHaveProperty('headers');

                    expect(internalParams)
                        .not.toHaveProperty('authorization');

                    expect(internalParams)
                        .not.toHaveProperty('provider');

                    expect(
                        JSON.stringify(internalParams)
                    ).not.toContain(token);
                });


                test('no transmite propiedades adicionales de la identidad autenticada', async () => {

                    LegalAuthService.authenticate
                        .mockResolvedValue({
                            ...passwordIdentity,
                            idToken: token,
                            usuarioId: 99,
                            rol_id: 1,
                            email_verified: true,
                            customClaims: {
                                admin: true
                            }
                        });

                    await expectSuccessfulOperation(
                        event(path, body),
                        params,
                        serviceResponse,
                        expectedResponse
                    );
                });
            }
        );


        test('envía exclusivamente los parámetros necesarios para el registro tradicional', async () => {

            await expectSuccessfulOperation(
                event(registerPath, registerBody),
                registerParams,
                registerResponse,
                registerResponse.usuario
            );

            const params =
                LegalAuthLambdaService.execute
                    .mock.calls[0][0];

            expect(
                Object.keys(params).sort()
            ).toEqual([
                'action',
                'documentoLegalIds',
                'email',
                'firebaseUid',
                'nombre',
                'pais'
            ]);
        });


        test('envía exclusivamente action y Firebase UID durante la consulta', async () => {

            await expectSuccessfulOperation(
                event(pendingPath, {}),
                pendingParams,
                pendingResponse
            );

            const params =
                LegalAuthLambdaService.execute
                    .mock.calls[0][0];

            expect(
                Object.keys(params).sort()
            ).toEqual([
                'action',
                'firebaseUid'
            ]);
        });


        test('envía exclusivamente los parámetros necesarios para registrar aceptaciones', async () => {

            await expectSuccessfulOperation(
                event(acceptancePath, acceptanceBody),
                acceptanceParams,
                acceptanceResponse
            );

            const params =
                LegalAuthLambdaService.execute
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
     * TRADITIONAL REGISTRATION RESPONSE
     * =====================================================
     */

    describe('Contrato de respuesta del registro tradicional', () => {

        test.each([
            ['arreglo vacío', []],
            [
                'un usuario',
                [{ id: 25, email }]
            ],
            [
                'varios elementos',
                [{ id: 25 }, { id: 26 }]
            ]
        ])('conserva el arreglo usuario: %s', async (
            description,
            usuario
        ) => {

            await expectSuccessfulOperation(
                event(registerPath, registerBody),
                registerParams,
                {
                    success: true,
                    usuario
                },
                usuario
            );
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['objeto', { id: 25 }],
            ['cadena', 'usuario'],
            ['número', 25],
            ['booleano', true]
        ])('rechaza una propiedad usuario que no es un arreglo: %s', async (
            description,
            usuario
        ) => {

            LegalAuthLambdaService.execute
                .mockResolvedValue({
                    success: true,
                    usuario
                });

            const response = await handler(
                event(registerPath, registerBody)
            );

            expectHttpError(
                response,
                502,
                'Respuesta interna inválida'
            );
        });


        test('rechaza una respuesta sin propiedad usuario', async () => {

            LegalAuthLambdaService.execute
                .mockResolvedValue({
                    success: true
                });

            const response = await handler(
                event(registerPath, registerBody)
            );

            expectHttpError(
                response,
                502,
                'Respuesta interna inválida'
            );
        });


        test.each([
            [undefined],
            [null]
        ])('documenta HTTP 500 cuando la respuesta interna es %p', async serviceResponse => {

            LegalAuthLambdaService.execute
                .mockResolvedValue(serviceResponse);

            const response = await handler(
                event(registerPath, registerBody)
            );

            expectHttpError(
                response,
                500,
                'Error interno del servidor'
            );
        });


        test('no transmite las propiedades adicionales de la respuesta interna', async () => {

            await expectSuccessfulOperation(
                event(registerPath, registerBody),
                registerParams,
                {
                    ...registerResponse,
                    internalMetadata: {
                        operationId: 99
                    }
                },
                registerResponse.usuario
            );
        });
    });


    /*
     * =====================================================
     * LEGAL ACCEPTANCE RESPONSES
     * =====================================================
     */

    describe('Respuestas de consulta y registro de aceptaciones', () => {

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

            await expectSuccessfulOperation(
                event(pendingPath, {}),
                pendingParams,
                {
                    success: true,
                    documentosPendientes: documents
                }
            );
        });


        test.each([
            [[48]],
            [[48, 52]]
        ])('conserva la respuesta de aceptaciones %p', async documentIds => {

            await expectSuccessfulOperation(
                event(acceptancePath, {
                    documentoLegalIds: documentIds
                }),
                {
                    ...acceptanceParams,
                    documentoLegalIds: documentIds
                },
                {
                    success: true,
                    documentoLegalIds: documentIds
                }
            );
        });


        describe.each([
            [
                'consulta',
                pendingPath,
                pendingBody
            ],
            [
                'registro de aceptaciones',
                acceptancePath,
                acceptanceBody
            ]
        ])(
            '%s',
            (description, path, body) => {

                test.each([
                    ['null', null],
                    ['booleano true', true],
                    ['booleano false', false],
                    ['objeto vacío', {}],
                    ['arreglo vacío', []]
                ])('documenta la serialización de una respuesta resuelta de tipo %s', async (
                    responseDescription,
                    serviceResponse
                ) => {

                    LegalAuthLambdaService.execute
                        .mockResolvedValue(
                            serviceResponse
                        );

                    const response = await handler(
                        event(path, body)
                    );

                    expectHttpResponse(
                        response,
                        200,
                        serviceResponse
                    );
                });


                test('documenta una respuesta interna undefined', async () => {

                    LegalAuthLambdaService.execute
                        .mockResolvedValue(undefined);

                    const response = await handler(
                        event(path, body)
                    );

                    expect(response).toEqual({
                        statusCode: 200,
                        body: undefined
                    });
                });


                test('documenta una respuesta resuelta con success false', async () => {

                    const serviceResponse = {
                        success: false,
                        statusCode: 409,
                        message: 'Conflicto legal'
                    };

                    LegalAuthLambdaService.execute
                        .mockResolvedValue(
                            serviceResponse
                        );

                    const response = await handler(
                        event(path, body)
                    );

                    expectHttpResponse(
                        response,
                        200,
                        serviceResponse
                    );
                });
            }
        );
    });


    /*
     * =====================================================
     * CONTROLLED HTTP ERRORS
     * =====================================================
     */

    describe('Propagación de errores HTTP controlados', () => {

        const controlledErrors = [
            [400, 'Operación legal no válida'],
            [401, 'Identidad de usuario no válida'],
            [403, 'Operación no autorizada'],
            [404, 'Usuario no registrado'],
            [405, 'Método HTTP no permitido'],
            [409, 'Conflicto de documentos legales'],
            [502, 'Respuesta interna inválida'],
            [503, 'Servicio no disponible']
        ];


        describe.each(operations)(
            'operación %s',
            (action, path, body, params) => {

                test.each(controlledErrors)(
                    'conserva HTTP %i y su mensaje',
                    async (
                        statusCode,
                        message
                    ) => {

                        LegalAuthLambdaService.execute
                            .mockRejectedValue({
                                statusCode,
                                message
                            });

                        const response = await handler(
                            event(path, body)
                        );

                        expectHttpError(
                            response,
                            statusCode,
                            message
                        );

                        expect(
                            LegalAuthLambdaService.execute
                        ).toHaveBeenCalledWith(params);

                        expect(
                            LegalAuthLambdaService.execute
                        ).toHaveBeenCalledTimes(1);
                    }
                );


                test('no reintenta automáticamente una operación fallida', async () => {

                    LegalAuthLambdaService.execute
                        .mockRejectedValue({
                            statusCode: 503,
                            message: 'Servicio no disponible'
                        });

                    await handler(event(path, body));

                    expect(
                        LegalAuthLambdaService.execute
                    ).toHaveBeenCalledTimes(1);
                });
            }
        );


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['booleano false', false],
            ['cero', 0]
        ])('utiliza mensaje genérico cuando message es %s', async (
            description,
            message
        ) => {

            LegalAuthLambdaService.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message
                });

            const response = await handler(
                event(acceptancePath, acceptanceBody)
            );

            expectHttpError(
                response,
                409,
                'No fue posible completar la operación'
            );
        });


        test.each([
            ['espacios', '   '],
            ['número', 123],
            ['booleano true', true],
            ['objeto', { detail: 'Simulated detail' }],
            ['arreglo', ['Simulated detail']]
        ])('documenta la propagación de un mensaje truthy de tipo %s', async (
            description,
            message
        ) => {

            LegalAuthLambdaService.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message
                });

            const response = await handler(
                event(acceptancePath, acceptanceBody)
            );

            expectHttpError(
                response,
                409,
                message
            );
        });


        test('no transmite propiedades adicionales de un error controlado', async () => {

            LegalAuthLambdaService.execute
                .mockRejectedValue({
                    statusCode: 409,
                    message: 'Conflicto legal',
                    code: '23505',
                    detail: 'Sensitive database detail',
                    stack: 'Sensitive stack trace',
                    query: 'SELECT sensitive_data',
                    idToken: token
                });

            const response = await handler(
                event(registerPath, registerBody)
            );

            expectHttpError(
                response,
                409,
                'Conflicto legal'
            );
        });
    });


    /*
     * =====================================================
     * UNEXPECTED ERRORS
     * =====================================================
     */

    describe('Protección frente a errores internos', () => {

        test.each([
            ['200', 200],
            ['201', 201],
            ['302', 302],
            ['422', 422],
            ['429', 429],
            ['500', 500],
            ['501', 501],
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
            ['cadena 405', '405'],
            ['cadena 409', '409'],
            ['cadena 500', '500'],
            ['cadena 502', '502'],
            ['cadena 503', '503'],
            ['undefined', undefined],
            ['null', null],
            ['booleano', true],
            ['objeto', {}]
        ])('normaliza a HTTP 500 el código %s', async (
            description,
            statusCode
        ) => {

            LegalAuthLambdaService.execute
                .mockRejectedValue({
                    statusCode,
                    message: 'Sensitive internal error'
                });

            const response = await handler(
                event(pendingPath, {})
            );

            expectHttpError(
                response,
                500,
                'Error interno del servidor'
            );
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

            LegalAuthLambdaService.execute
                .mockRejectedValue(error);

            const response = await handler(
                event(registerPath, registerBody)
            );

            expectHttpError(
                response,
                500,
                'Error interno del servidor'
            );
        });


        test('controla una excepción síncrona de autenticación', async () => {

            LegalAuthService.authenticate
                .mockImplementation(() => {

                    throw new Error(
                        'Sensitive Firebase error'
                    );
                });

            const response = await handler(
                event(pendingPath, {})
            );

            expectHttpError(
                response,
                500,
                'Error interno del servidor'
            );

            expect(
                LegalAuthLambdaService.execute
            ).not.toHaveBeenCalled();
        });


        test('controla una excepción síncrona de la Lambda interna', async () => {

            LegalAuthLambdaService.execute
                .mockImplementation(() => {

                    throw new Error(
                        'Sensitive internal error'
                    );
                });

            const response = await handler(
                event(acceptancePath, acceptanceBody)
            );

            expectHttpError(
                response,
                500,
                'Error interno del servidor'
            );
        });


        test('controla un error de serialización circular', async () => {

            const serviceResponse = {
                success: true
            };

            serviceResponse.circular =
                serviceResponse;

            LegalAuthLambdaService.execute
                .mockResolvedValue(serviceResponse);

            const response = await handler(
                event(pendingPath, {})
            );

            expectHttpError(
                response,
                500,
                'Error interno del servidor'
            );
        });


        test('controla un error de serialización BigInt', async () => {

            LegalAuthLambdaService.execute
                .mockResolvedValue({
                    success: true,
                    usuarioId: BigInt(25)
                });

            const response = await handler(
                event(acceptancePath, acceptanceBody)
            );

            expectHttpError(
                response,
                500,
                'Error interno del servidor'
            );
        });
    });


    /*
     * =====================================================
     * IMMUTABILITY
     * =====================================================
     */

    describe('Inmutabilidad de solicitudes y respuestas', () => {

        test('no modifica el body original durante el registro tradicional', async () => {

            const body = Object.freeze({
                ...registerBody,
                email: '  USER@EXAMPLE.COM  ',
                nombre: '  Ana   López  ',
                pais: '  per  ',
                documentoLegalIds: Object.freeze([
                    ...documentoLegalIds
                ])
            });

            await expectSuccessfulOperation(
                event(registerPath, registerBody, {
                    body
                }),
                registerParams,
                registerResponse,
                registerResponse.usuario
            );

            expect(body).toEqual({
                ...registerBody,
                email: '  USER@EXAMPLE.COM  ',
                nombre: '  Ana   López  ',
                pais: '  per  '
            });
        });


        test('no modifica el arreglo original de documentos aceptados', async () => {

            const originalIds =
                Object.freeze([52, 48]);

            const body = Object.freeze({
                documentoLegalIds: originalIds
            });

            await expectSuccessfulOperation(
                event(acceptancePath, acceptanceBody, {
                    body
                }),
                {
                    ...acceptanceParams,
                    documentoLegalIds: [52, 48]
                },
                acceptanceResponse
            );

            expect(originalIds)
                .toEqual([52, 48]);

            expect(
                LegalAuthLambdaService.execute
                    .mock.calls[0][0]
                    .documentoLegalIds
            ).not.toBe(originalIds);
        });


        test('no modifica los headers originales', async () => {

            const requestHeaders = Object.freeze({
                ...headers
            });

            await expectSuccessfulOperation(
                event(pendingPath, {}, {
                    headers: requestHeaders
                }),
                pendingParams,
                pendingResponse
            );

            expect(requestHeaders)
                .toEqual(headers);
        });


        test('no modifica la identidad autenticada', async () => {

            const identity = Object.freeze({
                ...passwordIdentity
            });

            LegalAuthService.authenticate
                .mockResolvedValue(identity);

            await expectSuccessfulOperation(
                event(registerPath, registerBody),
                registerParams,
                registerResponse,
                registerResponse.usuario
            );

            expect(identity)
                .toEqual(passwordIdentity);
        });


        test.each(operations)(
            'no modifica la respuesta interna durante %s',
            async (
                action,
                path,
                body,
                params,
                serviceResponse,
                expectedResponse
            ) => {

                const immutableResponse =
                    Object.freeze({
                        ...serviceResponse
                    });

                await expectSuccessfulOperation(
                    event(path, body),
                    params,
                    immutableResponse,
                    expectedResponse
                );

                expect(immutableResponse)
                    .toEqual(serviceResponse);
            }
        );
    });


    /*
     * =====================================================
     * SAFE LOGGING
     * =====================================================
     */

    describe('Registro seguro de operaciones', () => {

        test.each(operations)(
            'registra únicamente la ruta normalizada durante %s',
            async (
                action,
                path,
                body,
                params,
                serviceResponse
            ) => {

                LegalAuthLambdaService.execute
                    .mockResolvedValue(serviceResponse);

                await handler(event(path, body));

                expect(logSpy)
                    .toHaveBeenCalledTimes(2);

                expect(logSpy)
                    .toHaveBeenNthCalledWith(
                        1,
                        '[LegalAuthHandler] Iniciando operación',
                        { path }
                    );

                expect(logSpy)
                    .toHaveBeenNthCalledWith(
                        2,
                        '[LegalAuthHandler] Operación completada',
                        { path }
                    );

                expect(errorSpy)
                    .not.toHaveBeenCalled();
            }
        );


        test.each(operations)(
            'no registra información sensible durante %s',
            async (
                action,
                path,
                body,
                params,
                serviceResponse
            ) => {

                LegalAuthLambdaService.execute
                    .mockResolvedValue(serviceResponse);

                await handler(event(path, body));

                const logs = JSON.stringify(
                    logSpy.mock.calls
                );

                expect(logs)
                    .not.toContain(token);

                expect(logs)
                    .not.toContain(firebaseUid);

                expect(logs)
                    .not.toContain(email);

                expect(logs)
                    .not.toContain(registerBody.nombre);

                expect(logs)
                    .not.toContain('documentoLegalIds');
            }
        );


        test('no registra el contenido de una solicitud JSON inválida', async () => {

            await expectInvalidEvent(
                event(registerPath, registerBody, {
                    body:
                        `{"idToken":"${token}"`
                }),
                'JSON inválido'
            );

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuthHandler] Error',
                    {
                        statusCode: 400,
                        code: undefined
                    }
                );

            expect(
                JSON.stringify(errorSpy.mock.calls)
            ).not.toContain(token);
        });


        test('registra únicamente statusCode y code de un error Firebase', async () => {

            LegalAuthService.authenticate
                .mockRejectedValue({
                    statusCode: 401,
                    code: 'auth/id-token-expired',
                    message: 'Token inválido',
                    idToken: token
                });

            await handler(
                event(pendingPath, {})
            );

            expect(errorSpy)
                .toHaveBeenCalledTimes(1);

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuthHandler] Error',
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

            LegalAuthLambdaService.execute
                .mockRejectedValue(error);

            await handler(
                event(registerPath, registerBody)
            );

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuthHandler] Error',
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


        test.each(operations)(
            'no registra una operación completada cuando falla %s',
            async (action, path, body) => {

                LegalAuthLambdaService.execute
                    .mockRejectedValue({
                        statusCode: 503,
                        message: 'Servicio no disponible'
                    });

                await handler(event(path, body));

                expect(logSpy)
                    .toHaveBeenCalledTimes(1);

                expect(logSpy)
                    .toHaveBeenCalledWith(
                        '[LegalAuthHandler] Iniciando operación',
                        { path }
                    );

                expect(logSpy)
                    .not.toHaveBeenCalledWith(
                        '[LegalAuthHandler] Operación completada',
                        { path }
                    );

                expect(errorSpy)
                    .toHaveBeenCalledTimes(1);
            }
        );


        test('no registra una operación iniciada para una ruta desconocida', async () => {

            await handler(
                event('/unknown', {})
            );

            expect(logSpy)
                .not.toHaveBeenCalled();

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuthHandler] Error',
                    {
                        statusCode: 404,
                        code: undefined
                    }
                );
        });


        test('no registra una operación iniciada para un método no permitido', async () => {

            await handler(
                event(pendingPath, {}, {
                    httpMethod: 'GET'
                })
            );

            expect(logSpy)
                .not.toHaveBeenCalled();

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuthHandler] Error',
                    {
                        statusCode: 405,
                        code: undefined
                    }
                );
        });


        test('registra el código original antes de normalizarlo', async () => {

            LegalAuthLambdaService.execute
                .mockRejectedValue({
                    statusCode: '409',
                    code: 'LEGAL_CONFLICT',
                    message: 'Conflicto legal'
                });

            const response = await handler(
                event(acceptancePath, acceptanceBody)
            );

            expectHttpError(
                response,
                500,
                'Error interno del servidor'
            );

            expect(errorSpy)
                .toHaveBeenCalledWith(
                    '[LegalAuthHandler] Error',
                    {
                        statusCode: '409',
                        code: 'LEGAL_CONFLICT'
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

        test('espera la autenticación antes de invocar la Lambda interna', async () => {

            let resolveAuthentication;

            LegalAuthService.authenticate
                .mockImplementation(
                    () => new Promise(resolve => {

                        resolveAuthentication = resolve;
                    })
                );

            LegalAuthLambdaService.execute
                .mockResolvedValue(pendingResponse);

            const operation = handler(
                event(pendingPath, {})
            );

            expect(
                LegalAuthService.authenticate
            ).toHaveBeenCalledTimes(1);

            expect(
                LegalAuthLambdaService.execute
            ).not.toHaveBeenCalled();

            resolveAuthentication(passwordIdentity);

            const response = await operation;

            expectHttpResponse(
                response,
                200,
                pendingResponse
            );

            expect(
                LegalAuthLambdaService.execute
            ).toHaveBeenCalledWith(pendingParams);
        });


        test('espera la respuesta interna antes de completar la solicitud HTTP', async () => {

            let resolveDatabase;

            let notifyInvocation;

            const invocationStarted =
                new Promise(resolve => {

                    notifyInvocation = resolve;
                });

            LegalAuthLambdaService.execute
                .mockImplementation(
                    () => new Promise(resolve => {

                        resolveDatabase = resolve;

                        notifyInvocation();
                    })
                );

            let completed = false;

            const operation = handler(
                event(pendingPath, {})
            ).then(response => {

                completed = true;

                return response;
            });

            await invocationStarted;

            expect(completed)
                .toBe(false);

            expect(logSpy)
                .toHaveBeenCalledTimes(1);

            resolveDatabase(pendingResponse);

            const response = await operation;

            expectHttpResponse(
                response,
                200,
                pendingResponse
            );

            expect(completed)
                .toBe(true);

            expect(logSpy)
                .toHaveBeenCalledTimes(2);
        });


        test('controla un rechazo asíncrono de autenticación', async () => {

            let rejectAuthentication;

            LegalAuthService.authenticate
                .mockImplementation(
                    () => new Promise(
                        (resolve, reject) => {

                            rejectAuthentication = reject;
                        }
                    )
                );

            const operation = handler(
                event(registerPath, registerBody)
            );

            rejectAuthentication({
                statusCode: 401,
                message: 'Token de Firebase inválido o expirado'
            });

            const response = await operation;

            expectHttpError(
                response,
                401,
                'Token de Firebase inválido o expirado'
            );

            expect(
                LegalAuthLambdaService.execute
            ).not.toHaveBeenCalled();
        });


        test('controla un rechazo asíncrono de la Lambda interna', async () => {

            let rejectDatabase;

            let notifyInvocation;

            const invocationStarted =
                new Promise(resolve => {

                    notifyInvocation = resolve;
                });

            LegalAuthLambdaService.execute
                .mockImplementation(
                    () => new Promise(
                        (resolve, reject) => {

                            rejectDatabase = reject;

                            notifyInvocation();
                        }
                    )
                );

            const operation = handler(
                event(acceptancePath, acceptanceBody)
            );

            await invocationStarted;

            rejectDatabase({
                statusCode: 503,
                message: 'Servicio no disponible'
            });

            const response = await operation;

            expectHttpError(
                response,
                503,
                'Servicio no disponible'
            );
        });


        test('mantiene independientes las identidades de solicitudes concurrentes', async () => {

            const firstIdentity = {
                ...passwordIdentity,
                uid: 'FirstFirebaseUID'
            };

            const secondIdentity = {
                ...googleIdentity,
                uid: 'SecondFirebaseUID'
            };

            const firstHeaders = {
                Authorization: 'Bearer first-token'
            };

            const secondHeaders = {
                Authorization: 'Bearer second-token'
            };

            LegalAuthService.authenticate
                .mockImplementation(
                    async requestHeaders => {

                        return requestHeaders === firstHeaders
                            ? firstIdentity
                            : secondIdentity;
                    }
                );

            LegalAuthLambdaService.execute
                .mockImplementation(
                    async params => ({
                        success: true,
                        firebaseUid: params.firebaseUid
                    })
                );

            const [
                firstResponse,
                secondResponse
            ] = await Promise.all([
                handler(
                    event(pendingPath, {}, {
                        headers: firstHeaders
                    })
                ),
                handler(
                    event(acceptancePath, acceptanceBody, {
                        headers: secondHeaders
                    })
                )
            ]);

            expectHttpResponse(
                firstResponse,
                200,
                {
                    success: true,
                    firebaseUid: firstIdentity.uid
                }
            );

            expectHttpResponse(
                secondResponse,
                200,
                {
                    success: true,
                    firebaseUid: secondIdentity.uid
                }
            );

            expect(
                LegalAuthLambdaService.execute
            ).toHaveBeenCalledWith({
                action: 'get-pending-acceptances',
                firebaseUid: firstIdentity.uid
            });

            expect(
                LegalAuthLambdaService.execute
            ).toHaveBeenCalledWith({
                action: 'register-acceptances',
                firebaseUid: secondIdentity.uid,
                documentoLegalIds
            });

            expect(
                LegalAuthLambdaService.execute
            ).toHaveBeenCalledTimes(2);
        });


        test('una solicitud inválida no interfiere con otra solicitud válida concurrente', async () => {

            LegalAuthLambdaService.execute
                .mockResolvedValue(pendingResponse);

            const [
                validResponse,
                invalidResponse
            ] = await Promise.all([
                handler(
                    event(pendingPath, {})
                ),
                handler(
                    event(registerPath, {
                        ...registerBody,
                        documentoLegalIds: []
                    })
                )
            ]);

            expectHttpResponse(
                validResponse,
                200,
                pendingResponse
            );

            expectHttpError(
                invalidResponse,
                400,
                'Debe aceptar los dos documentos legales obligatorios'
            );

            expect(
                LegalAuthService.authenticate
            ).toHaveBeenCalledTimes(1);

            expect(
                LegalAuthLambdaService.execute
            ).toHaveBeenCalledTimes(1);
        });
    });
});
// Authenticated profile: GET has a distinct method and response contract.
describe('Consulta autenticada del perfil', () => {
    const profilePath = '/consultar-usuario';
    const usuario = [{ usuario_id: 25, primer_nombre: 'Ana', email, avatar_id: 1 }];
    const request = (overrides = {}) => event(profilePath, undefined, {
        httpMethod: 'GET', ...overrides
    });

    test.each([passwordIdentity, googleIdentity])('consulta el perfil con proveedor $provider', async identity => {
        LegalAuthService.authenticate.mockResolvedValue(identity);
        LegalAuthLambdaService.execute.mockResolvedValue({ success: true, usuario });
        const response = await handler(request());
        expect(response).toEqual({
            statusCode: 200,
            body: JSON.stringify(usuario),
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
        expect(LegalAuthService.authenticate).toHaveBeenCalledTimes(1);
        expect(LegalAuthService.authenticate).toHaveBeenCalledWith(headers);
        expect(LegalAuthLambdaService.execute).toHaveBeenCalledTimes(1);
        expect(LegalAuthLambdaService.execute).toHaveBeenCalledWith({
            action: 'get-user-profile', firebaseUid: identity.uid
        });
        expect(LegalAuthService.authenticate.mock.invocationCallOrder[0])
            .toBeLessThan(LegalAuthLambdaService.execute.mock.invocationCallOrder[0]);
    });

    test.each(['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])('rechaza %s', async httpMethod => {
        expectHttpError(await handler(request({ httpMethod })), 405, 'Método HTTP no permitido');
        expect(LegalAuthService.authenticate).not.toHaveBeenCalled();
        expect(LegalAuthLambdaService.execute).not.toHaveBeenCalled();
    });

    test.each([
        { queryStringParameters: { email: 'other@example.com' } },
        { multiValueQueryStringParameters: { firebaseUid: ['other'] } },
        { rawQueryString: 'usuario_id=99' }
    ])('rechaza parámetros adicionales %p', async overrides => {
        await expectInvalidEvent(request(overrides), 'La consulta no admite parámetros');
    });

    test.each(['{}', '{"firebaseUid":"other"}', 'invalid'])('rechaza body %s', async body => {
        await expectInvalidEvent(request({ body }), 'La consulta no admite cuerpo de solicitud');
    });

    test.each([401, 403, 503])('propaga error de autenticación %i', async statusCode => {
        LegalAuthService.authenticate.mockRejectedValue({ statusCode, message: 'Error de autenticación' });
        expectHttpError(await handler(request()), statusCode, 'Error de autenticación');
        expect(LegalAuthLambdaService.execute).not.toHaveBeenCalled();
    });

    test.each([undefined, null, {}, { usuario: [] }, { usuario: [null] },
        { usuario: ['invalid'] }, { usuario: [usuario[0], usuario[0]] }])('rechaza respuesta interna inválida %p', async result => {
        LegalAuthLambdaService.execute.mockResolvedValue(result);
        expectHttpError(await handler(request()), 502, 'Respuesta interna inválida');
    });

    test.each([404, 502, 503])('propaga error interno controlado %i', async statusCode => {
        LegalAuthLambdaService.execute.mockRejectedValue({ statusCode, message: 'Error controlado' });
        expectHttpError(await handler(request()), statusCode, 'Error controlado');
    });

    test('oculta errores inesperados', async () => {
        LegalAuthLambdaService.execute.mockRejectedValue(new Error('private database detail'));
        expectHttpError(await handler(request()), 500, 'Error interno del servidor');
    });

    test('admite API Gateway v2', async () => {
        LegalAuthLambdaService.execute.mockResolvedValue({ success: true, usuario });
        const response = await handler({ rawPath: '/dev/cupcakeslife/usuarios/consultar-usuario',
            requestContext: { stage: 'dev', http: { method: 'GET' } }, headers });
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual(usuario);
    });
});
