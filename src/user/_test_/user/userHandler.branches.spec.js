// src/user/_test_/user/userHandler.branches.spec.js

jest.mock('@user/schema/user', () => ({

    validateCreateUserMedalLeage: jest.fn(),

    validatePatchUserMedalLeage: jest.fn(),

    validateCreateUserPackage: jest.fn(),

    validateUpdateUser: jest.fn(),

    validateGetUserPreferences: jest.fn(),

    validateUpdateUserPreferences: jest.fn(),

    validateSendPasswordResetEmail: jest.fn()
}));


jest.mock('@user/controller/user', () => ({

    createOneUserMedalLeage: jest.fn(),

    patchOneUserMedalLeage: jest.fn(),

    createOneUserPackage: jest.fn(),

    updateOneUser: jest.fn(),

    getUserPreferences: jest.fn(),

    updateUserPreferences: jest.fn(),

    getActiveLegalDocuments: jest.fn(),

    sendPasswordResetEmail: jest.fn(),

    createOneUser: jest.fn(),

    googleAuthUser: jest.fn(),

    getPendingLegalAcceptances: jest.fn(),

    registerLegalAcceptances: jest.fn()
}));


const schema = require('@user/schema/user');

const Ctrl = require('@user/controller/user');

const { handler } = require('../../handlers/user');


const ORIG_ENV = { ...process.env };

const email = 'user@example.com';


const operations = [
    {
        method: 'POST',
        path: '/insertar-usuario-medalla',
        controller: 'createOneUserMedalLeage',
        validator: 'validateCreateUserMedalLeage',
        body: {
            email,
            medalla: 'oro'
        },
        response: [{ ok: 1 }]
    },
    {
        method: 'PATCH',
        path: '/actualizar-usuario-medalla',
        controller: 'patchOneUserMedalLeage',
        validator: 'validatePatchUserMedalLeage',
        body: {
            email,
            cupcake: 1,
            estado: true,
            valor: 5
        },
        response: [{ ok: 2 }]
    },
    {
        method: 'POST',
        path: '/insertar-usuario-paquete',
        controller: 'createOneUserPackage',
        validator: 'validateCreateUserPackage',
        body: {
            email,
            paquete: 9
        },
        response: [{ ok: 3 }]
    },
    {
        method: 'PATCH',
        path: '/actualizar-usuario',
        controller: 'updateOneUser',
        validator: 'validateUpdateUser',
        body: {
            email,
            nombre: 'Ana López',
            avatarId: 2
        },
        response: [{ ok: 4 }]
    },
    {
        method: 'POST',
        path: '/obtener-preferencias',
        controller: 'getUserPreferences',
        validator: 'validateGetUserPreferences',
        body: {
            email
        },
        response: {
            recordatorios: true,
            mensajes: true,
            promociones: false
        }
    },
    {
        method: 'PATCH',
        path: '/actualizar-preferencias',
        controller: 'updateUserPreferences',
        validator: 'validateUpdateUserPreferences',
        body: {
            email,
            recordatorios: true,
            mensajes: false,
            promociones: false,
            musica: true,
            efectos_sonido: true,
            vibracion: false,
            tema: 'dark'
        },
        response: {
            success: true
        }
    },
    {
        method: 'GET',
        path: '/documentos-legales-vigentes',
        controller: 'getActiveLegalDocuments',
        validator: null,
        body: undefined,
        response: [
            { id: 12 },
            { id: 35 }
        ]
    },
    {
        method: 'POST',
        path: '/recuperar-contrasena',
        controller: 'sendPasswordResetEmail',
        validator: 'validateSendPasswordResetEmail',
        body: {
            email
        },
        response: {
            message: 'Password reset email sent.'
        }
    }
];


const validatedOperations = operations.filter(
    operation => operation.validator !== null
);


const removedControllers = [
    'createOneUser',
    'googleAuthUser',
    'getPendingLegalAcceptances',
    'registerLegalAcceptances'
];


const ev = (options = {}) => {

    const {
        p = '/',
        body,
        env = {},
        http,
        ...overrides
    } = options;

    Object.assign(process.env, env);

    const method = Object.prototype.hasOwnProperty.call(
        options,
        'method'
    )
        ? options.method
        : 'POST';

    const event = {
        path: p,
        rawPath: p,
        queryStringParameters: {},
        requestContext: {}
    };

    if (method !== undefined) {

        event.httpMethod = method;
    }

    if (http?.stage) {

        event.requestContext.stage = http.stage;
    }

    if (http?.method !== undefined) {

        event.requestContext.http = {
            method: http.method
        };
    }

    if (body !== undefined) {

        event.body = typeof body === 'string'
            ? body
            : JSON.stringify(body);
    }

    delete overrides.method;

    return {
        ...event,
        ...overrides
    };
};


