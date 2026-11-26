// playwright-api/user.api.spec.js

const { test, expect } = require('@playwright/test');
const { secureGet, securePost } = require('./utils/secure-request');

test.use({ trace: 'off' });

async function readJson(response) {
    try { return await response.json(); }
    catch { throw new Error('La respuesta HTTP no contiene JSON válido.'); }
}

function hasExactKeys(body, keys) {
    return body !== null && typeof body === 'object' && !Array.isArray(body) &&
        Object.keys(body).length === keys.length &&
        keys.every(key => Object.prototype.hasOwnProperty.call(body, key));
}

const {
    baseURL,
    environment
} = require('./config/environments');


const GOOGLE_AUTH_URL =
    `${baseURL}usuarios/google-auth`;

const LEGAL_DOCUMENTS_URL =
    `${baseURL}usuarios/documentos-legales-vigentes`;


const GOOGLE_TOKEN =
    process.env.TEST_GOOGLE_ID_TOKEN;

const GOOGLE_ACCOUNT_STATE =
    process.env.TEST_GOOGLE_ACCOUNT_STATE;

const GOOGLE_EMAIL =
    process.env.TEST_GOOGLE_EMAIL;

const NON_GOOGLE_TOKEN =
    process.env.TEST_NON_GOOGLE_ID_TOKEN;

const EXPIRED_GOOGLE_TOKEN =
    process.env.TEST_EXPIRED_GOOGLE_ID_TOKEN;

const REVOKED_GOOGLE_TOKEN =
    process.env.TEST_REVOKED_GOOGLE_ID_TOKEN;


const ALLOW_REGISTRATION =
    process.env.TEST_ALLOW_GOOGLE_REGISTRATION === 'true';

const ALLOW_DEV_REGISTRATION =
    process.env.TEST_ALLOW_DEV_REGISTRATION === 'true';


const INVALID_TOKEN =
    'invalid-token-123456789012345';


const REQUIRED_DOCUMENT_TYPES = [

    'terminos_condiciones',

    'politica_privacidad'
];


const VALID_LOGIN_BODY = {

    idToken: INVALID_TOKEN,

    action: 'login'
};


const VALID_REGISTER_BODY = {

    idToken: INVALID_TOKEN,

    action: 'register',

    nombre: 'QA Google',

    documentoLegalIds: [1, 2]
};


/*
 * Los identificadores [1, 2] se utilizan únicamente
 * en escenarios que deben fallar antes de consultar
 * la base de datos.
 *
 * Los escenarios autenticados consultan siempre
 * los documentos legales vigentes.
 */


/*
 * =========================================================
 * RESPONSE HELPERS
 * =========================================================
 */

async function expectErrorResponse(
    response,
    statusCode,
    expectedMessage
) {

    expect(response.status())
        .toBe(statusCode);

    const body = await readJson(response);

    expect(hasExactKeys(body, ['message']) &&
        typeof body.message === 'string' && body.message.trim().length > 0,
        'Contrato de error inválido').toBe(true);
    if (expectedMessage !== undefined) {
        expect(body.message === expectedMessage, 'Mensaje de error inesperado').toBe(true);
    }

    return body;
}


async function expectGoogleSuccess(
    response,
    action,
    expectedEmail = GOOGLE_EMAIL
) {

    expect(response.status())
        .toBe(200);

    const body = await readJson(response);

    expect(hasExactKeys(body, ['success', 'action', 'email']) &&
        body.success === true && body.action === action && typeof body.email === 'string',
        'Contrato de autenticación inválido').toBe(true);
    expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email), 'Correo inválido').toBe(true);
    expect(body.email === body.email.trim().toLowerCase(), 'Correo no normalizado').toBe(true);
    if (expectedEmail) {
        expect(body.email === expectedEmail.trim().toLowerCase(), 'Identidad inesperada').toBe(true);
    }

    return body;
}


/*
 * =========================================================
 * REQUEST HELPERS
 * =========================================================
 */

async function googleAuth(
    request,
    data
) {

    return securePost(request,
        GOOGLE_AUTH_URL,
        {
            data
        }
    );
}


