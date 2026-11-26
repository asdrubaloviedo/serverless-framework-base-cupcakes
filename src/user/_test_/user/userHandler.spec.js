// src/user/_test_/user/userHandler.spec.js

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


/*
 * Los validadores Zod no se simulan.
 *
 * Este archivo comprueba la integración entre
 * el handler y los esquemas reales.
 *
 * Únicamente se simula el controlador para evitar
 * conexiones con servicios externos.
 */

const Ctrl = require('@user/controller/user');

const { handler } = require('../../handlers/user');


const ORIGINAL_ENV = { ...process.env };

const EMAIL = 'user@example.com';

const RAW_EMAIL = '  USER@EXAMPLE.COM  ';


const PATHS = {

    createMedal:
        '/insertar-usuario-medalla',

    updateMedal:
        '/actualizar-usuario-medalla',

    createPackage:
        '/insertar-usuario-paquete',

    updateUser:
        '/actualizar-usuario',

    getPreferences:
        '/obtener-preferencias',

    updatePreferences:
        '/actualizar-preferencias',

    legalDocuments:
        '/documentos-legales-vigentes',

    resetPassword:
        '/recuperar-contrasena'
};


const validPackage = {

    email: EMAIL,

    paquete: 9,

    moneda: 'PEN',

    montoCentavos: 1590
};


const validProfile = {

    email: EMAIL,

    nombre: 'Ana López',

    avatarId: 2
};


const validPreferences = {

    email: EMAIL,

    recordatorios: true,

    mensajes: false,

    promociones: false,

    musica: true,

    efectos_sonido: true,

    vibracion: false,

    tema: 'dark'
};


const preferencesResponse = {

    recordatorios: true,

    mensajes: false,

    promociones: false,

    musica: true,

    efectos_sonido: true,

    vibracion: false,

    tema: 'dark'
};


const passwordResetResponse = {

    message: 'Password reset email sent.'
};


const legalDocumentsResponse = [

    {
        id: 12
    },

    {
        id: 35
    }
];


const ev = (
    path,
    method,
    bodyObj
) => ({

    rawPath: path,

    path,

    httpMethod: method,

    requestContext: {
        stage: 'local'
    },

    body: bodyObj == null
        ? null
        : JSON.stringify(bodyObj)
});


const request = (
    method,
    path,
    body
) => handler(
    ev(
        `/usuarios${path}`,
        method,
        body
    )
);


const expectResponse = (
    response,
    statusCode,
    body
) => {

    expect(response).toEqual({

        statusCode,

        body: JSON.stringify(body)
    });
};


const expectSuccess = (
    response,
    body
) => {

    expectResponse(
        response,
        200,
        body
    );
};


const expectNoControllerCalls = () => {

    Object.values(Ctrl)
        .forEach(controller => {

            expect(controller)
                .not.toHaveBeenCalled();
        });
};


const expectOnlyController = (
    controllerName,
    ...args
) => {

    expect(Ctrl[controllerName])
        .toHaveBeenCalledTimes(1);

    expect(Ctrl[controllerName])
        .toHaveBeenCalledWith(...args);

    Object.keys(Ctrl)
        .filter(name => name !== controllerName)
        .forEach(name => {

            expect(Ctrl[name])
                .not.toHaveBeenCalled();
        });
};


const expectBadRequest = (
    response,
    message
) => {

    expect(response.statusCode)
        .toBe(400);

    const body = JSON.parse(response.body);

    expect(body).toEqual({

        message: expect.any(String)
    });

    expect(body.message.length)
        .toBeGreaterThan(0);

    if (message !== undefined) {

        expect(body.message)
            .toBe(message);
    }

    expectNoControllerCalls();
};


const expectCurrentNotFound = (
    response,
    method,
    path
) => {

    /*
     * Comportamiento productivo actual:
     *
     * HTTP 404 encapsulado dentro de HTTP 200.
     *
     * Se documenta sin modificar el handler.
     */

    expectSuccess(
        response,
        {
            statusCode: 404,

            body: JSON.stringify({

                message: 'Not Found',

                pathTried: `${method} ${path}`
            })
        }
    );

    expectNoControllerCalls();
};


const operations = [

    {
        method: 'POST',

        path: PATHS.createMedal,

        controller: 'createOneUserMedalLeage',

        body: {
            email: EMAIL,
            medalla: 1
        },

        response: [{ ok: 1 }]
    },

    {
        method: 'PATCH',

        path: PATHS.updateMedal,

        controller: 'patchOneUserMedalLeage',

        body: {
            email: EMAIL,
            cupcake: 1,
            estado: 2,
            valor: true
        },

        response: [{ ok: 2 }]
    },

    {
        method: 'POST',

        path: PATHS.createPackage,

        controller: 'createOneUserPackage',

        body: validPackage,

        response: [{ ok: 3 }]
    },

    {
        method: 'PATCH',

        path: PATHS.updateUser,

        controller: 'updateOneUser',

        body: validProfile,

        response: {
            success: true
        }
    },

    {
        method: 'POST',

        path: PATHS.getPreferences,

        controller: 'getUserPreferences',

        body: {
            email: EMAIL
        },

        response: preferencesResponse
    },

    {
        method: 'PATCH',

        path: PATHS.updatePreferences,

        controller: 'updateUserPreferences',

        body: validPreferences,

        response: {
            success: true
        }
    },

    {
        method: 'GET',

        path: PATHS.legalDocuments,

        controller: 'getActiveLegalDocuments',

        body: undefined,

        response: legalDocumentsResponse
    },

    {
        method: 'POST',

        path: PATHS.resetPassword,

        controller: 'sendPasswordResetEmail',

        body: {
            email: EMAIL
        },

        response: passwordResetResponse
    }
];