const operationEvent = (
    operation,
    overrides = {}
) => ev({
    p: operation.path,
    method: operation.method,
    body: operation.body,
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


const expectNoControllerCalls = () => {

    Object.values(Ctrl).forEach(controller => {

        expect(controller)
            .not.toHaveBeenCalled();
    });
};


const expectNoValidatorCalls = () => {

    Object.values(schema).forEach(validator => {

        expect(validator)
            .not.toHaveBeenCalled();
    });
};


/*
 * Documenta el comportamiento productivo actual.
 *
 * El handler construye una respuesta 404 y después
 * withHandler vuelve a encapsularla como HTTP 200.
 *
 * Este helper deberá actualizarse cuando se autorice
 * la corrección del código productivo.
 */
const expectCurrentNotFound = (
    response,
    pathTried
) => {

    expectHttpResponse(
        response,
        200,
        {
            statusCode: 404,
            body: JSON.stringify({
                message: 'Not Found',
                pathTried
            })
        }
    );

    expectNoControllerCalls();

    expectNoValidatorCalls();
};


let errorSpy;


beforeEach(() => {

    process.env = {
        ...ORIG_ENV,
        USER_MODULE: 'usuarios'
    };

    delete process.env.ENDPOINT_ROOT;

    jest.resetAllMocks();

    operations.forEach(operation => {

        Ctrl[operation.controller]
            .mockResolvedValue(
                operation.response
            );

        if (operation.validator) {

            schema[operation.validator]
                .mockImplementation(data => ({
                    success: true,
                    data
                }));
        }
    });

    errorSpy = jest.spyOn(console, 'error')
        .mockImplementation(() => {});
});


afterEach(() => {

    process.env = { ...ORIG_ENV };

    jest.restoreAllMocks();
});


describe('user.handler branches', () => {

    /*
     * =====================================================
     * ORIGINAL TESTS - PRESERVED AND ADAPTED
     * =====================================================
     */

    describe('Casos originales readaptados', () => {

        test('sin stage, trailing slash', async () => {

            const body = {
                email: 'a@a.com',
                medalla: 'oro'
            };

            const res = await handler(
                ev({
                    p: '/insertar-usuario-medalla/',
                    method: 'POST',
                    body
                })
            );

            expect(res.statusCode)
                .toBe(200);

            expect(JSON.parse(res.body))
                .toEqual([{ ok: 1 }]);

            expect(
                Ctrl.createOneUserMedalLeage
            ).toHaveBeenCalledWith(body);
        });


        test('methodOf via httpMethod', async () => {

            const body = {
                email: 'a@a.com',
                cupcake: 1,
                estado: true,
                valor: 5
            };

            const res = await handler(
                ev({
                    p: '/actualizar-usuario-medalla',
                    method: 'PATCH',
                    body
                })
            );

            expect(res.statusCode)
                .toBe(200);

            expect(JSON.parse(res.body))
                .toEqual([{ ok: 2 }]);

            expect(
                Ctrl.patchOneUserMedalLeage
            ).toHaveBeenCalledWith(body);
        });


        test('methodOf via requestContext.http.method', async () => {

            const body = {
                email: 'a@a.com',
                paquete: 9
            };

            const event = ev({
                p: '/insertar-usuario-paquete',
                method: undefined,
                http: {
                    method: 'POST'
                },
                body
            });

            expect(event)
                .not.toHaveProperty('httpMethod');

            expect(event.requestContext.http.method)
                .toBe('POST');

            const res = await handler(event);

            expect(res.statusCode)
                .toBe(200);

            expect(JSON.parse(res.body))
                .toEqual([{ ok: 3 }]);

            expect(
                Ctrl.createOneUserPackage
            ).toHaveBeenCalledWith(body);
        });


        test('err con statusCode propio → 418', async () => {

            Ctrl.createOneUserPackage
                .mockRejectedValueOnce({
                    statusCode: 418,
                    message: 'teapot'
                });

            const res = await handler(
                ev({
                    p: '/insertar-usuario-paquete',
                    method: 'POST',
                    body: {
                        email: 'x@x.com',
                        paquete: 1
                    }
                })
            );

            expect(res.statusCode)
                .toBe(418);

            expect(JSON.parse(res.body).message)
                .toBe('teapot');
        });


        test('JSON inválido → 400', async () => {

            const res = await handler(
                ev({
                    p: '/insertar-usuario-paquete',
                    method: 'POST',
                    body: '{bad json'
                })
            );

            expect(res.statusCode)
                .toBe(400);

            expect(JSON.parse(res.body).message)
                .toBe('JSON inválido');

            expect(
                schema.validateCreateUserPackage
            ).not.toHaveBeenCalled();

            expectNoControllerCalls();
        });


        test('validación email requerido → 400', async () => {

            /*
             * La prueba original utilizaba
             * /insertar-usuario-nuevo.
             *
             * Se conserva el objetivo de cobertura
             * mediante un endpoint vigente.
             */

            schema.validateCreateUserPackage
                .mockReturnValueOnce({
                    success: false,
                    error: {
                        issues: [
                            {
                                code: 'invalid_type',
                                received: 'undefined',
                                path: ['email']
                            }
                        ]
                    }
                });

            const res = await handler(
                ev({
                    p: '/insertar-usuario-paquete',
                    method: 'POST',
                    body: {}
                })
            );

            expect(res.statusCode)
                .toBe(400);

            expect(JSON.parse(res.body).message)
                .toBe('User email is required.');

            expectNoControllerCalls();
        });


        test('validación otro field requerido → 400', async () => {

            schema.validatePatchUserMedalLeage
                .mockReturnValueOnce({
                    success: false,
                    error: {
                        issues: [
                            {
                                code: 'invalid_type',
                                received: 'undefined',
                                path: ['valor']
                            }
                        ]
                    }
                });

            const res = await handler(
                ev({
                    p: '/actualizar-usuario-medalla',
                    method: 'PATCH',
                    body: {}
                })
            );

            expect(res.statusCode)
                .toBe(400);

            expect(JSON.parse(res.body).message)
                .toBe('Field is required.');

            expectNoControllerCalls();
        });


        test('env con slash y path sin slash inicial → 200', async () => {

            Ctrl.createOneUserPackage
                .mockResolvedValueOnce([
                    { ok: 5 }
                ]);

            const res = await handler(
                ev({
                    p: '/usuarios/insertar-usuario-paquete',
                    method: 'POST',
                    body: {
                        email: 'b@b.com',
                        paquete: 9
                    },
                    env: {
                        ENDPOINT_ROOT: '/cupcakeslife',
                        USER_MODULE: '/usuarios'
                    }
                })
            );

            expect(res.statusCode)
                .toBe(200);

            expect(JSON.parse(res.body))
                .toEqual([{ ok: 5 }]);
        });
    });


    /*
     * =====================================================
     * CURRENT ROUTES
     * =====================================================
     */

    describe('Enrutamiento de operaciones vigentes', () => {

        describe.each(operations)(
            '$method $path',
            operation => {

                test('invoca exclusivamente el controlador correspondiente', async () => {

                    const response = await handler(
                        operationEvent(operation)
                    );

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );

                    expect(
                        Ctrl[operation.controller]
                    ).toHaveBeenCalledTimes(1);

                    if (operation.validator) {

                        expect(
                            Ctrl[operation.controller]
                        ).toHaveBeenCalledWith(
                            operation.body
                        );

                    } else {

                        expect(
                            Ctrl[operation.controller]
                        ).toHaveBeenCalledWith();
                    }

                    Object.keys(Ctrl)
                        .filter(
                            name =>
                                name !== operation.controller
                        )
                        .forEach(name => {

                            expect(Ctrl[name])
                                .not.toHaveBeenCalled();
                        });
                });


                test('utiliza exclusivamente el validador correspondiente', async () => {

                    await handler(
                        operationEvent(operation)
                    );

                    Object.keys(schema)
                        .forEach(name => {

                            if (
                                name === operation.validator
                            ) {

                                expect(schema[name])
                                    .toHaveBeenCalledTimes(1);

                                expect(schema[name])
                                    .toHaveBeenCalledWith(
                                        operation.body
                                    );

                            } else {

                                expect(schema[name])
                                    .not.toHaveBeenCalled();
                            }
                        });
                });


                test('no invoca controladores trasladados a otras Lambdas', async () => {

                    await handler(
                        operationEvent(operation)
                    );

                    removedControllers.forEach(name => {

                        expect(Ctrl[name])
                            .not.toHaveBeenCalled();
                    });
                });
            }
        );
    });


    /*
     * =====================================================
     * HTTP METHOD BRANCHES
     * =====================================================
     */

    describe('Obtención del método HTTP', () => {

        describe.each(operations)(
            '$method $path',
            operation => {

                test('acepta el método HTTP en minúsculas', async () => {

                    const response = await handler(
                        operationEvent(operation, {
                            method:
                                operation.method.toLowerCase()
                        })
                    );

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );
                });


                test('acepta el método HTTP con capitalización mixta', async () => {

                    const method =
                        operation.method.charAt(0) +
                        operation.method.slice(1)
                            .toLowerCase();

                    const response = await handler(
                        operationEvent(operation, {
                            method
                        })
                    );

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );
                });


                test('obtiene el método desde API Gateway HTTP API v2', async () => {

                    const event = operationEvent(
                        operation,
                        {
                            method: undefined,
                            http: {
                                method: operation.method
                            }
                        }
                    );

                    expect(event)
                        .not.toHaveProperty('httpMethod');

                    const response =
                        await handler(event);

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );
                });


                test('prioriza httpMethod sobre requestContext.http.method', async () => {

                    const response = await handler(
                        operationEvent(operation, {
                            http: {
                                method: 'DELETE'
                            }
                        })
                    );

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );
                });
            }
        );


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['false', false],
            ['cero', 0]
        ])('utiliza GET por defecto cuando httpMethod es %s', async (
            description,
            method
        ) => {

            const response = await handler(
                ev({
                    p: '/documentos-legales-vigentes',
                    method
                })
            );

            expectHttpResponse(
                response,
                200,
                operations[6].response
            );

            expect(
                Ctrl.getActiveLegalDocuments
            ).toHaveBeenCalledWith();
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', '']
        ])('utiliza requestContext.http.method cuando httpMethod es %s', async (
            description,
            method
        ) => {

            const response = await handler(
                ev({
                    p: '/obtener-preferencias',
                    method,
                    http: {
                        method: 'POST'
                    },
                    body: { email }
                })
            );

            expectHttpResponse(
                response,
                200,
                operations[4].response
            );
        });


        test.each([
            ['número', 123],
            ['booleano true', true],
            ['objeto', {}],
            ['arreglo', ['POST']]
        ])('controla un método HTTP no string: %s', async (
            description,
            method
        ) => {

            const response = await handler(
                ev({
                    p: '/obtener-preferencias',
                    method,
                    body: { email }
                })
            );

            expect(response.statusCode)
                .toBe(500);

            expect(
                JSON.parse(response.body).message
            ).toEqual(expect.any(String));

            expectNoControllerCalls();

            expectNoValidatorCalls();
        });


        test('no elimina espacios exteriores del método HTTP', async () => {

            const response = await handler(
                ev({
                    p: '/obtener-preferencias',
                    method: ' POST ',
                    body: { email }
                })
            );

            expectCurrentNotFound(
                response,
                ' POST  /obtener-preferencias'
            );
        });
    });


    /*
     * =====================================================
     * PATH NORMALIZATION
     * =====================================================
     */

    describe('Normalización de rutas', () => {

        describe.each(operations)(
            '$method $path',
            operation => {

                test.each([
                    ['ruta directa', ''],
                    ['módulo usuarios', '/usuarios'],
                    ['raíz API', '/cupcakeslife'],
                    [
                        'raíz y módulo',
                        '/cupcakeslife/usuarios'
                    ]
                ])('acepta %s', async (
                    description,
                    prefix
                ) => {

                    const response = await handler(
                        operationEvent(operation, {
                            p:
                                `${prefix}${operation.path}`,
                            env: {
                                ENDPOINT_ROOT: 'cupcakeslife'
                            }
                        })
                    );

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );
                });


                test('elimina una barra final', async () => {

                    const response = await handler(
                        operationEvent(operation, {
                            p: `${operation.path}/`
                        })
                    );

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );
                });


                test('agrega la barra inicial a una ruta directa', async () => {

                    const response = await handler(
                        operationEvent(operation, {
                            p: operation.path.slice(1)
                        })
                    );

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );
                });


                test.each([
                    'local',
                    'dev',
                    'prod'
                ])('elimina el stage %s', async stage => {

                    const response = await handler(
                        operationEvent(operation, {
                            p:
                                `/${stage}/cupcakeslife/usuarios${operation.path}`,
                            http: {
                                stage
                            },
                            env: {
                                ENDPOINT_ROOT: 'cupcakeslife'
                            }
                        })
                    );

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );
                });


                test('acepta prefijos personalizados sin barra inicial', async () => {

                    const response = await handler(
                        operationEvent(operation, {
                            p:
                                `/custom-api/custom-users${operation.path}`,
                            env: {
                                ENDPOINT_ROOT: 'custom-api',
                                USER_MODULE: 'custom-users'
                            }
                        })
                    );

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );
                });


                test('acepta prefijos personalizados con barra inicial', async () => {

                    const response = await handler(
                        operationEvent(operation, {
                            p:
                                `/custom-api/custom-users${operation.path}`,
                            env: {
                                ENDPOINT_ROOT: '/custom-api',
                                USER_MODULE: '/custom-users'
                            }
                        })
                    );

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );
                });
            }
        );


        test('prioriza rawPath sobre path', async () => {

            const response = await handler({
                httpMethod: 'GET',
                rawPath: '/documentos-legales-vigentes',
                path: '/unknown'
            });

            expectHttpResponse(
                response,
                200,
                operations[6].response
            );
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', '']
        ])('utiliza path cuando rawPath es %s', async (
            description,
            rawPath
        ) => {

            const response = await handler({
                httpMethod: 'GET',
                rawPath,
                path: '/documentos-legales-vigentes'
            });

            expectHttpResponse(
                response,
                200,
                operations[6].response
            );
        });


        test.each([
            ['sin variables', undefined],
            ['cadena vacía', '']
        ])('utiliza usuarios por defecto cuando USER_MODULE está %s', async (
            description,
            moduleValue
        ) => {

            if (moduleValue === undefined) {

                delete process.env.USER_MODULE;

            } else {

                process.env.USER_MODULE = moduleValue;
            }

            const response = await handler({
                httpMethod: 'GET',
                path:
                    '/usuarios/documentos-legales-vigentes'
            });

            expectHttpResponse(
                response,
                200,
                operations[6].response
            );
        });


        test.each([
            ['sin rutas', {}],
            [
                'rutas vacías',
                {
                    rawPath: '',
                    path: ''
                }
            ],
            [
                'rutas null',
                {
                    rawPath: null,
                    path: null
                }
            ]
        ])('utiliza la ruta raíz: %s', async (
            description,
            paths
        ) => {

            const response = await handler({
                httpMethod: 'GET',
                ...paths
            });

            expectCurrentNotFound(
                response,
                'GET /'
            );
        });


        test.each([
            [
                'stage',
                '/dev',
                {
                    requestContext: {
                        stage: 'dev'
                    }
                },
                {}
            ],
            [
                'raíz',
                '/cupcakeslife',
                {},
                {
                    ENDPOINT_ROOT: 'cupcakeslife'
                }
            ],
            [
                'módulo',
                '/usuarios',
                {},
                {}
            ]
        ])('normaliza una ruta idéntica al prefijo %s como raíz', async (
            description,
            path,
            overrides,
            env
        ) => {

            const response = await handler(
                ev({
                    p: path,
                    method: 'GET',
                    env,
                    ...overrides
                })
            );

            expectCurrentNotFound(
                response,
                'GET /'
            );
        });


        test.each([
            [
                '/dev-extra/documentos-legales-vigentes',
                {
                    requestContext: {
                        stage: 'dev'
                    }
                }
            ],
            [
                '/cupcakeslife-extra/documentos-legales-vigentes',
                {}
            ],
            [
                '/usuarios-extra/documentos-legales-vigentes',
                {}
            ]
        ])('no elimina prefijos parcialmente coincidentes: %s', async (
            path,
            overrides
        ) => {

            process.env.ENDPOINT_ROOT =
                'cupcakeslife';

            const response = await handler({
                httpMethod: 'GET',
                path,
                ...overrides
            });

            expectCurrentNotFound(
                response,
                `GET ${path}`
            );
        });
    });


    /*
     * =====================================================
     * UNKNOWN ROUTES AND REMOVED ENDPOINTS
     * =====================================================
     */

    describe('Rutas inexistentes y operaciones trasladadas', () => {

        test.each([
            ['POST', '/insertar-usuario-nuevo'],
            ['POST', '/consultar-aceptaciones-legales'],
            ['POST', '/registrar-aceptaciones-legales'],
            ['POST', '/unknown'],
            ['GET', '/unknown'],
            ['GET', '/insertar-usuario-medalla'],
            ['POST', '/actualizar-usuario-medalla'],
            ['GET', '/insertar-usuario-paquete'],
            ['POST', '/actualizar-usuario'],
            ['GET', '/obtener-preferencias'],
            ['POST', '/actualizar-preferencias'],
            ['POST', '/documentos-legales-vigentes'],
            ['GET', '/recuperar-contrasena'],
            ['OPTIONS', '/documentos-legales-vigentes'],
            ['DELETE', '/actualizar-usuario'],
            ['GET', '/DOCUMENTOS-LEGALES-VIGENTES']
        ])('documenta la respuesta actual para %s %s', async (
            method,
            path
        ) => {

            const response = await handler(
                ev({
                    p: path,
                    method,
                    body: {}
                })
            );

            expectCurrentNotFound(
                response,
                `${method} ${path}`
            );
        });


        test('no valida el JSON de una ruta inexistente', async () => {

            const response = await handler(
                ev({
                    p: '/unknown',
                    method: 'POST',
                    body: '{invalid'
                })
            );

            expectCurrentNotFound(
                response,
                'POST /unknown'
            );

            expect(errorSpy)
                .not.toHaveBeenCalled();
        });


        test('elimina únicamente una barra final', async () => {

            const response = await handler(
                ev({
                    p:
                        '/documentos-legales-vigentes//',
                    method: 'GET'
                })
            );

            expectCurrentNotFound(
                response,
                'GET /documentos-legales-vigentes/'
            );
        });


        test('no elimina un stage diferente al configurado', async () => {

            const path =
                '/prod/cupcakeslife/usuarios/documentos-legales-vigentes';

            const response = await handler(
                ev({
                    p: path,
                    method: 'GET',
                    http: {
                        stage: 'dev'
                    },
                    env: {
                        ENDPOINT_ROOT: 'cupcakeslife'
                    }
                })
            );

            expectCurrentNotFound(
                response,
                `GET ${path}`
            );
        });


        test('prioriza un rawPath desconocido sobre un path válido', async () => {

            const response = await handler({
                httpMethod: 'GET',
                rawPath: '/unknown',
                path: '/documentos-legales-vigentes'
            });

            expectCurrentNotFound(
                response,
                'GET /unknown'
            );
        });


        test('no elimina el módulo antes de agregar la barra inicial', async () => {

            const response = await handler(
                ev({
                    p:
                        'usuarios/documentos-legales-vigentes',
                    method: 'GET'
                })
            );

            expectCurrentNotFound(
                response,
                'GET /usuarios/documentos-legales-vigentes'
            );
        });
    });


    /*
     * =====================================================
     * JSON BODY BRANCHES
     * =====================================================
     */

    describe('Interpretación del cuerpo HTTP', () => {

        describe.each(validatedOperations)(
            '$method $path',
            operation => {

                test('acepta un body previamente convertido a objeto', async () => {

                    const response = await handler(
                        operationEvent(operation, {
                            body: operation.body
                        })
                    );

                    /*
                     * La función ev serializa los objetos.
                     * La rama de body objeto se comprueba
                     * directamente en el siguiente caso.
                     */

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );
                });


                test('utiliza directamente un body de tipo objeto', async () => {

                    const event =
                        operationEvent(operation);

                    event.body = operation.body;

                    const response =
                        await handler(event);

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );

                    expect(
                        schema[operation.validator]
                    ).toHaveBeenCalledWith(
                        operation.body
                    );

                    expect(
                        schema[operation.validator]
                            .mock.calls[0][0]
                    ).toBe(operation.body);
                });


                test.each([
                    '{invalid',
                    '{"email":',
                    '{"email":"a@a.com",}',
                    '[1,2',
                    'invalid-json',
                    '   '
                ])('rechaza JSON mal formado: %p', async malformedBody => {

                    const response = await handler(
                        operationEvent(operation, {
                            body: malformedBody
                        })
                    );

                    expectHttpError(
                        response,
                        400,
                        'JSON inválido'
                    );

                    expectNoValidatorCalls();

                    expectNoControllerCalls();
                });


                test.each([
                    ['undefined', undefined],
                    ['null', null],
                    ['cadena vacía', ''],
                    ['false', false],
                    ['cero', 0]
                ])('envía un objeto vacío al validador cuando body es %s', async (
                    description,
                    body
                ) => {

                    const event =
                        operationEvent(operation);

                    event.body = body;

                    await handler(event);

                    expect(
                        schema[operation.validator]
                    ).toHaveBeenCalledWith({});

                    expect(
                        Ctrl[operation.controller]
                    ).toHaveBeenCalledWith({});
                });
            }
        );


        test.each([
            ['null', 'null', null],
            ['false', 'false', false],
            ['true', 'true', true],
            ['número', '123', 123],
            ['cadena', '"example"', 'example'],
            ['arreglo', '[1,2]', [1, 2]]
        ])('delega al validador el JSON de tipo %s', async (
            description,
            body,
            expectedData
        ) => {

            const response = await handler(
                ev({
                    p: '/obtener-preferencias',
                    method: 'POST',
                    body
                })
            );

            expect(
                schema.validateGetUserPreferences
            ).toHaveBeenCalledWith(expectedData);

            expect(
                Ctrl.getUserPreferences
            ).toHaveBeenCalledWith(expectedData);

            expectHttpResponse(
                response,
                200,
                operations[4].response
            );
        });


        test('no decodifica automáticamente un body Base64', async () => {

            const encodedBody = Buffer.from(
                JSON.stringify({ email })
            ).toString('base64');

            const response = await handler({
                httpMethod: 'POST',
                path: '/obtener-preferencias',
                body: encodedBody,
                isBase64Encoded: true
            });

            expectHttpError(
                response,
                400,
                'JSON inválido'
            );

            expectNoValidatorCalls();

            expectNoControllerCalls();
        });


        test('ignora isBase64Encoded cuando el body contiene JSON válido', async () => {

            const response = await handler({
                httpMethod: 'POST',
                path: '/obtener-preferencias',
                body: JSON.stringify({ email }),
                isBase64Encoded: true
            });

            expectHttpResponse(
                response,
                200,
                operations[4].response
            );

            expect(
                schema.validateGetUserPreferences
            ).toHaveBeenCalledWith({ email });
        });


        test('no utiliza queryStringParameters como sustituto del body', async () => {

            await handler({
                httpMethod: 'POST',
                path: '/obtener-preferencias',
                queryStringParameters: {
                    email
                }
            });

            expect(
                schema.validateGetUserPreferences
            ).toHaveBeenCalledWith({});

            expect(
                Ctrl.getUserPreferences
            ).toHaveBeenCalledWith({});
        });
    });


    /*
     * =====================================================
     * VALIDATOR SUCCESS BRANCHES
     * =====================================================
     */

    describe('Propagación de datos saneados por el validador', () => {

        describe.each(validatedOperations)(
            '$method $path',
            operation => {

                test('envía al controlador los datos saneados y no el body original', async () => {

                    const sanitizedData = {
                        ...operation.body,
                        email: 'normalized@example.com'
                    };

                    schema[operation.validator]
                        .mockReturnValue({
                            success: true,
                            data: sanitizedData
                        });

                    const response = await handler(
                        operationEvent(operation)
                    );

                    expectHttpResponse(
                        response,
                        200,
                        operation.response
                    );

                    expect(
                        Ctrl[operation.controller]
                    ).toHaveBeenCalledWith(
                        sanitizedData
                    );

                    expect(
                        Ctrl[operation.controller]
                            .mock.calls[0][0]
                    ).toBe(sanitizedData);
                });


                test('no transmite propiedades eliminadas por el validador', async () => {

                    const originalBody = {
                        ...operation.body,
                        extra: 'unexpected-value'
                    };

                    schema[operation.validator]
                        .mockReturnValue({
                            success: true,
                            data: operation.body
                        });

                    await handler(
                        operationEvent(operation, {
                            body: originalBody
                        })
                    );

                    expect(
                        schema[operation.validator]
                    ).toHaveBeenCalledWith(
                        originalBody
                    );

                    expect(
                        Ctrl[operation.controller]
                    ).toHaveBeenCalledWith(
                        operation.body
                    );

                    expect(
                        Ctrl[operation.controller]
                            .mock.calls[0][0]
                    ).not.toHaveProperty('extra');
                });


                test('invoca el validador antes del controlador', async () => {

                    await handler(
                        operationEvent(operation)
                    );

                    const validationOrder =
                        schema[operation.validator]
                            .mock.invocationCallOrder[0];

                    const controllerOrder =
                        Ctrl[operation.controller]
                            .mock.invocationCallOrder[0];

                    expect(validationOrder)
                        .toBeLessThan(controllerOrder);
                });


                test('no modifica el objeto saneado por el validador', async () => {

                    const sanitizedData =
                        Object.freeze({
                            ...operation.body
                        });

                    schema[operation.validator]
                        .mockReturnValue({
                            success: true,
                            data: sanitizedData
                        });

                    await handler(
                        operationEvent(operation)
                    );

                    expect(sanitizedData)
                        .toEqual(operation.body);

                    expect(
                        Ctrl[operation.controller]
                            .mock.calls[0][0]
                    ).toBe(sanitizedData);
                });
            }
        );
    });


    /*
     * =====================================================
     * VALIDATOR ERROR BRANCHES
     * =====================================================
     */

    describe('Construcción de errores de validación', () => {

        const validationErrors = [
            [
                'email requerido',
                {
                    issues: [
                        {
                            code: 'invalid_type',
                            received: 'undefined',
                            path: ['email']
                        }
                    ]
                },
                'User email is required.'
            ],
            [
                'otro campo requerido',
                {
                    issues: [
                        {
                            code: 'invalid_type',
                            received: 'undefined',
                            path: ['nombre']
                        }
                    ]
                },
                'Field is required.'
            ],
            [
                'campo anidado requerido',
                {
                    issues: [
                        {
                            code: 'invalid_type',
                            received: 'undefined',
                            path: ['usuario', 'email']
                        }
                    ]
                },
                'Field is required.'
            ],
            [
                'campo requerido sin path',
                {
                    issues: [
                        {
                            code: 'invalid_type',
                            received: 'undefined'
                        }
                    ]
                },
                'Field is required.'
            ],
            [
                'email null',
                {
                    issues: [
                        {
                            code: 'invalid_type',
                            received: 'null',
                            path: ['email'],
                            message: 'Invalid email type'
                        }
                    ]
                },
                'Invalid email type'
            ],
            [
                'email con tipo incorrecto',
                {
                    issues: [
                        {
                            code: 'invalid_type',
                            received: 'number',
                            path: ['email'],
                            message: 'Expected string'
                        }
                    ]
                },
                'Expected string'
            ],
            [
                'correo con formato incorrecto',
                {
                    issues: [
                        {
                            code: 'invalid_string',
                            path: ['email'],
                            message: 'Invalid email'
                        }
                    ]
                },
                'Invalid email'
            ],
            [
                'error personalizado',
                {
                    issues: [
                        {
                            code: 'custom',
                            path: ['tema'],
                            message: 'Invalid theme'
                        }
                    ]
                },
                'Invalid theme'
            ],
            [
                'error sin mensaje',
                {
                    issues: [
                        {
                            code: 'custom',
                            path: ['email']
                        }
                    ]
                },
                'Parámetros inválidos'
            ],
            [
                'mensaje vacío',
                {
                    issues: [
                        {
                            code: 'custom',
                            message: ''
                        }
                    ]
                },
                'Parámetros inválidos'
            ],
            [
                'mensaje null',
                {
                    issues: [
                        {
                            code: 'custom',
                            message: null
                        }
                    ]
                },
                'Parámetros inválidos'
            ],
            [
                'issues vacío',
                {
                    issues: []
                },
                'Parámetros inválidos'
            ],
            [
                'issues undefined',
                {},
                'Parámetros inválidos'
            ],
            [
                'issues null',
                {
                    issues: null
                },
                'Parámetros inválidos'
            ],
            [
                'múltiples errores',
                {
                    issues: [
                        {
                            code: 'custom',
                            message: 'First error'
                        },
                        {
                            code: 'custom',
                            message: 'Second error'
                        }
                    ]
                },
                'First error'
            ]
        ];


        describe.each(validatedOperations)(
            '$method $path',
            operation => {

                test.each(validationErrors)(
                    'construye HTTP 400 para %s',
                    async (
                        description,
                        error,
                        expectedMessage
                    ) => {

                        schema[operation.validator]
                            .mockReturnValue({
                                success: false,
                                error
                            });

                        const response = await handler(
                            operationEvent(operation)
                        );

                        expectHttpError(
                            response,
                            400,
                            expectedMessage
                        );

                        expect(
                            schema[operation.validator]
                        ).toHaveBeenCalledTimes(1);

                        expectNoControllerCalls();

                        expect(errorSpy)
                            .toHaveBeenCalledTimes(1);
                    }
                );


                test('controla una excepción síncrona del validador', async () => {

                    const error = new Error(
                        'Unexpected validation error'
                    );

                    schema[operation.validator]
                        .mockImplementation(() => {

                            throw error;
                        });

                    const response = await handler(
                        operationEvent(operation)
                    );

                    expectHttpError(
                        response,
                        500,
                        error.message
                    );

                    expectNoControllerCalls();

                    expect(errorSpy)
                        .toHaveBeenCalledWith(error);
                });


                test('controla un resultado de validación undefined', async () => {

                    schema[operation.validator]
                        .mockReturnValue(undefined);

                    const response = await handler(
                        operationEvent(operation)
                    );

                    expect(response.statusCode)
                        .toBe(500);

                    expectNoControllerCalls();
                });


                test('controla un resultado inválido sin propiedad error', async () => {

                    schema[operation.validator]
                        .mockReturnValue({
                            success: false
                        });

                    const response = await handler(
                        operationEvent(operation)
                    );

                    expect(response.statusCode)
                        .toBe(500);

                    expectNoControllerCalls();
                });
            }
        );


        test('no transmite field en la respuesta HTTP de validación', async () => {

            schema.validateUpdateUser
                .mockReturnValue({
                    success: false,
                    error: {
                        issues: [
                            {
                                code: 'invalid_type',
                                received: 'undefined',
                                path: ['nombre']
                            }
                        ]
                    }
                });

            const response = await handler(
                operationEvent(operations[3])
            );

            expectHttpError(
                response,
                400,
                'Field is required.'
            );

            expect(
                JSON.parse(response.body)
            ).not.toHaveProperty('field');

            expect(errorSpy)
                .toHaveBeenCalledWith({
                    statusCode: 400,
                    message: 'Field is required.',
                    field: 'nombre'
                });
        });
    });


    /*
     * =====================================================
     * PUBLIC LEGAL DOCUMENTS
     * =====================================================
     */

    describe('Consulta pública de documentos legales', () => {

        test('no requiere headers de autenticación', async () => {

            const response = await handler({
                httpMethod: 'GET',
                path: '/documentos-legales-vigentes'
            });

            expectHttpResponse(
                response,
                200,
                operations[6].response
            );

            expect(
                Ctrl.getActiveLegalDocuments
            ).toHaveBeenCalledWith();

            expectNoValidatorCalls();
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['JSON inválido', '{invalid'],
            ['JSON válido', '{"email":"user@example.com"}'],
            ['objeto', { email }],
            ['arreglo', [12, 35]]
        ])('no interpreta el body durante la consulta pública: %s', async (
            description,
            body
        ) => {

            const response = await handler({
                httpMethod: 'GET',
                path: '/documentos-legales-vigentes',
                body
            });

            expectHttpResponse(
                response,
                200,
                operations[6].response
            );

            expect(
                Ctrl.getActiveLegalDocuments
            ).toHaveBeenCalledWith();

            expectNoValidatorCalls();
        });


        test('no transmite queryStringParameters al controlador', async () => {

            await handler({
                httpMethod: 'GET',
                path: '/documentos-legales-vigentes',
                queryStringParameters: {
                    email,
                    firebaseUid: 'UnexpectedUID'
                }
            });

            expect(
                Ctrl.getActiveLegalDocuments
            ).toHaveBeenCalledWith();
        });


        test('no transmite headers al controlador', async () => {

            await handler({
                httpMethod: 'GET',
                path: '/documentos-legales-vigentes',
                headers: {
                    Authorization: 'Bearer simulated-token'
                }
            });

            expect(
                Ctrl.getActiveLegalDocuments
            ).toHaveBeenCalledWith();
        });
    });


    /*
     * =====================================================
     * SUCCESS RESPONSE BRANCHES
     * =====================================================
     */

    describe('Serialización de respuestas exitosas', () => {

        describe.each(operations)(
            '$method $path',
            operation => {

                test.each([
                    ['arreglo vacío', []],
                    ['objeto vacío', {}],
                    ['null', null],
                    ['booleano true', true],
                    ['booleano false', false],
                    ['número', 123],
                    ['cadena', 'success']
                ])('serializa una respuesta de tipo %s', async (
                    description,
                    result
                ) => {

                    Ctrl[operation.controller]
                        .mockResolvedValue(result);

                    const response = await handler(
                        operationEvent(operation)
                    );

                    expectHttpResponse(
                        response,
                        200,
                        result
                    );
                });


                test('documenta una respuesta undefined', async () => {

                    Ctrl[operation.controller]
                        .mockResolvedValue(undefined);

                    const response = await handler(
                        operationEvent(operation)
                    );

                    expect(response).toEqual({
                        statusCode: 200,
                        body: undefined
                    });
                });


                test('no interpreta un objeto resuelto con statusCode como respuesta HTTP', async () => {

                    const result = {
                        statusCode: 409,
                        body: 'Simulated conflict'
                    };

                    Ctrl[operation.controller]
                        .mockResolvedValue(result);

                    const response = await handler(
                        operationEvent(operation)
                    );

                    expectHttpResponse(
                        response,
                        200,
                        result
                    );
                });
            }
        );
    });


    /*
     * =====================================================
     * ERROR STATUS CODE BRANCHES
     * =====================================================
     */

    describe('Conversión de códigos de error', () => {

        test.each([
            [400, 400],
            [401, 401],
            [403, 403],
            [404, 404],
            [405, 405],
            [409, 409],
            [418, 418],
            [500, 500],
            [502, 502],
            [503, 503],
            ['400', 400],
            ['409', 409],
            ['503', 503],
            [' 409 ', 409],
            [undefined, 500],
            [null, 500],
            ['', 500],
            ['invalid', 500],
            [0, 500],
            [false, 500],
            [NaN, 500],
            [true, 1],
            [-1, -1],
            [999, 999],
            [400.5, 400.5],
            [Infinity, Infinity]
        ])('convierte statusCode %p en %p', async (
            originalCode,
            expectedCode
        ) => {

            const error = {
                statusCode: originalCode,
                message: 'Simulated error'
            };

            Ctrl.getUserPreferences
                .mockRejectedValue(error);

            const response = await handler(
                operationEvent(operations[4])
            );

            expectHttpError(
                response,
                expectedCode,
                error.message
            );

            expect(errorSpy)
                .toHaveBeenCalledWith(error);
        });
    });


    /*
     * =====================================================
     * ERROR MESSAGE BRANCHES
     * =====================================================
     */

    describe('Construcción de mensajes de error', () => {

        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena vacía', ''],
            ['false', false],
            ['cero', 0],
            ['NaN', NaN]
        ])('utiliza el mensaje genérico cuando message es %s', async (
            description,
            message
        ) => {

            Ctrl.getUserPreferences
                .mockRejectedValue({
                    statusCode: 409,
                    message
                });

            const response = await handler(
                operationEvent(operations[4])
            );

            expectHttpError(
                response,
                409,
                'Error interno del servidor'
            );
        });


        test.each([
            ['cadena', 'Simulated error'],
            ['espacios', '   '],
            ['número', 123],
            ['booleano true', true],
            ['objeto', { detail: 'Simulated detail' }],
            ['arreglo', ['Simulated detail']]
        ])('documenta la propagación de un mensaje truthy de tipo %s', async (
            description,
            message
        ) => {

            Ctrl.getUserPreferences
                .mockRejectedValue({
                    statusCode: 409,
                    message
                });

            const response = await handler(
                operationEvent(operations[4])
            );

            expectHttpError(
                response,
                409,
                message
            );
        });


        test.each([
            ['undefined', undefined],
            ['null', null],
            ['cadena', 'Unexpected failure'],
            ['número', 123],
            ['booleano', true],
            ['objeto vacío', {}],
            ['arreglo', []]
        ])('controla una excepción sin message: %s', async (
            description,
            error
        ) => {

            Ctrl.getUserPreferences
                .mockRejectedValue(error);

            const response = await handler(
                operationEvent(operations[4])
            );

            expectHttpError(
                response,
                500,
                'Error interno del servidor'
            );

            expect(errorSpy)
                .toHaveBeenCalledWith(error);
        });


        test('documenta que HTTP 500 conserva el mensaje original', async () => {

            const error = new Error(
                'Simulated internal database detail'
            );

            Ctrl.getUserPreferences
                .mockRejectedValue(error);

            const response = await handler(
                operationEvent(operations[4])
            );

            expectHttpError(
                response,
                500,
                error.message
            );

            expect(errorSpy)
                .toHaveBeenCalledWith(error);
        });


        test('no incorpora propiedades adicionales del error al body HTTP', async () => {

            const error = {
                statusCode: 409,
                message: 'Simulated conflict',
                code: '23505',
                detail: 'Simulated database detail',
                stack: 'Simulated stack',
                query: 'SELECT simulated_data'
            };

            Ctrl.getUserPreferences
                .mockRejectedValue(error);

            const response = await handler(
                operationEvent(operations[4])
            );

            expectHttpError(
                response,
                409,
                error.message
            );

            expect(errorSpy)
                .toHaveBeenCalledWith(error);
        });
    });


    /*
     * =====================================================
     * UNEXPECTED EXECUTION ERRORS
     * =====================================================
     */

    describe('Excepciones durante la ejecución', () => {

        describe.each(operations)(
            '$method $path',
            operation => {

                test('controla una excepción síncrona del controlador', async () => {

                    const error = new Error(
                        'Synchronous controller error'
                    );

                    Ctrl[operation.controller]
                        .mockImplementation(() => {

                            throw error;
                        });

                    const response = await handler(
                        operationEvent(operation)
                    );

                    expectHttpError(
                        response,
                        500,
                        error.message
                    );

                    expect(errorSpy)
                        .toHaveBeenCalledWith(error);
                });


                test('controla un rechazo asíncrono del controlador', async () => {

                    const error = {
                        statusCode: 503,
                        message: 'Service unavailable'
                    };

                    Ctrl[operation.controller]
                        .mockRejectedValue(error);

                    const response = await handler(
                        operationEvent(operation)
                    );

                    expectHttpError(
                        response,
                        503,
                        error.message
                    );

                    expect(errorSpy)
                        .toHaveBeenCalledWith(error);

                    expect(
                        Ctrl[operation.controller]
                    ).toHaveBeenCalledTimes(1);
                });
            }
        );


        test.each([
            ['undefined', undefined],
            ['null', null]
        ])('controla un evento de tipo %s', async (
            description,
            event
        ) => {

            const response = await handler(event);

            expect(response.statusCode)
                .toBe(500);

            expect(
                JSON.parse(response.body).message
            ).toEqual(expect.any(String));

            expectNoControllerCalls();

            expectNoValidatorCalls();
        });


        test.each([
            ['número', 123],
            ['booleano', true],
            ['objeto', {}],
            ['arreglo', []]
        ])('controla una ruta no string: %s', async (
            description,
            path
        ) => {

            const response = await handler({
                httpMethod: 'GET',
                path
            });

            expect(response.statusCode)
                .toBe(500);

            expectNoControllerCalls();

            expectNoValidatorCalls();
        });


        test('controla un resultado con referencia circular', async () => {

            const result = {
                success: true
            };

            result.circular = result;

            Ctrl.getUserPreferences
                .mockResolvedValue(result);

            const response = await handler(
                operationEvent(operations[4])
            );

            expect(response.statusCode)
                .toBe(500);

            expect(errorSpy)
                .toHaveBeenCalledTimes(1);
        });


        test('controla un resultado que contiene BigInt', async () => {

            Ctrl.getUserPreferences
                .mockResolvedValue({
                    id: BigInt(25)
                });

            const response = await handler(
                operationEvent(operations[4])
            );

            expect(response.statusCode)
                .toBe(500);

            expect(errorSpy)
                .toHaveBeenCalledTimes(1);
        });
    });


    /*
     * =====================================================
     * LOGGING BRANCHES
     * =====================================================
     */

    describe('Registro de errores', () => {

        test.each(operations)(
            'no registra errores durante $method $path',
            async operation => {

                await handler(
                    operationEvent(operation)
                );

                expect(errorSpy)
                    .not.toHaveBeenCalled();
            }
        );


        test('registra el objeto de error completo', async () => {

            const error = {
                statusCode: 500,
                message: 'Simulated internal error',
                code: 'INTERNAL_ERROR',
                detail: 'Simulated detail'
            };

            Ctrl.getUserPreferences
                .mockRejectedValue(error);

            await handler(
                operationEvent(operations[4])
            );

            expect(errorSpy)
                .toHaveBeenCalledTimes(1);

            expect(
                errorSpy.mock.calls[0][0]
            ).toBe(error);
        });


        test('registra el error construido durante el parseo JSON', async () => {

            await handler(
                ev({
                    p: '/obtener-preferencias',
                    method: 'POST',
                    body: '{invalid'
                })
            );

            expect(errorSpy)
                .toHaveBeenCalledWith({
                    statusCode: 400,
                    message: 'JSON inválido'
                });
        });
    });


    /*
     * =====================================================
     * ASYNCHRONOUS EXECUTION
     * =====================================================
     */

    describe('Comportamiento asíncrono del handler', () => {

        test('espera al controlador antes de devolver la respuesta HTTP', async () => {

            let resolveController;

            Ctrl.getUserPreferences
                .mockImplementation(
                    () => new Promise(resolve => {

                        resolveController = resolve;
                    })
                );

            let completed = false;

            const operation = handler(
                operationEvent(operations[4])
            ).then(response => {

                completed = true;

                return response;
            });

            expect(
                Ctrl.getUserPreferences
            ).toHaveBeenCalledTimes(1);

            await Promise.resolve();

            expect(completed)
                .toBe(false);

            const result = {
                recordatorios: true
            };

            resolveController(result);

            const response = await operation;

            expectHttpResponse(
                response,
                200,
                result
            );

            expect(completed)
                .toBe(true);
        });


        test('controla un rechazo posterior a la invocación del controlador', async () => {

            let rejectController;

            Ctrl.getUserPreferences
                .mockImplementation(
                    () => new Promise(
                        (resolve, reject) => {

                            rejectController = reject;
                        }
                    )
                );

            const operation = handler(
                operationEvent(operations[4])
            );

            rejectController({
                statusCode: 503,
                message: 'Service unavailable'
            });

            const response = await operation;

            expectHttpError(
                response,
                503,
                'Service unavailable'
            );
        });


        test('mantiene independientes dos solicitudes concurrentes', async () => {

            const firstBody = {
                email: 'first@example.com'
            };

            const secondBody = {
                email: 'second@example.com'
            };

            Ctrl.getUserPreferences
                .mockImplementation(
                    async params => ({
                        email: params.email
                    })
                );

            const [
                firstResponse,
                secondResponse
            ] = await Promise.all([
                handler(
                    ev({
                        p: '/obtener-preferencias',
                        method: 'POST',
                        body: firstBody
                    })
                ),
                handler(
                    ev({
                        p: '/obtener-preferencias',
                        method: 'POST',
                        body: secondBody
                    })
                )
            ]);

            expectHttpResponse(
                firstResponse,
                200,
                firstBody
            );

            expectHttpResponse(
                secondResponse,
                200,
                secondBody
            );

            expect(
                Ctrl.getUserPreferences
            ).toHaveBeenCalledTimes(2);

            expect(
                Ctrl.getUserPreferences
            ).toHaveBeenNthCalledWith(
                1,
                firstBody
            );

            expect(
                Ctrl.getUserPreferences
            ).toHaveBeenNthCalledWith(
                2,
                secondBody
            );
        });


        test('una solicitud inválida no interfiere con otra válida', async () => {

            const [
                validResponse,
                invalidResponse
            ] = await Promise.all([
                handler(
                    operationEvent(operations[4])
                ),
                handler(
                    ev({
                        p: '/obtener-preferencias',
                        method: 'POST',
                        body: '{invalid'
                    })
                )
            ]);

            expectHttpResponse(
                validResponse,
                200,
                operations[4].response
            );

            expectHttpError(
                invalidResponse,
                400,
                'JSON inválido'
            );

            expect(
                Ctrl.getUserPreferences
            ).toHaveBeenCalledTimes(1);

            expect(
                schema.validateGetUserPreferences
            ).toHaveBeenCalledTimes(1);
        });
    });
});