async function expectBadRequest(
    request,
    data,
    expectedMessage
) {

    const response = await googleAuth(
        request,
        data
    );

    return expectErrorResponse(
        response,
        400,
        expectedMessage
    );
}


async function expectInvalidToken(
    request,
    data
) {

    const response = await googleAuth(
        request,
        data
    );

    return expectErrorResponse(
        response,
        401,
        'Token de Firebase inválido o expirado'
    );
}


/*
 * =========================================================
 * LEGAL DOCUMENT HELPERS
 * =========================================================
 */

async function getActiveLegalDocuments(request) {

    const response = await secureGet(request,
        LEGAL_DOCUMENTS_URL
    );

    expect(response.status())
        .toBe(200);

    const body = await readJson(response);

    expect(hasExactKeys(body, ['success', 'documentos']) &&
        body.success === true && Array.isArray(body.documentos),
        'Contrato de documentos inválido').toBe(true);
    expect(body.documentos.length).toBe(2);

    const documentIds = [];

    const documentTypes = [];

    for (const document of body.documentos) {

        expect(document !== null && typeof document === 'object' &&
            typeof document.documento_legal_id === 'number' &&
            typeof document.tipo === 'string' && document.version != null &&
            typeof document.url === 'string' && document.vigente === true,
            'Documento legal inválido').toBe(true);

        expect(
            Number.isSafeInteger(
                document.documento_legal_id
            )
        ).toBe(true);

        expect(document.documento_legal_id > 0).toBe(true);

        expect(document.url.trim().length)
            .toBeGreaterThan(0);

        documentIds.push(
            document.documento_legal_id
        );

        documentTypes.push(
            document.tipo
        );
    }

    expect(new Set(documentIds).size)
        .toBe(2);

    expect(REQUIRED_DOCUMENT_TYPES.every(type => documentTypes.includes(type)),
        'Tipos de documentos inesperados').toBe(true);

    return body.documentos;
}


async function getActiveLegalDocumentIds(request) {

    const documents =
        await getActiveLegalDocuments(request);

    return documents.map(
        document => document.documento_legal_id
    );
}


/*
 * Genera identificadores positivos distintos
 * de los documentos actualmente vigentes.
 *
 * No requiere insertar ni modificar documentos.
 */
function getNonActiveDocumentIds(activeIds) {

    const result = [];

    let candidate = 1;

    while (result.length < 2) {

        if (!activeIds.includes(candidate)) {

            result.push(candidate);
        }

        candidate += 1;
    }

    return result;
}


/*
 * =========================================================
 * EXECUTION GUARDS
 * =========================================================
 */

function requireRegisteredAccount() {

    test.skip(
        !GOOGLE_TOKEN ||
        GOOGLE_ACCOUNT_STATE !== 'registered',

        'Requiere una cuenta Google de pruebas registrada'
    );
}


function requireUnregisteredAccount() {

    test.skip(
        !GOOGLE_TOKEN ||
        GOOGLE_ACCOUNT_STATE !== 'unregistered',

        'Requiere una cuenta Google de pruebas no registrada'
    );
}


function requireRegistrationPermission() {

    requireUnregisteredAccount();

    test.skip(
        !ALLOW_REGISTRATION,

        'El registro requiere autorización explícita'
    );

    test.skip(
        environment !== 'local' &&
        environment !== 'dev',

        'Entorno no autorizado para registrar usuarios'
    );

    test.skip(
        environment === 'dev' &&
        !ALLOW_DEV_REGISTRATION,

        'El registro en DEV requiere autorización adicional'
    );
}


/*
 * =========================================================
 * API - GOOGLE AUTH
 * =========================================================
 */