const emailOperations = operations.filter(
    operation => operation.body !== undefined
);


let errorSpy;


beforeEach(() => {

    jest.resetAllMocks();

    process.env = {

        ...ORIGINAL_ENV,

        ENDPOINT_ROOT: '',

        USER_MODULE: 'usuarios'
    };

    operations.forEach(operation => {

        Ctrl[operation.controller]
            .mockResolvedValue(
                operation.response
            );
    });

    errorSpy = jest.spyOn(console, 'error')
        .mockImplementation(() => {});
});


afterEach(() => {

    process.env = { ...ORIGINAL_ENV };

    jest.restoreAllMocks();
});


describe('User handler', () => {

    /*
     * =====================================================
     * ORIGINAL TESTS - PRESERVED AND ADAPTED
     * =====================================================
     */

    describe('Casos originales readaptados', () => {

        test('POST /insertar-usuario-medalla -> 200', async () => {

            Ctrl.createOneUserMedalLeage
                .mockResolvedValue([
                    { ok: 1 }
                ]);

            const body = {

                email: 'a@a.com',

                medalla: 1
            };

            const response = await handler(
                ev(
                    '/usuarios/insertar-usuario-medalla',
                    'POST',
                    body
                )
            );

            expectSuccess(
                response,
                [{ ok: 1 }]
            );

            expectOnlyController(
                'createOneUserMedalLeage',
                body
            );
        });


        test('PATCH /actualizar-usuario-medalla -> 200', async () => {

            Ctrl.patchOneUserMedalLeage
                .mockResolvedValue([
                    { ok: 2 }
                ]);

            const body = {

                email: 'a@a.com',

                cupcake: 1,

                estado: true,

                valor: 5
            };

            const response = await handler(
                ev(
                    '/usuarios/actualizar-usuario-medalla',
                    'PATCH',
                    body
                )
            );

            expectSuccess(
                response,
                [{ ok: 2 }]
            );

            /*
             * Se conserva el body original y se
             * comprueba la coerción real de Zod.
             */

            expectOnlyController(
                'patchOneUserMedalLeage',
                {
                    email: 'a@a.com',

                    cupcake: 1,

                    estado: 1,

                    valor: true
                }
            );
        });


        test('POST /insertar-usuario-paquete -> 200', async () => {

            Ctrl.createOneUserPackage
                .mockResolvedValue([
                    { ok: 3 }
                ]);

            const body = {

                email: 'a@a.com',

                paquete: 9,

                moneda: 'PEN',

                montoCentavos: 1590
            };

            const response = await handler(
                ev(
                    '/usuarios/insertar-usuario-paquete',
                    'POST',
                    body
                )
            );

            expectSuccess(
                response,
                [{ ok: 3 }]
            );

            expectOnlyController(
                'createOneUserPackage',
                body
            );
        });


        test('POST /insertar-usuario-nuevo ya no pertenece al handler general', async () => {

            /*
             * La prueba original esperaba HTTP 200
             * y una llamada a createOneUser.
             *
             * El registro tradicional ahora pertenece
             * al handler de autenticación legal.
             */

            const response = await handler(
                ev(
                    '/usuarios/insertar-usuario-nuevo',
                    'POST',
                    {
                        email: 'b@b.com'
                    }
                )
            );

            expectCurrentNotFound(
                response,
                'POST',
                '/insertar-usuario-nuevo'
            );

            expect(Ctrl.createOneUser)
                .not.toHaveBeenCalled();
        });


        test('error del controlador -> 500 (propaga message)', async () => {

            /*
             * Se conserva el objetivo original de
             * comprobar la propagación del error.
             *
             * Se utiliza una operación vigente.
             */

            Ctrl.updateOneUser
                .mockRejectedValue(
                    new Error('boom')
                );

            const response = await request(
                'PATCH',
                PATHS.updateUser,
                validProfile
            );

            expectResponse(
                response,
                500,
                {
                    message: 'boom'
                }
            );

            expectOnlyController(
                'updateOneUser',
                validProfile
            );
        });
    });


    /*
     * =====================================================
     * SUCCESSFUL OPERATIONS
     * =====================================================
     */

    describe('Flujos funcionales exitosos', () => {

        test.each(operations)(
            '$method $path -> HTTP 200',
            async operation => {

                const response = await request(
                    operation.method,
                    operation.path,
                    operation.body
                );

                expectSuccess(
                    response,
                    operation.response
                );

                if (operation.body === undefined) {

                    expectOnlyController(
                        operation.controller
                    );

                } else {

                    expectOnlyController(
                        operation.controller,
                        operation.body
                    );
                }

                expect(errorSpy)
                    .not.toHaveBeenCalled();
            }
        );
    });


    /*
     * =====================================================
     * SHARED EMAIL VALIDATION
     * =====================================================
     */

    describe('Validación real del correo electrónico', () => {

        describe.each(emailOperations)(
            '$method $path',
            operation => {

                test('normaliza el correo antes de invocar al controlador', async () => {

                    const body = {

                        ...operation.body,

                        email: RAW_EMAIL
                    };

                    const response = await request(
                        operation.method,
                        operation.path,
                        body
                    );

                    expectSuccess(
                        response,
                        operation.response
                    );

                    expectOnlyController(
                        operation.controller,
                        {
                            ...operation.body,

                            email: EMAIL
                        }
                    );
                });


                test.each([

                    ['undefined', undefined],

                    ['null', null],

                    ['cadena vacía', ''],

                    ['espacios', '   ']

                ])('rechaza email obligatorio: %s', async (
                    description,
                    email
                ) => {

                    const response = await request(
                        operation.method,
                        operation.path,
                        {
                            ...operation.body,

                            email
                        }
                    );

                    expectBadRequest(
                        response,
                        'User email is required.'
                    );
                });


                test.each([

                    'invalid-email',

                    'user@',

                    '@example.com',

                    'user example@example.com'

                ])('rechaza un email inválido: %s', async email => {

                    const response = await request(
                        operation.method,
                        operation.path,
                        {
                            ...operation.body,

                            email
                        }
                    );

                    expectBadRequest(
                        response,
                        'User email is invalid.'
                    );
                });



                test.each([

                    ['número', 123, 'number'],

                    ['booleano', true, 'boolean'],

                    ['objeto', {}, 'object'],

                    ['arreglo', [EMAIL], 'array']

                ])('rechaza un email de tipo %s', async (
                    description,
                    email,
                    expectedType
                ) => {

                    const response = await request(
                        operation.method,
                        operation.path,
                        {
                            ...operation.body,

                            email
                        }
                    );

                    expectBadRequest(
                        response,
                        `Invalid input: expected string, received ${expectedType}`
                    );
                });

            }
        );
    });


    /*
     * =====================================================
     * CREATE USER MEDAL
     * =====================================================
     */

    describe('POST /insertar-usuario-medalla', () => {

        test('convierte el identificador de medalla a número', async () => {

            const response = await request(
                'POST',
                PATHS.createMedal,
                {
                    email: EMAIL,

                    medalla: '12'
                }
            );

            expectSuccess(
                response,
                [{ ok: 1 }]
            );

            expectOnlyController(
                'createOneUserMedalLeage',
                {
                    email: EMAIL,

                    medalla: 12
                }
            );
        });


        test.each([

            ['undefined', undefined],

            ['null', null],

            ['cero', 0],

            ['negativo', -1],

            ['decimal', 1.5],

            ['cadena inválida', 'invalid'],

            ['cadena vacía', '']

        ])('rechaza medalla inválida: %s', async (
            description,
            medalla
        ) => {

            const response = await request(
                'POST',
                PATHS.createMedal,
                {
                    email: EMAIL,

                    medalla
                }
            );

            expectBadRequest(response);
        });


        test('elimina propiedades desconocidas', async () => {

            const response = await request(
                'POST',
                PATHS.createMedal,
                {
                    email: EMAIL,

                    medalla: 12,

                    firebaseUid: 'unexpected-uid',

                    extra: 'unexpected'
                }
            );

            expectSuccess(
                response,
                [{ ok: 1 }]
            );

            expectOnlyController(
                'createOneUserMedalLeage',
                {
                    email: EMAIL,

                    medalla: 12
                }
            );
        });


        test('documenta la coerción de true a identificador 1', async () => {

            const response = await request(
                'POST',
                PATHS.createMedal,
                {
                    email: EMAIL,

                    medalla: true
                }
            );

            expectSuccess(
                response,
                [{ ok: 1 }]
            );

            expectOnlyController(
                'createOneUserMedalLeage',
                {
                    email: EMAIL,

                    medalla: 1
                }
            );
        });
    });


    /*
     * =====================================================
     * UPDATE USER MEDAL
     * =====================================================
     */

    describe('PATCH /actualizar-usuario-medalla', () => {

        test.each([

            [
                'cupcake',
                { cupcake: 5 }
            ],

            [
                'estado',
                { estado: 2 }
            ],

            [
                'valor true',
                { valor: true }
            ],

            [
                'valor false',
                { valor: false }
            ]

        ])('permite actualizar únicamente %s', async (
            description,
            changes
        ) => {

            const body = {

                email: EMAIL,

                ...changes
            };

            const response = await request(
                'PATCH',
                PATHS.updateMedal,
                body
            );

            expectSuccess(
                response,
                [{ ok: 2 }]
            );

            expectOnlyController(
                'patchOneUserMedalLeage',
                body
            );
        });


        test('rechaza una solicitud sin campos para actualizar', async () => {

            const response = await request(
                'PATCH',
                PATHS.updateMedal,
                {
                    email: EMAIL
                }
            );

            expectBadRequest(
                response,
                'At least one field to update is required.'
            );
        });


        test.each([

            ['cupcake', 0],

            ['cupcake', -1],

            ['cupcake', 1.5],

            ['cupcake', 'invalid'],

            ['estado', 0],

            ['estado', -1],

            ['estado', 1.5],

            ['estado', 'invalid']

        ])('rechaza %s con valor %p', async (
            field,
            value
        ) => {

            const response = await request(
                'PATCH',
                PATHS.updateMedal,
                {
                    email: EMAIL,

                    [field]: value
                }
            );

            expectBadRequest(response);
        });


        test('normaliza los identificadores numéricos', async () => {

            const response = await request(
                'PATCH',
                PATHS.updateMedal,
                {
                    email: EMAIL,

                    cupcake: '5',

                    estado: '2',

                    valor: false
                }
            );

            expectSuccess(
                response,
                [{ ok: 2 }]
            );

            expectOnlyController(
                'patchOneUserMedalLeage',
                {
                    email: EMAIL,

                    cupcake: 5,

                    estado: 2,

                    valor: false
                }
            );
        });


        test.each([

            ['false', 'false', true],

            ['true', 'true', true],

            ['cadena vacía', '', false],

            ['cero', 0, false],

            ['uno', 1, true],

            ['null', null, false]

        ])('documenta la coerción booleana de %s', async (
            description,
            value,
            expected
        ) => {

            const response = await request(
                'PATCH',
                PATHS.updateMedal,
                {
                    email: EMAIL,

                    valor: value
                }
            );

            expectSuccess(
                response,
                [{ ok: 2 }]
            );

            expectOnlyController(
                'patchOneUserMedalLeage',
                {
                    email: EMAIL,

                    valor: expected
                }
            );
        });


        test('elimina propiedades desconocidas antes de actualizar', async () => {

            const response = await request(
                'PATCH',
                PATHS.updateMedal,
                {
                    email: EMAIL,

                    valor: false,

                    extra: 'unexpected'
                }
            );

            expectSuccess(
                response,
                [{ ok: 2 }]
            );

            expectOnlyController(
                'patchOneUserMedalLeage',
                {
                    email: EMAIL,

                    valor: false
                }
            );
        });
    });


    /*
     * =====================================================
     * CREATE USER PACKAGE
     * =====================================================
     */

    describe('POST /insertar-usuario-paquete', () => {

        test('registra un paquete con todos los datos de pago', async () => {

            const body = {

                ...validPackage,

                paisCompra: 'PE',

                paymentProvider: 'test-provider',

                paymentProviderId: 'payment-test-001'
            };

            const response = await request(
                'POST',
                PATHS.createPackage,
                body
            );

            expectSuccess(
                response,
                [{ ok: 3 }]
            );

            expectOnlyController(
                'createOneUserPackage',
                body
            );
        });


        test('normaliza los datos de la compra', async () => {

            const response = await request(
                'POST',
                PATHS.createPackage,
                {
                    email: RAW_EMAIL,

                    paquete: '9',

                    moneda: ' pen ',

                    montoCentavos: '1590',

                    paisCompra: ' pe ',

                    paymentProvider: ' test-provider ',

                    paymentProviderId: ' payment-test-001 '
                }
            );

            expectSuccess(
                response,
                [{ ok: 3 }]
            );

            expectOnlyController(
                'createOneUserPackage',
                {
                    email: EMAIL,

                    paquete: 9,

                    moneda: 'PEN',

                    montoCentavos: 1590,

                    paisCompra: 'PE',

                    paymentProvider: 'test-provider',

                    paymentProviderId: 'payment-test-001'
                }
            );
        });


        test('permite un monto de cero centavos', async () => {

            const body = {

                ...validPackage,

                montoCentavos: 0
            };

            const response = await request(
                'POST',
                PATHS.createPackage,
                body
            );

            expectSuccess(
                response,
                [{ ok: 3 }]
            );

            expectOnlyController(
                'createOneUserPackage',
                body
            );
        });


        test.each([

            'paquete',

            'moneda',

            'montoCentavos'

        ])('rechaza la ausencia del campo %s', async field => {

            const body = {

                ...validPackage
            };

            delete body[field];

            const response = await request(
                'POST',
                PATHS.createPackage,
                body
            );

            expectBadRequest(response);
        });


        test.each([

            ['paquete', 0],

            ['paquete', -1],

            ['paquete', 1.5],

            ['paquete', 'invalid'],

            ['moneda', 'PE'],

            ['moneda', 'PENN'],

            ['moneda', '123'],

            ['moneda', ''],

            ['moneda', null],

            ['montoCentavos', -1],

            ['montoCentavos', 1.5],

            ['montoCentavos', 'invalid'],

            ['paisCompra', 'PER'],

            ['paisCompra', 'P'],

            ['paisCompra', '12'],

            ['paisCompra', null],

            ['paymentProvider', ''],

            ['paymentProvider', '   '],

            ['paymentProvider', 'a'.repeat(31)],

            ['paymentProvider', 123],

            ['paymentProviderId', ''],

            ['paymentProviderId', '   '],

            ['paymentProviderId', 'a'.repeat(101)],

            ['paymentProviderId', 123]

        ])('rechaza el campo %s con valor %p', async (
            field,
            value
        ) => {

            const response = await request(
                'POST',
                PATHS.createPackage,
                {
                    ...validPackage,

                    [field]: value
                }
            );

            expectBadRequest(response);
        });


        test('acepta las longitudes máximas de los identificadores de pago', async () => {

            const body = {

                ...validPackage,

                paymentProvider: 'a'.repeat(30),

                paymentProviderId: 'b'.repeat(100)
            };

            const response = await request(
                'POST',
                PATHS.createPackage,
                body
            );

            expectSuccess(
                response,
                [{ ok: 3 }]
            );

            expectOnlyController(
                'createOneUserPackage',
                body
            );
        });


        test('elimina propiedades ajenas a la compra', async () => {

            const response = await request(
                'POST',
                PATHS.createPackage,
                {
                    ...validPackage,

                    firebaseUid: 'unexpected-uid',

                    documentoLegalIds: [12, 35],

                    extra: 'unexpected'
                }
            );

            expectSuccess(
                response,
                [{ ok: 3 }]
            );

            expectOnlyController(
                'createOneUserPackage',
                validPackage
            );
        });


        test.each([

            ['null', null],

            ['false', false],

            ['cadena vacía', ''],

            ['espacios', '   ']

        ])('documenta la coerción del monto %s a cero', async (
            description,
            amount
        ) => {

            const response = await request(
                'POST',
                PATHS.createPackage,
                {
                    ...validPackage,

                    montoCentavos: amount
                }
            );

            expectSuccess(
                response,
                [{ ok: 3 }]
            );

            expectOnlyController(
                'createOneUserPackage',
                {
                    ...validPackage,

                    montoCentavos: 0
                }
            );
        });
    });


    /*
     * =====================================================
     * UPDATE USER PROFILE
     * =====================================================
     */

    describe('PATCH /actualizar-usuario', () => {

        test('normaliza el nombre, correo e identificador del avatar', async () => {

            const response = await request(
                'PATCH',
                PATHS.updateUser,
                {
                    email: RAW_EMAIL,

                    nombre: '  Ana    López  ',

                    avatarId: '2'
                }
            );

            expectSuccess(
                response,
                {
                    success: true
                }
            );

            expectOnlyController(
                'updateOneUser',
                validProfile
            );
        });


        test.each([

            ['longitud mínima', 'Al'],

            ['longitud máxima', 'a'.repeat(50)],

            ['acentos', 'José Álvarez'],

            ['nombre compuesto', 'María José']

        ])('acepta nombre válido: %s', async (
            description,
            nombre
        ) => {

            const body = {

                ...validProfile,

                nombre
            };

            const response = await request(
                'PATCH',
                PATHS.updateUser,
                body
            );

            expectSuccess(
                response,
                {
                    success: true
                }
            );

            expectOnlyController(
                'updateOneUser',
                body
            );
        });


        test.each([

            ['undefined', undefined],

            ['null', null],

            ['cadena vacía', ''],

            ['espacios', '   '],

            ['un carácter', 'A'],

            ['51 caracteres', 'a'.repeat(51)],

            ['número', 123],

            ['booleano', true],

            ['objeto', {}],

            ['arreglo', ['Ana']]

        ])('rechaza nombre inválido: %s', async (
            description,
            nombre
        ) => {

            const response = await request(
                'PATCH',
                PATHS.updateUser,
                {
                    ...validProfile,

                    nombre
                }
            );

            expectBadRequest(response);
        });


        test.each([

            ['undefined', undefined],

            ['null', null],

            ['cero', 0],

            ['negativo', -1],

            ['decimal', 1.5],

            ['cadena inválida', 'invalid'],

            ['cadena vacía', '']

        ])('rechaza avatarId inválido: %s', async (
            description,
            avatarId
        ) => {

            const response = await request(
                'PATCH',
                PATHS.updateUser,
                {
                    ...validProfile,

                    avatarId
                }
            );

            expectBadRequest(response);
        });


        test.each([

            ['firebaseUid', 'unexpected-uid'],

            ['pais', 'PER'],

            ['documentoLegalIds', [12, 35]],

            ['password', 'simulated-password'],

            ['tema', 'dark'],

            ['extra', true]

        ])('rechaza el campo adicional %s', async (
            field,
            value
        ) => {

            const response = await request(
                'PATCH',
                PATHS.updateUser,
                {
                    ...validProfile,

                    [field]: value
                }
            );

            expectBadRequest(response);
        });
    });


    /*
     * =====================================================
     * GET USER PREFERENCES
     * =====================================================
     */

    describe('POST /obtener-preferencias', () => {

        test('devuelve todas las preferencias recibidas del controlador', async () => {

            const response = await request(
                'POST',
                PATHS.getPreferences,
                {
                    email: EMAIL
                }
            );

            expectSuccess(
                response,
                preferencesResponse
            );

            expectOnlyController(
                'getUserPreferences',
                {
                    email: EMAIL
                }
            );
        });


        test.each([

            ['nombre', 'Ana'],

            ['firebaseUid', 'unexpected-uid'],

            ['tema', 'dark'],

            ['recordatorios', true],

            ['extra', 'unexpected']

        ])('rechaza el campo adicional %s', async (
            field,
            value
        ) => {

            const response = await request(
                'POST',
                PATHS.getPreferences,
                {
                    email: EMAIL,

                    [field]: value
                }
            );

            expectBadRequest(response);
        });


        test('no obtiene el email desde queryStringParameters', async () => {

            const response = await handler({

                httpMethod: 'POST',

                path: PATHS.getPreferences,

                queryStringParameters: {
                    email: EMAIL
                }
            });

            expectBadRequest(
                response,
                'User email is required.'
            );
        });
    });


    /*
     * =====================================================
     * UPDATE USER PREFERENCES
     * =====================================================
     */

    describe('PATCH /actualizar-preferencias', () => {

        const booleanPreferences = [

            'recordatorios',

            'mensajes',

            'promociones',

            'musica',

            'efectos_sonido',

            'vibracion'
        ];


        describe.each(booleanPreferences)(
            'Preferencia %s',
            preference => {

                test.each([true, false])(
                    'permite actualizar únicamente a %p',
                    async value => {

                        const body = {

                            email: EMAIL,

                            [preference]: value
                        };

                        const response = await request(
                            'PATCH',
                            PATHS.updatePreferences,
                            body
                        );

                        expectSuccess(
                            response,
                            {
                                success: true
                            }
                        );

                        expectOnlyController(
                            'updateUserPreferences',
                            body
                        );
                    }
                );


                test.each([

                    ['cadena true', 'true'],

                    ['cadena false', 'false'],

                    ['cero', 0],

                    ['uno', 1],

                    ['null', null],

                    ['objeto', {}],

                    ['arreglo', [true]]

                ])('rechaza un valor no booleano: %s', async (
                    description,
                    value
                ) => {

                    const response = await request(
                        'PATCH',
                        PATHS.updatePreferences,
                        {
                            email: EMAIL,

                            [preference]: value
                        }
                    );

                    expectBadRequest(response);
                });
            }
        );


        test.each([

            'system',

            'light',

            'dark'

        ])('permite actualizar únicamente el tema a %s', async tema => {

            const body = {

                email: EMAIL,

                tema
            };

            const response = await request(
                'PATCH',
                PATHS.updatePreferences,
                body
            );

            expectSuccess(
                response,
                {
                    success: true
                }
            );

            expectOnlyController(
                'updateUserPreferences',
                body
            );
        });


        test.each([

            ['cadena vacía', ''],

            ['tema desconocido', 'blue'],

            ['mayúsculas', 'DARK'],

            ['espacios', ' dark '],

            ['null', null],

            ['booleano', true],

            ['número', 1],

            ['objeto', {}]

        ])('rechaza tema inválido: %s', async (
            description,
            tema
        ) => {

            const response = await request(
                'PATCH',
                PATHS.updatePreferences,
                {
                    email: EMAIL,

                    tema
                }
            );

            expectBadRequest(response);
        });


        test('permite actualizar todas las preferencias a false', async () => {

            const body = {

                email: EMAIL,

                recordatorios: false,

                mensajes: false,

                promociones: false,

                musica: false,

                efectos_sonido: false,

                vibracion: false
            };

            const response = await request(
                'PATCH',
                PATHS.updatePreferences,
                body
            );

            expectSuccess(
                response,
                {
                    success: true
                }
            );

            expectOnlyController(
                'updateUserPreferences',
                body
            );
        });


        test('permite combinar cambios de tema y preferencias', async () => {

            const body = {

                email: EMAIL,

                musica: false,

                vibracion: true,

                tema: 'dark'
            };

            const response = await request(
                'PATCH',
                PATHS.updatePreferences,
                body
            );

            expectSuccess(
                response,
                {
                    success: true
                }
            );

            expectOnlyController(
                'updateUserPreferences',
                body
            );
        });


        test('rechaza una solicitud sin preferencias para actualizar', async () => {

            const response = await request(
                'PATCH',
                PATHS.updatePreferences,
                {
                    email: EMAIL
                }
            );

            expectBadRequest(
                response,
                'At least one preference to update is required.'
            );
        });


        test.each([

            ['nombre', 'Ana'],

            ['firebaseUid', 'unexpected-uid'],

            ['avatarId', 2],

            ['pais', 'PER'],

            ['documentoLegalIds', [12, 35]],

            ['extra', true]

        ])('rechaza el campo adicional %s', async (
            field,
            value
        ) => {

            const response = await request(
                'PATCH',
                PATHS.updatePreferences,
                {
                    email: EMAIL,

                    tema: 'dark',

                    [field]: value
                }
            );

            expectBadRequest(response);
        });


        test('rechaza toda la solicitud si una preferencia es inválida', async () => {

            const response = await request(
                'PATCH',
                PATHS.updatePreferences,
                {
                    email: EMAIL,

                    musica: true,

                    vibracion: false,

                    tema: 'invalid'
                }
            );

            expectBadRequest(response);
        });
    });


    /*
     * =====================================================
     * ACTIVE LEGAL DOCUMENTS
     * =====================================================
     */

    describe('GET /documentos-legales-vigentes', () => {

        test('permite consultar documentos sin autenticación', async () => {

            const response = await handler({

                httpMethod: 'GET',

                path: PATHS.legalDocuments
            });

            expectSuccess(
                response,
                legalDocumentsResponse
            );

            expectOnlyController(
                'getActiveLegalDocuments'
            );
        });


        test('devuelve un arreglo vacío cuando el controlador no devuelve documentos', async () => {

            Ctrl.getActiveLegalDocuments
                .mockResolvedValue([]);

            const response = await request(
                'GET',
                PATHS.legalDocuments
            );

            expectSuccess(
                response,
                []
            );

            expectOnlyController(
                'getActiveLegalDocuments'
            );
        });


        test('conserva los identificadores y el orden de los documentos', async () => {

            const documents = [

                { id: 35 },

                { id: 12 },

                { id: 48 }
            ];

            Ctrl.getActiveLegalDocuments
                .mockResolvedValue(documents);

            const response = await request(
                'GET',
                PATHS.legalDocuments
            );

            expectSuccess(
                response,
                documents
            );

            expectOnlyController(
                'getActiveLegalDocuments'
            );
        });


        test('no requiere aceptar documentos para consultar los vigentes', async () => {

            const response = await request(
                'GET',
                PATHS.legalDocuments,
                {
                    documentoLegalIds: []
                }
            );

            expectSuccess(
                response,
                legalDocumentsResponse
            );

            expectOnlyController(
                'getActiveLegalDocuments'
            );
        });


        test('no transmite información de identidad al controlador público', async () => {

            const response = await handler({

                httpMethod: 'GET',

                path: PATHS.legalDocuments,

                headers: {
                    Authorization: 'Bearer simulated-token'
                },

                queryStringParameters: {
                    email: EMAIL,

                    firebaseUid: 'simulated-uid'
                },

                body: JSON.stringify({
                    email: EMAIL
                })
            });

            expectSuccess(
                response,
                legalDocumentsResponse
            );

            expectOnlyController(
                'getActiveLegalDocuments'
            );
        });
    });


    /*
     * =====================================================
     * PASSWORD RESET
     * =====================================================
     */

    describe('POST /recuperar-contrasena', () => {

        test('procesa una solicitud válida de recuperación', async () => {

            const response = await request(
                'POST',
                PATHS.resetPassword,
                {
                    email: EMAIL
                }
            );

            expectSuccess(
                response,
                passwordResetResponse
            );

            expectOnlyController(
                'sendPasswordResetEmail',
                {
                    email: EMAIL
                }
            );
        });


        test.each([

            ['password', 'simulated-password'],

            ['newPassword', 'simulated-new-password'],

            ['resetLink', 'https://example.com/reset'],

            ['idToken', 'simulated-token'],

            ['firebaseUid', 'simulated-uid'],

            ['nombre', 'Ana'],

            ['extra', true]

        ])('rechaza el campo adicional %s', async (
            field,
            value
        ) => {

            const response = await request(
                'POST',
                PATHS.resetPassword,
                {
                    email: EMAIL,

                    [field]: value
                }
            );

            expectBadRequest(response);
        });


        test('propaga el error de correo no registrado recibido del controlador', async () => {

            Ctrl.sendPasswordResetEmail
                .mockRejectedValue({

                    statusCode: 404,

                    message:
                        'Este correo no se encuentra registrado'
                });

            const response = await request(
                'POST',
                PATHS.resetPassword,
                {
                    email: EMAIL
                }
            );

            expectResponse(
                response,
                404,
                {
                    message:
                        'Este correo no se encuentra registrado'
                }
            );

            expectOnlyController(
                'sendPasswordResetEmail',
                {
                    email: EMAIL
                }
            );
        });


        test('no invoca el controlador cuando el email es inválido', async () => {

            const response = await request(
                'POST',
                PATHS.resetPassword,
                {
                    email: 'invalid-email'
                }
            );

            expectBadRequest(
                response,
                'User email is invalid.'
            );

            expect(
                Ctrl.sendPasswordResetEmail
            ).not.toHaveBeenCalled();
        });
    });


    /*
     * =====================================================
     * REQUEST BODY VALIDATION
     * =====================================================
     */

    describe('Validación del cuerpo HTTP', () => {

        describe.each(emailOperations)(
            '$method $path',
            operation => {

                test('rechaza un body ausente', async () => {

                    const response = await request(
                        operation.method,
                        operation.path
                    );

                    expectBadRequest(response);
                });


                test('rechaza un body vacío', async () => {

                    const response = await request(
                        operation.method,
                        operation.path,
                        {}
                    );

                    expectBadRequest(response);
                });


                test('rechaza un JSON mal formado', async () => {

                    const event = ev(
                        `/usuarios${operation.path}`,
                        operation.method
                    );

                    event.body = '{invalid-json';

                    const response =
                        await handler(event);

                    expectBadRequest(
                        response,
                        'JSON inválido'
                    );
                });


                test.each([

                    ['null', 'null'],

                    ['booleano', 'true'],

                    ['número', '123'],

                    ['cadena', '"invalid"'],

                    ['arreglo', '[]']

                ])('rechaza un JSON de tipo %s', async (
                    description,
                    body
                ) => {

                    const event = ev(
                        `/usuarios${operation.path}`,
                        operation.method
                    );

                    event.body = body;

                    const response =
                        await handler(event);

                    expectBadRequest(response);
                });
            }
        );
    });


    /*
     * =====================================================
     * CONTROLLER ERRORS
     * =====================================================
     */

    describe('Propagación de errores del controlador', () => {

        const controlledErrors = [

            [
                400,
                'Invalid operation'
            ],

            [
                401,
                'Unauthorized'
            ],

            [
                403,
                'Forbidden'
            ],

            [
                404,
                'Resource not found'
            ],

            [
                409,
                'Resource conflict'
            ],

            [
                500,
                'Internal error'
            ],

            [
                503,
                'Service unavailable'
            ]
        ];


        describe.each(operations)(
            '$method $path',
            operation => {

                test.each(controlledErrors)(
                    'propaga HTTP %i con mensaje %s',
                    async (
                        statusCode,
                        message
                    ) => {

                        const error = {

                            statusCode,

                            message
                        };

                        Ctrl[operation.controller]
                            .mockRejectedValue(error);

                        const response = await request(
                            operation.method,
                            operation.path,
                            operation.body
                        );

                        expectResponse(
                            response,
                            statusCode,
                            {
                                message
                            }
                        );

                        if (
                            operation.body === undefined
                        ) {

                            expectOnlyController(
                                operation.controller
                            );

                        } else {

                            expectOnlyController(
                                operation.controller,
                                operation.body
                            );
                        }

                        expect(errorSpy)
                            .toHaveBeenCalledWith(error);
                    }
                );


                test('controla una excepción inesperada', async () => {

                    const error = new Error(
                        'Unexpected controller error'
                    );

                    Ctrl[operation.controller]
                        .mockRejectedValue(error);

                    const response = await request(
                        operation.method,
                        operation.path,
                        operation.body
                    );

                    expectResponse(
                        response,
                        500,
                        {
                            message: error.message
                        }
                    );

                    expect(errorSpy)
                        .toHaveBeenCalledWith(error);
                });


                test('utiliza un mensaje genérico cuando no existe message', async () => {

                    Ctrl[operation.controller]
                        .mockRejectedValue({
                            statusCode: 500
                        });

                    const response = await request(
                        operation.method,
                        operation.path,
                        operation.body
                    );

                    expectResponse(
                        response,
                        500,
                        {
                            message:
                                'Error interno del servidor'
                        }
                    );
                });


                test('no devuelve propiedades adicionales del error', async () => {

                    Ctrl[operation.controller]
                        .mockRejectedValue({

                            statusCode: 409,

                            message: 'Simulated conflict',

                            code: 'SIMULATED_ERROR',

                            detail: 'Internal detail',

                            stack: 'Internal stack'
                        });

                    const response = await request(
                        operation.method,
                        operation.path,
                        operation.body
                    );

                    expectResponse(
                        response,
                        409,
                        {
                            message: 'Simulated conflict'
                        }
                    );
                });
            }
        );
    });


    /*
     * =====================================================
     * SEPARATION OF RESPONSIBILITIES
     * =====================================================
     */

    describe('Separación de operaciones autenticadas', () => {

        test.each([

            [
                'POST',
                '/insertar-usuario-nuevo'
            ],

            [
                'POST',
                '/consultar-aceptaciones-legales'
            ],

            [
                'POST',
                '/registrar-aceptaciones-legales'
            ]

        ])('no procesa la operación trasladada %s %s', async (
            method,
            path
        ) => {

            const response = await request(
                method,
                path,
                {
                    email: EMAIL,

                    firebaseUid: 'simulated-uid',

                    documentoLegalIds: [12, 35]
                }
            );

            expectCurrentNotFound(
                response,
                method,
                path
            );
        });


        test('no registra usuarios durante la actualización del perfil', async () => {

            const response = await request(
                'PATCH',
                PATHS.updateUser,
                validProfile
            );

            expectSuccess(
                response,
                {
                    success: true
                }
            );

            expectOnlyController(
                'updateOneUser',
                validProfile
            );

            expect(Ctrl.createOneUser)
                .not.toHaveBeenCalled();

            expect(Ctrl.googleAuthUser)
                .not.toHaveBeenCalled();
        });


        test('no registra aceptaciones durante la consulta pública de documentos', async () => {

            const response = await request(
                'GET',
                PATHS.legalDocuments
            );

            expectSuccess(
                response,
                legalDocumentsResponse
            );

            expectOnlyController(
                'getActiveLegalDocuments'
            );

            expect(Ctrl.registerLegalAcceptances)
                .not.toHaveBeenCalled();

            expect(Ctrl.getPendingLegalAcceptances)
                .not.toHaveBeenCalled();
        });


        test('no crea una cuenta durante la recuperación de contraseña', async () => {

            const response = await request(
                'POST',
                PATHS.resetPassword,
                {
                    email: EMAIL
                }
            );

            expectSuccess(
                response,
                passwordResetResponse
            );

            expectOnlyController(
                'sendPasswordResetEmail',
                {
                    email: EMAIL
                }
            );

            expect(Ctrl.createOneUser)
                .not.toHaveBeenCalled();

            expect(Ctrl.googleAuthUser)
                .not.toHaveBeenCalled();
        });
    });


    /*
     * =====================================================
     * API GATEWAY INTEGRATION CONTRACT
     * =====================================================
     */

    describe('Compatibilidad con eventos de API Gateway', () => {

        test.each(operations)(
            'procesa el evento REST API: $method $path',
            async operation => {

                const response = await handler({

                    httpMethod: operation.method,

                    path:
                        `/local/cupcakeslife/usuarios${operation.path}`,

                    requestContext: {
                        stage: 'local'
                    },

                    body:
                        operation.body === undefined
                            ? null
                            : JSON.stringify(
                                operation.body
                            )
                });

                expectSuccess(
                    response,
                    operation.response
                );
            }
        );


        test.each(operations)(
            'procesa el evento HTTP API v2: $method $path',
            async operation => {

                const response = await handler({

                    version: '2.0',

                    rawPath:
                        `/local/cupcakeslife/usuarios${operation.path}`,

                    requestContext: {

                        stage: 'local',

                        http: {
                            method: operation.method
                        }
                    },

                    body:
                        operation.body === undefined
                            ? undefined
                            : JSON.stringify(
                                operation.body
                            )
                });

                expectSuccess(
                    response,
                    operation.response
                );
            }
        );


        beforeEach(() => {

            process.env.ENDPOINT_ROOT =
                'cupcakeslife';
        });
    });


    /*
     * =====================================================
     * CONCURRENT REQUESTS
     * =====================================================
     */

    describe('Independencia de solicitudes', () => {

        test('normaliza independientemente los correos de dos solicitudes concurrentes', async () => {

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

                request(
                    'POST',
                    PATHS.getPreferences,
                    {
                        email: ' FIRST@EXAMPLE.COM '
                    }
                ),

                request(
                    'POST',
                    PATHS.getPreferences,
                    {
                        email: ' SECOND@EXAMPLE.COM '
                    }
                )
            ]);

            expectSuccess(
                firstResponse,
                {
                    email: 'first@example.com'
                }
            );

            expectSuccess(
                secondResponse,
                {
                    email: 'second@example.com'
                }
            );

            expect(Ctrl.getUserPreferences)
                .toHaveBeenCalledTimes(2);
        });


        test('una solicitud inválida no impide procesar otra válida', async () => {

            const [
                validResponse,
                invalidResponse
            ] = await Promise.all([

                request(
                    'PATCH',
                    PATHS.updatePreferences,
                    {
                        email: EMAIL,

                        tema: 'dark'
                    }
                ),

                request(
                    'PATCH',
                    PATHS.updatePreferences,
                    {
                        email: EMAIL,

                        tema: 'invalid'
                    }
                )
            ]);

            expectSuccess(
                validResponse,
                {
                    success: true
                }
            );


            expect(invalidResponse.statusCode)
                .toBe(400);

            expect(JSON.parse(invalidResponse.body))
                .toEqual({
                    message: expect.any(String)
                });


            expect(
                Ctrl.updateUserPreferences
            ).toHaveBeenCalledTimes(1);

            expect(
                Ctrl.updateUserPreferences
            ).toHaveBeenCalledWith({
                email: EMAIL,

                tema: 'dark'
            });
        });


        test('un error anterior no afecta una solicitud posterior', async () => {

            Ctrl.getUserPreferences
                .mockRejectedValueOnce({

                    statusCode: 503,

                    message: 'Service unavailable'
                });

            const firstResponse = await request(
                'POST',
                PATHS.getPreferences,
                {
                    email: EMAIL
                }
            );

            const secondResponse = await request(
                'POST',
                PATHS.getPreferences,
                {
                    email: EMAIL
                }
            );

            expectResponse(
                firstResponse,
                503,
                {
                    message: 'Service unavailable'
                }
            );

            expectSuccess(
                secondResponse,
                preferencesResponse
            );

            expect(Ctrl.getUserPreferences)
                .toHaveBeenCalledTimes(2);
        });
    });
});