test.describe('API - Google Auth', () => {

    /*
     * Evita incorporar los tokens reales como parte
     * de los títulos de las pruebas.
     *
     * Desactiva las trazas para reducir la exposición
     * de credenciales en los artefactos de Playwright.
     */



    /*
     * =====================================================
     * ORIGINAL TESTS WITHOUT DATABASE MUTATIONS
     * =====================================================
     */

    test.describe('Casos originales sin mutaciones', () => {

        test('token ausente: 400', async ({ request }) => {

            await expectBadRequest(
                request,
                {
                    action: 'login'
                }
            );
        });


        test('operación inválida: 400', async ({ request }) => {

            await expectBadRequest(
                request,
                {
                    idToken:
                        'test-token-123456789012345',

                    action: 'delete'
                }
            );
        });


        test('token malformado: 401', async ({ request }) => {

            await expectInvalidToken(
                request,
                VALID_LOGIN_BODY
            );
        });
    });


    /*
     * =====================================================
     * REQUEST BODY VALIDATION
     * =====================================================
     */

    test.describe('Validación del cuerpo HTTP', () => {

        test('solicitud sin body: 400', async ({ request }) => {

            const response = await securePost(request,
                GOOGLE_AUTH_URL
            );

            await expectErrorResponse(
                response,
                400
            );
        });


        test('objeto vacío: 400', async ({ request }) => {

            await expectBadRequest(
                request,
                {}
            );
        });


        const invalidBodies = [

            {
                description: 'JSON incompleto',

                body: '{"idToken":'
            },

            {
                description: 'JSON con coma final',

                body: '{"action":"login",}'
            },

            {
                description: 'JSON inválido',

                body: '{invalid-json'
            },

            {
                description: 'JSON con espacios',

                body: '   '
            }
        ];


        for (const scenario of invalidBodies) {

            test(
                `${scenario.description}: 400`,
                async ({ request }) => {

                    const response = await securePost(request,
                        GOOGLE_AUTH_URL,
                        {
                            headers: {

                                'Content-Type':
                                    'application/json'
                            },

                            data: scenario.body
                        }
                    );

                    await expectErrorResponse(
                        response,
                        400,
                        'JSON inválido'
                    );
                }
            );
        }


        const nonObjectBodies = [

            {
                description: 'null',

                body: 'null'
            },

            {
                description: 'arreglo',

                body: '[]'
            },

            {
                description: 'booleano',

                body: 'true'
            },

            {
                description: 'número',

                body: '123'
            },

            {
                description: 'cadena',

                body: '"login"'
            }
        ];


        for (const scenario of nonObjectBodies) {

            test(
                `Body de tipo ${scenario.description}: 400`,
                async ({ request }) => {

                    const response = await securePost(request,
                        GOOGLE_AUTH_URL,
                        {
                            headers: {

                                'Content-Type':
                                    'application/json'
                            },

                            data: scenario.body
                        }
                    );

                    await expectErrorResponse(
                        response,
                        400
                    );
                }
            );
        }
    });


    /*
     * =====================================================
     * ACTION VALIDATION
     * =====================================================
     */

    test.describe('Validación de action', () => {

        const invalidActions = [

            ['ausente', undefined],

            ['null', null],

            ['cadena vacía', ''],

            ['espacios', '   '],

            ['LOGIN', 'LOGIN'],

            ['REGISTER', 'REGISTER'],

            ['login con espacios', ' login '],

            ['register con espacios', ' register '],

            ['update', 'update'],

            ['logout', 'logout'],

            ['número', 1],

            ['booleano', true],

            ['objeto', {}],

            ['arreglo', ['login']]
        ];


        for (const [
            description,
            action
        ] of invalidActions) {

            test(
                `Action ${description}: 400`,
                async ({ request }) => {

                    await expectBadRequest(
                        request,
                        {
                            idToken: INVALID_TOKEN,

                            action
                        }
                    );
                }
            );
        }
    });


    /*
     * =====================================================
     * TOKEN SCHEMA VALIDATION
     * =====================================================
     */

    test.describe('Validación estructural de idToken', () => {

        const invalidTokens = [

            ['ausente', undefined],

            ['null', null],

            ['cadena vacía', ''],

            ['un carácter', 'a'],

            ['19 caracteres', 'a'.repeat(19)],

            ['número', 123],

            ['booleano', true],

            ['objeto', {}],

            ['arreglo', ['invalid-token']]
        ];


        for (const action of ['login', 'register']) {

            for (const [
                description,
                idToken
            ] of invalidTokens) {

                test(
                    `${action}: token ${description} -> 400`,
                    async ({ request }) => {

                        const baseBody =
                            action === 'register'
                                ? VALID_REGISTER_BODY
                                : VALID_LOGIN_BODY;

                        await expectBadRequest(
                            request,
                            {
                                ...baseBody,

                                idToken
                            }
                        );
                    }
                );
            }
        }


        for (const action of ['login', 'register']) {

            test(
                `${action}: token de 20 caracteres supera el esquema pero falla Firebase`,
                async ({ request }) => {

                    const baseBody =
                        action === 'register'
                            ? VALID_REGISTER_BODY
                            : VALID_LOGIN_BODY;

                    await expectInvalidToken(
                        request,
                        {
                            ...baseBody,

                            idToken: 'a'.repeat(20)
                        }
                    );
                }
            );


            test(
                `${action}: token compuesto por 20 espacios -> 401`,
                async ({ request }) => {

                    const baseBody =
                        action === 'register'
                            ? VALID_REGISTER_BODY
                            : VALID_LOGIN_BODY;

                    await expectInvalidToken(
                        request,
                        {
                            ...baseBody,

                            idToken: ' '.repeat(20)
                        }
                    );
                }
            );
        }
    });


    /*
     * =====================================================
     * NAME VALIDATION
     * =====================================================
     */

    test.describe('Validación del nombre opcional', () => {

        const invalidNames = [

            ['null', null],

            ['número', 123],

            ['booleano', true],

            ['objeto', {}],

            ['arreglo', ['QA Google']],

            ['51 caracteres', 'a'.repeat(51)]
        ];


        const validNames = [

            ['ausente', undefined],

            ['cadena vacía', ''],

            ['espacios', '   '],

            ['un carácter', 'A'],

            ['50 caracteres', 'a'.repeat(50)],

            ['nombre con acentos', 'José Álvarez'],

            ['espacios exteriores', '  QA Google  ']
        ];


        for (const action of ['login', 'register']) {

            const baseBody =
                action === 'register'
                    ? VALID_REGISTER_BODY
                    : VALID_LOGIN_BODY;


            for (const [
                description,
                nombre
            ] of invalidNames) {

                test(
                    `${action}: nombre ${description} -> 400`,
                    async ({ request }) => {

                        await expectBadRequest(
                            request,
                            {
                                ...baseBody,

                                nombre
                            }
                        );
                    }
                );
            }


            for (const [
                description,
                nombre
            ] of validNames) {

                test(
                    `${action}: nombre ${description} supera el esquema`,
                    async ({ request }) => {

                        await expectInvalidToken(
                            request,
                            {
                                ...baseBody,

                                nombre
                            }
                        );
                    }
                );
            }
        }
    });


    /*
     * =====================================================
     * REGISTRATION LEGAL DOCUMENT VALIDATION
     * =====================================================
     */

    test.describe('Validación de documentos legales durante el registro', () => {

        const invalidDocuments = [

            ['ausentes', undefined],

            ['null', null],

            ['arreglo vacío', []],

            ['un documento', [1]],

            ['tres documentos', [1, 2, 3]],

            ['duplicados', [1, 1]],

            ['identificador cero', [0, 2]],

            ['identificador negativo', [-1, 2]],

            ['identificador decimal', [1.5, 2]],

            ['identificadores string', ['1', '2']],

            ['identificador booleano', [true, 2]],

            ['identificador null', [null, 2]],

            ['identificador objeto', [{}, 2]],

            ['identificador arreglo', [[1], 2]],

            ['cadena', '1,2'],

            ['número', 12],

            ['objeto', { first: 1, second: 2 }],

            ['booleano', true]
        ];


        for (const [
            description,
            documentoLegalIds
        ] of invalidDocuments) {

            test(
                `Registro con documentos ${description}: 400`,
                async ({ request }) => {

                    await expectBadRequest(
                        request,
                        {
                            ...VALID_REGISTER_BODY,

                            documentoLegalIds
                        }
                    );
                }
            );
        }


        test('devuelve el mensaje específico para un documento faltante', async ({ request }) => {

            await expectBadRequest(
                request,
                {
                    ...VALID_REGISTER_BODY,

                    documentoLegalIds: [1]
                },
                'Debe aceptar los dos documentos legales obligatorios'
            );
        });


        test('devuelve el mensaje específico para documentos duplicados', async ({ request }) => {

            await expectBadRequest(
                request,
                {
                    ...VALID_REGISTER_BODY,

                    documentoLegalIds: [1, 1]
                },
                'Los documentos legales no pueden estar duplicados'
            );
        });


        test('dos identificadores válidos superan el esquema', async ({ request }) => {

            await expectInvalidToken(
                request,
                VALID_REGISTER_BODY
            );
        });


        test('el esquema permite invertir el orden de los identificadores', async ({ request }) => {

            await expectInvalidToken(
                request,
                {
                    ...VALID_REGISTER_BODY,

                    documentoLegalIds: [2, 1]
                }
            );
        });
    });


    /*
     * =====================================================
     * LOGIN MUST NOT ACCEPT LEGAL DOCUMENTS
     * =====================================================
     */

    test.describe('Separación de login y registro', () => {

        const invalidLoginDocuments = [

            ['arreglo vacío', []],

            ['un documento', [1]],

            ['dos documentos', [1, 2]],

            ['null', null],

            ['cadena', '1,2']
        ];


        for (const [
            description,
            documentoLegalIds
        ] of invalidLoginDocuments) {

            test(
                `Login con documentos ${description}: 400`,
                async ({ request }) => {

                    await expectBadRequest(
                        request,
                        {
                            ...VALID_LOGIN_BODY,

                            documentoLegalIds
                        }
                    );
                }
            );
        }
    });


    /*
     * =====================================================
     * IDENTITY INJECTION PROTECTION
     * =====================================================
     */

    test.describe('Rechazo de identidad proporcionada por el cliente', () => {

        const additionalFields = [

            ['email', 'qa@example.com'],

            ['firebaseUid', 'unexpected-uid'],

            ['uid', 'unexpected-uid'],

            ['usuarioId', 123],

            ['usuario_id', 123],

            ['provider', 'google.com'],

            ['email_verified', true],

            ['password', 'simulated-password'],

            ['pais', 'PER'],

            ['role', 'admin'],

            ['success', true],

            ['extra', 'unexpected']
        ];


        for (const action of ['login', 'register']) {

            const baseBody =
                action === 'register'
                    ? VALID_REGISTER_BODY
                    : VALID_LOGIN_BODY;


            for (const [
                field,
                value
            ] of additionalFields) {

                test(
                    `${action}: rechaza el campo ${field}`,
                    async ({ request }) => {

                        await expectBadRequest(
                            request,
                            {
                                ...baseBody,

                                [field]: value
                            }
                        );
                    }
                );
            }
        }
    });


    /*
     * =====================================================
     * FIREBASE AUTHENTICATION FAILURES
     * =====================================================
     */

    test.describe('Rechazos de autenticación Firebase', () => {

        const malformedTokens = [

            [
                'cadena arbitraria',

                'not-a-valid-firebase-token'
            ],

            [
                'estructura JWT inválida',

                'invalid-header.invalid-payload.invalid-signature'
            ],

            [
                'JWT sin firma válida',

                'eyJhbGciOiJub25lIn0.eyJzdWIiOiJxYSJ9.'
            ],

            [
                'token con prefijo Bearer',

                `Bearer ${INVALID_TOKEN}`
            ]
        ];


        for (const action of ['login', 'register']) {

            const baseBody =
                action === 'register'
                    ? VALID_REGISTER_BODY
                    : VALID_LOGIN_BODY;


            for (const [
                description,
                idToken
            ] of malformedTokens) {

                test(
                    `${action}: ${description} -> 401`,
                    async ({ request }) => {

                        await expectInvalidToken(
                            request,
                            {
                                ...baseBody,

                                idToken
                            }
                        );
                    }
                );
            }


            test(
                `${action}: token Firebase expirado -> 401`,
                async ({ request }) => {

                    test.skip(
                        !EXPIRED_GOOGLE_TOKEN,

                        'Requiere un token Firebase expirado'
                    );

                    await expectInvalidToken(
                        request,
                        {
                            ...baseBody,

                            idToken:
                                EXPIRED_GOOGLE_TOKEN
                        }
                    );
                }
            );


            test(
                `${action}: token Firebase revocado -> 401`,
                async ({ request }) => {

                    test.skip(
                        !REVOKED_GOOGLE_TOKEN,

                        'Requiere un token Firebase revocado'
                    );

                    await expectInvalidToken(
                        request,
                        {
                            ...baseBody,

                            idToken:
                                REVOKED_GOOGLE_TOKEN
                        }
                    );
                }
            );


            test(
                `${action}: proveedor distinto de Google -> 403`,
                async ({ request }) => {

                    test.skip(
                        !NON_GOOGLE_TOKEN,

                        'Requiere un token Firebase válido de otro proveedor'
                    );

                    const response = await googleAuth(
                        request,
                        {
                            ...baseBody,

                            idToken:
                                NON_GOOGLE_TOKEN
                        }
                    );

                    await expectErrorResponse(
                        response,
                        403,
                        'Se requiere una cuenta de Google verificada'
                    );
                }
            );
        }
    });


    /*
     * =====================================================
     * AUTHENTICATED SCENARIOS
     * =====================================================
     *
     * Se ejecutan secuencialmente porque utilizan
     * una cuenta compartida cuyo estado puede cambiar.
     *
     * El registro efectivo debe permanecer al final.
     */

    test.describe('Operaciones con cuenta Google real', () => {

        test.describe.configure({

            mode: 'default'
        });


        /*
         * ORIGINAL TEST 4
         */
        test('login con cuenta de prueba registrada: 200', async ({ request }) => {

            requireRegisteredAccount();

            const response = await googleAuth(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'login'
                }
            );

            await expectGoogleSuccess(
                response,
                'login'
            );
        });


        /*
         * ORIGINAL TEST 5 - ADAPTED
         */
        test('registro duplicado: 409', async ({ request }) => {

            requireRegisteredAccount();

            const documentoLegalIds =
                await getActiveLegalDocumentIds(request);

            const response = await googleAuth(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'register',

                    documentoLegalIds
                }
            );

            await expectErrorResponse(
                response,
                409,
                'Este correo ya se encuentra registrado'
            );
        });


        /*
         * ORIGINAL TEST 6
         */
        test('login sin registro PostgreSQL: 404', async ({ request }) => {

            requireUnregisteredAccount();

            const response = await googleAuth(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'login'
                }
            );

            await expectErrorResponse(
                response,
                404,
                'No existe una cuenta registrada con este correo'
            );
        });


        test('login con nombre opcional conserva la identidad autenticada', async ({ request }) => {

            requireRegisteredAccount();

            const response = await googleAuth(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'login',

                    nombre: 'Nombre QA alternativo'
                }
            );

            await expectGoogleSuccess(
                response,
                'login'
            );
        });


        test('dos inicios de sesión consecutivos conservan la identidad', async ({ request }) => {

            requireRegisteredAccount();

            const firstResponse = await googleAuth(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'login'
                }
            );

            const firstBody =
                await expectGoogleSuccess(
                    firstResponse,
                    'login'
                );

            const secondResponse = await googleAuth(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'login'
                }
            );

            const secondBody =
                await expectGoogleSuccess(
                    secondResponse,
                    'login'
                );

            expect(secondBody.success === firstBody.success &&
                secondBody.action === firstBody.action && secondBody.email === firstBody.email,
                'La identidad debe conservarse').toBe(true);
        });


        test('un token real no permite proporcionar un UID alternativo', async ({ request }) => {

            test.skip(
                !GOOGLE_TOKEN,

                'Requiere token Firebase real'
            );

            await expectBadRequest(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'login',

                    firebaseUid:
                        'unexpected-firebase-uid'
                }
            );
        });


        test('un token real no permite proporcionar otro correo', async ({ request }) => {

            test.skip(
                !GOOGLE_TOKEN,

                'Requiere token Firebase real'
            );

            await expectBadRequest(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'login',

                    email: 'other-user@example.com'
                }
            );
        });


        test('registro autenticado sin documentos legales: 400', async ({ request }) => {

            test.skip(
                !GOOGLE_TOKEN,

                'Requiere token Firebase real'
            );

            await expectBadRequest(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'register'
                }
            );
        });


        test('registro autenticado con documentos duplicados: 400', async ({ request }) => {

            test.skip(
                !GOOGLE_TOKEN,

                'Requiere token Firebase real'
            );

            const activeIds =
                await getActiveLegalDocumentIds(request);

            await expectBadRequest(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'register',

                    documentoLegalIds: [

                        activeIds[0],

                        activeIds[0]
                    ]
                },
                'Los documentos legales no pueden estar duplicados'
            );
        });


        test('registro con documentos no vigentes: 409', async ({ request }) => {

            requireUnregisteredAccount();

            const activeIds =
                await getActiveLegalDocumentIds(request);

            const documentoLegalIds =
                getNonActiveDocumentIds(activeIds);

            const response = await googleAuth(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'register',

                    nombre: 'QA Google',

                    documentoLegalIds
                }
            );

            await expectErrorResponse(
                response,
                409,
                'Debe aceptar todos los documentos legales vigentes'
            );

            /*
             * Comprueba que el registro rechazado
             * no haya creado al usuario.
             */
            const loginResponse = await googleAuth(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'login'
                }
            );

            await expectErrorResponse(
                loginResponse,
                404,
                'No existe una cuenta registrada con este correo'
            );
        });


        test('registro con un documento vigente y otro no vigente: 409', async ({ request }) => {

            requireUnregisteredAccount();

            const activeIds =
                await getActiveLegalDocumentIds(request);

            const invalidIds =
                getNonActiveDocumentIds(activeIds);

            const response = await googleAuth(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'register',

                    nombre: 'QA Google',

                    documentoLegalIds: [

                        activeIds[0],

                        invalidIds[0]
                    ]
                }
            );

            await expectErrorResponse(
                response,
                409,
                'Debe aceptar todos los documentos legales vigentes'
            );

            const loginResponse = await googleAuth(
                request,
                {
                    idToken: GOOGLE_TOKEN,

                    action: 'login'
                }
            );

            await expectErrorResponse(
                loginResponse,
                404,
                'No existe una cuenta registrada con este correo'
            );
        });


        /*
         * =================================================
         * ORIGINAL TEST 7 - ADAPTED
         * =================================================
         *
         * Única prueba que registra efectivamente
         * una cuenta nueva.
         *
         * Debe permanecer al final del grupo.
         */

        test('registro nuevo: 200 (mutación explícitamente habilitada)', async ({ request }) => {

            requireRegistrationPermission();

            /*
             * Verifica el estado real de la cuenta
             * antes de realizar la mutación.
             */
            const beforeRegistration =
                await googleAuth(
                    request,
                    {
                        idToken: GOOGLE_TOKEN,

                        action: 'login'
                    }
                );

            await expectErrorResponse(
                beforeRegistration,
                404,
                'No existe una cuenta registrada con este correo'
            );


            /*
             * Consulta los documentos vigentes
             * inmediatamente antes del registro.
             */
            const documentoLegalIds =
                await getActiveLegalDocumentIds(request);


            /*
             * Registra al usuario junto con
             * las aceptaciones legales iniciales.
             */
            const registrationResponse =
                await googleAuth(
                    request,
                    {
                        idToken: GOOGLE_TOKEN,

                        action: 'register',

                        nombre: 'QA Google',

                        documentoLegalIds
                    }
                );

            const registeredUser =
                await expectGoogleSuccess(
                    registrationResponse,
                    'register'
                );


            /*
             * Verifica que el usuario registrado
             * pueda iniciar sesión.
             */
            const loginResponse =
                await googleAuth(
                    request,
                    {
                        idToken: GOOGLE_TOKEN,

                        action: 'login'
                    }
                );

            await expectGoogleSuccess(
                loginResponse,
                'login',
                registeredUser.email
            );


            /*
             * Verifica que no sea posible
             * registrar nuevamente la cuenta.
             */
            const duplicateResponse =
                await googleAuth(
                    request,
                    {
                        idToken: GOOGLE_TOKEN,

                        action: 'register',

                        nombre: 'QA Google',

                        documentoLegalIds
                    }
                );

            await expectErrorResponse(
                duplicateResponse,
                409,
                'Este correo ya se encuentra registrado'
            );
        });
    });
});