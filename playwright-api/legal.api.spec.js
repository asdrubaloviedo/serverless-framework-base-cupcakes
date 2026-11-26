// playwright-api/legal.api.spec.js

const { test, expect } = require('@playwright/test');
const { isDeepStrictEqual } = require('node:util');

function hasExactKeys(value, keys) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) &&
        Object.keys(value).length === keys.length &&
        keys.every(key => Object.prototype.hasOwnProperty.call(value, key));
}
const { secureGet, securePost } = require('./utils/secure-request');

async function readJson(response) {
    try {
        return await response.json();
    } catch {
        throw new Error('La respuesta HTTP no contiene un JSON válido.');
    }
}

const {
    baseURL,
    environment
} = require('./config/environments');


/*
 * =========================================================
 * ENDPOINTS
 * =========================================================
 */

const URLS = {

    active:
        `${baseURL}usuarios/documentos-legales-vigentes`,

    register:
        `${baseURL}usuarios/insertar-usuario-nuevo`,

    pending:
        `${baseURL}usuarios/consultar-aceptaciones-legales`,

    accept:
        `${baseURL}usuarios/registrar-aceptaciones-legales`
};


/*
 * =========================================================
 * ENVIRONMENT VARIABLES
 * =========================================================
 */

const TRADITIONAL_TOKEN =
    process.env.TEST_LEGAL_TRADITIONAL_ID_TOKEN;

const TRADITIONAL_EMAIL =
    process.env.TEST_LEGAL_TRADITIONAL_EMAIL;

const TRADITIONAL_STATE =
    process.env.TEST_LEGAL_TRADITIONAL_ACCOUNT_STATE;


const GOOGLE_TOKEN =
    process.env.TEST_LEGAL_GOOGLE_ID_TOKEN;

const GOOGLE_STATE =
    process.env.TEST_LEGAL_GOOGLE_ACCOUNT_STATE;


const PENDING_TOKEN =
    process.env.TEST_LEGAL_PENDING_ID_TOKEN;

const PENDING_COUNT =
    process.env.TEST_LEGAL_PENDING_COUNT;


const EXPIRED_TOKEN =
    process.env.TEST_LEGAL_EXPIRED_ID_TOKEN;

const REVOKED_TOKEN =
    process.env.TEST_LEGAL_REVOKED_ID_TOKEN;

const UNSUPPORTED_PROVIDER_TOKEN =
    process.env.TEST_LEGAL_UNSUPPORTED_PROVIDER_ID_TOKEN;

const UNVERIFIED_GOOGLE_TOKEN =
    process.env.TEST_LEGAL_UNVERIFIED_GOOGLE_ID_TOKEN;


const ALLOW_MUTATIONS =
    process.env.TEST_ALLOW_LEGAL_MUTATIONS === 'true';

const ALLOW_DEV_MUTATIONS =
    process.env.TEST_ALLOW_DEV_LEGAL_MUTATIONS === 'true';


/*
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const REQUIRED_DOCUMENT_TYPES = [

    'terminos_condiciones',

    'politica_privacidad'
];


const INVALID_TOKEN =
    'invalid-firebase-token-for-legal-tests';


const REQUIRED_TOKEN_MESSAGE =
    'Token de autenticación requerido';

const INVALID_TOKEN_MESSAGE =
    'Token de Firebase inválido o expirado';

const USER_NOT_REGISTERED_MESSAGE =
    'Usuario no registrado';

const DUPLICATE_USER_MESSAGE =
    'El correo ya se encuentra registrado';

const INVALID_REGISTRATION_METHOD_MESSAGE =
    'Método de registro no válido';

const EMAIL_MISMATCH_MESSAGE =
    'El correo no coincide con la identidad autenticada';

const REQUIRED_REGISTRATION_DOCUMENTS_MESSAGE =
    'Debe aceptar todos los documentos legales vigentes';

const CHANGED_DOCUMENTS_MESSAGE =
    'Los documentos legales vigentes han cambiado';

const REQUIRED_PENDING_DOCUMENTS_MESSAGE =
    'Debe aceptar todos los documentos legales pendientes';


/*
 * Estos identificadores se utilizan únicamente
 * en pruebas que deben ser rechazadas antes de
 * realizar operaciones en PostgreSQL.
 */

const VALID_REGISTER_BODY = {

    nombre: 'QA Legal',

    email: 'qa-legal@example.com',

    pais: 'PER',

    documentoLegalIds: [1, 2]
};


const VALID_ACCEPTANCE_BODY = {

    documentoLegalIds: [1, 2]
};


const protectedOperations = [

    {
        name: 'registro tradicional',

        url: URLS.register,

        body: VALID_REGISTER_BODY
    },

    {
        name: 'consulta de aceptaciones',

        url: URLS.pending,

        body: {}
    },

    {
        name: 'registro de aceptaciones',

        url: URLS.accept,

        body: VALID_ACCEPTANCE_BODY
    }
];


const registeredAccounts = [

    {
        name: 'tradicional',

        token: TRADITIONAL_TOKEN,

        state: TRADITIONAL_STATE
    },

    {
        name: 'Google',

        token: GOOGLE_TOKEN,

        state: GOOGLE_STATE
    }
];


/*
 * =========================================================
 * REQUEST HELPERS
 * =========================================================
 */

function bearerHeaders(token) {

    if (!token) {

        return {};
    }

    return {

        Authorization: `Bearer ${token}`
    };
}


async function post(
    request,
    url,
    data,
    token
) {

    return securePost(request,
        url,
        {
            headers: bearerHeaders(token),

            data
        }
    );
}


async function registerTraditional(
    request,
    token,
    data
) {

    return post(
        request,
        URLS.register,
        data,
        token
    );
}


async function getPending(
    request,
    token
) {

    return post(
        request,
        URLS.pending,
        {},
        token
    );
}


async function registerAcceptances(
    request,
    token,
    documentoLegalIds
) {

    return post(
        request,
        URLS.accept,
        {
            documentoLegalIds
        },
        token
    );
}


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

    expect(body !== null && typeof body === 'object' && !Array.isArray(body) &&
        Object.keys(body).length === 1 && typeof body.message === 'string',
        'La respuesta debe contener exclusivamente un mensaje').toBe(true);

    expect(body.message.trim().length)
        .toBeGreaterThan(0);

    if (expectedMessage !== undefined) {

        expect(body.message === expectedMessage, 'El mensaje de error debe coincidir').toBe(true);
    }

    return body;
}


async function expectBadRequest(
    request,
    url,
    data,
    expectedMessage
) {

    const response = await post(
        request,
        url,
        data
    );

    return expectErrorResponse(
        response,
        400,
        expectedMessage
    );
}


function expectDocument(document) {

    expect(document !== null && typeof document === 'object' && !Array.isArray(document) &&
        typeof document.documento_legal_id === 'number' && typeof document.tipo === 'string' &&
        document.version != null && typeof document.url === 'string',
        'Contrato de documento legal inválido').toBe(true);

    expect(
        Number.isSafeInteger(
            document.documento_legal_id
        )
    ).toBe(true);

    expect(document.documento_legal_id)
        .toBeGreaterThan(0);

    expect(REQUIRED_DOCUMENT_TYPES.includes(document.tipo), 'Tipo de documento inválido').toBe(true);

    expect(String(document.version).trim().length)
        .toBeGreaterThan(0);

    expect(document.url.trim().length)
        .toBeGreaterThan(0);
}


async function expectActiveDocuments(response) {

    expect(response.status())
        .toBe(200);

    const body = await readJson(response);

    expect(hasExactKeys(body, ['success', 'documentos']) && body.success === true && Array.isArray(body.documentos),
        'Contrato de documentos vigentes inválido').toBe(true);

    expect(body.documentos.length).toBe(2);

    for (const document of body.documentos) {

        expectDocument(document);

        expect(document.vigente === true, 'El documento debe estar vigente').toBe(true);
    }

    const ids = body.documentos.map(
        document => document.documento_legal_id
    );

    const types = body.documentos.map(
        document => document.tipo
    );

    expect(new Set(ids).size)
        .toBe(2);

    expect(isDeepStrictEqual([...types].sort(), [...REQUIRED_DOCUMENT_TYPES].sort()), 'Tipos obligatorios incorrectos').toBe(true);

    expect(isDeepStrictEqual(ids, [...ids].sort((a, b) => a - b)), 'Orden de identificadores incorrecto').toBe(true);

    return body.documentos;
}


async function expectPendingResponse(response) {

    expect(response.status())
        .toBe(200);

    const body = await readJson(response);

    expect(hasExactKeys(body, ['success', 'aceptaciones_completas', 'documentos_pendientes']) && body.success === true && typeof body.aceptaciones_completas === 'boolean' && Array.isArray(body.documentos_pendientes),
        'Contrato de aceptaciones inválido').toBe(true);

    expect(body.documentos_pendientes.length)
        .toBeLessThanOrEqual(2);

    expect(body.aceptaciones_completas)
        .toBe(
            body.documentos_pendientes.length === 0
        );

    for (const document of body.documentos_pendientes) {

        expectDocument(document);
    }

    const ids = body.documentos_pendientes.map(
        document => document.documento_legal_id
    );

    expect(new Set(ids).size)
        .toBe(ids.length);

    expect(isDeepStrictEqual(ids, [...ids].sort((a, b) => a - b)), 'Orden de identificadores incorrecto').toBe(true);

    return body;
}


async function expectCompleteAcceptances(response) {

    const body =
        await expectPendingResponse(response);

    expect(hasExactKeys(body, ['success', 'aceptaciones_completas', 'documentos_pendientes']) && body.success === true && body.aceptaciones_completas === true && body.documentos_pendientes.length === 0,
        'Las aceptaciones deben estar completas').toBe(true);

    return body;
}


async function expectTraditionalRegistration(
    response,
    expectedEmail
) {

    expect(response.status())
        .toBe(200);

    const body = await readJson(response);

    expect(Array.isArray(body))
        .toBe(true);

    expect(body.length).toBe(1);

    const user = body[0];

    expect(user !== null && typeof user === 'object' &&
        typeof user.usuario_id === 'number' &&
        user.email === expectedEmail.trim().toLowerCase(),
        'El perfil debe coincidir con la cuenta esperada').toBe(true);

    expect(
        Number.isSafeInteger(user.usuario_id)
    ).toBe(true);

    expect(user.usuario_id)
        .toBeGreaterThan(0);

    expect(Object.prototype.hasOwnProperty.call(user, 'password')).toBe(false);

    expect(Object.prototype.hasOwnProperty.call(user, 'idToken')).toBe(false);

    return user;
}


/*
 * =========================================================
 * LEGAL DOCUMENT HELPERS
 * =========================================================
 */

async function getActiveDocuments(request) {

    const response = await secureGet(request,
        URLS.active
    );

    return expectActiveDocuments(response);
}


async function getActiveDocumentIds(request) {

    const documents =
        await getActiveDocuments(request);

    return documents.map(
        document => document.documento_legal_id
    );
}


function getPendingDocumentIds(body) {

    return body.documentos_pendientes.map(
        document => document.documento_legal_id
    );
}


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


function createRegistrationBody(
    email,
    documentoLegalIds
) {

    return {

        nombre: 'QA Legal',

        email,

        pais: 'PER',

        documentoLegalIds
    };
}


/*
 * =========================================================
 * EXECUTION GUARDS
 * =========================================================
 */

function requireAccount(
    token,
    state,
    expectedState
) {

    test.skip(
        !token ||
        state !== expectedState,

        `Requiere cuenta de pruebas ${expectedState}`
    );
}


function requireTraditionalAccount(expectedState) {

    requireAccount(
        TRADITIONAL_TOKEN,
        TRADITIONAL_STATE,
        expectedState
    );

    test.skip(
        !TRADITIONAL_EMAIL,

        'Requiere correo de la cuenta tradicional'
    );
}


function requireMutationPermission() {

    test.skip(
        !ALLOW_MUTATIONS,

        'Las mutaciones legales requieren autorización explícita'
    );

    test.skip(
        environment !== 'local' &&
        environment !== 'dev',

        'Entorno no autorizado para mutaciones'
    );

    test.skip(
        environment === 'dev' &&
        !ALLOW_DEV_MUTATIONS,

        'Las mutaciones en DEV requieren autorización adicional'
    );
}


function requirePendingAccount() {

    test.skip(
        !PENDING_TOKEN,

        'Requiere una cuenta con documentos pendientes'
    );

    test.skip(
        !['1', '2'].includes(PENDING_COUNT),

        'Debe indicarse si existen uno o dos documentos pendientes'
    );
}


function requireIndependentPendingAccount() {

    expect(PENDING_TOKEN !== TRADITIONAL_TOKEN, 'La cuenta pendiente debe ser independiente').toBe(true);

    expect(PENDING_TOKEN !== GOOGLE_TOKEN, 'La cuenta pendiente debe ser independiente').toBe(true);
}


/*
 * =========================================================
 * API - LEGAL AUTH
 * =========================================================
 */

test.use({ trace: 'off' });

test.describe('API - Legal Auth', () => {


    /*
     * =====================================================
     * PUBLIC LEGAL DOCUMENTS
     * =====================================================
     */

    test.describe('Documentos legales vigentes', () => {

        test('consulta pública sin autenticación: 200', async ({ request }) => {

            const response = await secureGet(request,
                URLS.active
            );

            await expectActiveDocuments(response);
        });


        test('devuelve exactamente los dos tipos obligatorios', async ({ request }) => {

            const documents =
                await getActiveDocuments(request);

            expect(
                documents.filter(
                    document =>
                        document.tipo ===
                        'terminos_condiciones'
                ).length
            ).toBe(1);

            expect(
                documents.filter(
                    document =>
                        document.tipo ===
                        'politica_privacidad'
                ).length
            ).toBe(1);
        });


        test('devuelve únicamente documentos vigentes', async ({ request }) => {

            const documents =
                await getActiveDocuments(request);

            expect(
                documents.every(
                    document => document.vigente === true
                )
            ).toBe(true);
        });


        test('no expone información de aceptaciones personales', async ({ request }) => {

            const documents =
                await getActiveDocuments(request);

            for (const document of documents) {

                expect(Object.prototype.hasOwnProperty.call(document, 'usuario_id'), 'Campo personal no permitido: usuario_id').toBe(false);

                expect(Object.prototype.hasOwnProperty.call(document, 'firebase_uid'), 'Campo personal no permitido: firebase_uid').toBe(false);

                expect(Object.prototype.hasOwnProperty.call(document, 'email'), 'Campo personal no permitido: email').toBe(false);

                expect(Object.prototype.hasOwnProperty.call(document, 'fecha_aceptacion'), 'Campo personal no permitido: fecha_aceptacion').toBe(false);

                expect(Object.prototype.hasOwnProperty.call(document, 'metodo_aceptacion'), 'Campo personal no permitido: metodo_aceptacion').toBe(false);
            }
        });


        test('no requiere un token Firebase válido', async ({ request }) => {

            const response = await secureGet(request,
                URLS.active,
                {
                    headers:
                        bearerHeaders(INVALID_TOKEN)
                }
            );

            await expectActiveDocuments(response);
        });


        test('dos consultas consecutivas conservan los documentos vigentes', async ({ request }) => {

            const first =
                await getActiveDocuments(request);

            const second =
                await getActiveDocuments(request);

            expect(isDeepStrictEqual(second, first), 'Las respuestas deben conservar su contenido').toBe(true);
        });


        test('la consulta pública no depende de un email enviado por query', async ({ request }) => {

            const response = await secureGet(request,
                URLS.active,
                {
                    params: {

                        email: 'qa@example.com'
                    }
                }
            );

            await expectActiveDocuments(response);
        });
    });


    /*
     * =====================================================
     * HTTP BODY VALIDATION
     * =====================================================
     */

    test.describe('Validación del cuerpo HTTP', () => {

        const invalidJsonBodies = [

            ['JSON incompleto', '{"email":'],

            ['coma final', '{"email":"qa@example.com",}'],

            ['JSON inválido', '{invalid-json'],

            ['espacios', '   ']
        ];


        const nonObjectBodies = [

            ['null', 'null'],

            ['arreglo', '[]'],

            ['booleano', 'true'],

            ['número', '123'],

            ['cadena', '"invalid"']
        ];


        for (const operation of protectedOperations) {

            for (const [
                description,
                body
            ] of invalidJsonBodies) {

                test(
                    `${operation.name}: ${description} -> 400`,
                    async ({ request }) => {

                        const response = await securePost(request,
                            operation.url,
                            {
                                headers: {

                                    'Content-Type':
                                        'application/json'
                                },

                                data: body
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


            for (const [
                description,
                body
            ] of nonObjectBodies) {

                test(
                    `${operation.name}: body ${description} -> 400`,
                    async ({ request }) => {

                        const response = await securePost(request,
                            operation.url,
                            {
                                headers: {

                                    'Content-Type':
                                        'application/json'
                                },

                                data: body
                            }
                        );

                        await expectErrorResponse(
                            response,
                            400
                        );
                    }
                );
            }
        }


        for (const operation of protectedOperations) {

            test(
                `${operation.name}: body ausente`,
                async ({ request }) => {

                    const response =
                        await securePost(request, operation.url);

                    if (operation.url === URLS.pending) {

                        await expectErrorResponse(
                            response,
                            401,
                            REQUIRED_TOKEN_MESSAGE
                        );

                    } else {

                        await expectErrorResponse(
                            response,
                            400
                        );
                    }
                }
            );


            test(
                `${operation.name}: objeto vacío`,
                async ({ request }) => {

                    const response = await post(
                        request,
                        operation.url,
                        {}
                    );

                    if (operation.url === URLS.pending) {

                        await expectErrorResponse(
                            response,
                            401,
                            REQUIRED_TOKEN_MESSAGE
                        );

                    } else {

                        await expectErrorResponse(
                            response,
                            400
                        );
                    }
                }
            );
        }
    });


    /*
     * =====================================================
     * AUTHORIZATION HEADER VALIDATION
     * =====================================================
     */

    test.describe('Cabecera Authorization', () => {

        const invalidHeaders = [

            ['ausente', undefined],

            ['vacía', ''],

            ['Bearer sin token', 'Bearer'],

            ['Basic', 'Basic dGVzdDp0ZXN0'],

            ['token sin esquema', INVALID_TOKEN],

            ['dos tokens', 'Bearer first second'],

            ['esquema incorrecto', 'Token invalid']
        ];


        const validHeaderFormats = [

            ['Bearer', `Bearer ${INVALID_TOKEN}`],

            ['bearer', `bearer ${INVALID_TOKEN}`],

            ['BEARER', `BEARER ${INVALID_TOKEN}`],

            ['espacios múltiples', `Bearer   ${INVALID_TOKEN}`]
        ];


        for (const operation of protectedOperations) {

            for (const [
                description,
                authorization
            ] of invalidHeaders) {

                test(
                    `${operation.name}: Authorization ${description} -> 401`,
                    async ({ request }) => {

                        const headers =
                            authorization === undefined
                                ? {}
                                : {
                                    Authorization:
                                        authorization
                                };

                        const response =
                            await securePost(request,
                                operation.url,
                                {
                                    headers,

                                    data: operation.body
                                }
                            );

                        await expectErrorResponse(
                            response,
                            401,
                            REQUIRED_TOKEN_MESSAGE
                        );
                    }
                );
            }


            for (const [
                description,
                authorization
            ] of validHeaderFormats) {

                test(
                    `${operation.name}: formato ${description} reconocido`,
                    async ({ request }) => {

                        const response =
                            await securePost(request,
                                operation.url,
                                {
                                    headers: {

                                        Authorization:
                                            authorization
                                    },

                                    data: operation.body
                                }
                            );

                        await expectErrorResponse(
                            response,
                            401,
                            INVALID_TOKEN_MESSAGE
                        );
                    }
                );
            }


            test(
                `${operation.name}: Authorization en minúsculas`,
                async ({ request }) => {

                    const response =
                        await securePost(request,
                            operation.url,
                            {
                                headers: {

                                    authorization:
                                        `Bearer ${INVALID_TOKEN}`
                                },

                                data: operation.body
                            }
                        );

                    await expectErrorResponse(
                        response,
                        401,
                        INVALID_TOKEN_MESSAGE
                    );
                }
            );
        }
    });


    /*
     * =====================================================
     * FIREBASE TOKEN VALIDATION
     * =====================================================
     */

    test.describe('Validación de identidad Firebase', () => {

        const malformedTokens = [

            [
                'cadena arbitraria',

                'invalid-firebase-token'
            ],

            [
                'JWT inválido',

                'invalid-header.invalid-payload.invalid-signature'
            ],

            [
                'JWT sin firma válida',

                'eyJhbGciOiJub25lIn0.eyJzdWIiOiJxYSJ9.'
            ]
        ];


        for (const operation of protectedOperations) {

            for (const [
                description,
                token
            ] of malformedTokens) {

                test(
                    `${operation.name}: ${description} -> 401`,
                    async ({ request }) => {

                        const response = await post(
                            request,
                            operation.url,
                            operation.body,
                            token
                        );

                        await expectErrorResponse(
                            response,
                            401,
                            INVALID_TOKEN_MESSAGE
                        );
                    }
                );
            }


            test(
                `${operation.name}: token expirado -> 401`,
                async ({ request }) => {

                    test.skip(
                        !EXPIRED_TOKEN,

                        'Requiere token Firebase expirado'
                    );

                    const response = await post(
                        request,
                        operation.url,
                        operation.body,
                        EXPIRED_TOKEN
                    );

                    await expectErrorResponse(
                        response,
                        401,
                        INVALID_TOKEN_MESSAGE
                    );
                }
            );


            test(
                `${operation.name}: token revocado -> 401`,
                async ({ request }) => {

                    test.skip(
                        !REVOKED_TOKEN,

                        'Requiere token Firebase revocado'
                    );

                    const response = await post(
                        request,
                        operation.url,
                        operation.body,
                        REVOKED_TOKEN
                    );

                    await expectErrorResponse(
                        response,
                        401,
                        INVALID_TOKEN_MESSAGE
                    );
                }
            );


            test(
                `${operation.name}: proveedor no soportado -> 403`,
                async ({ request }) => {

                    test.skip(
                        !UNSUPPORTED_PROVIDER_TOKEN,

                        'Requiere token de proveedor no soportado'
                    );

                    const response = await post(
                        request,
                        operation.url,
                        operation.body,
                        UNSUPPORTED_PROVIDER_TOKEN
                    );

                    await expectErrorResponse(
                        response,
                        403,
                        'Identidad de usuario no válida'
                    );
                }
            );


            test(
                `${operation.name}: Google sin correo verificado -> 403`,
                async ({ request }) => {

                    test.skip(
                        !UNVERIFIED_GOOGLE_TOKEN,

                        'Requiere token Google con email_verified=false'
                    );

                    const response = await post(
                        request,
                        operation.url,
                        operation.body,
                        UNVERIFIED_GOOGLE_TOKEN
                    );

                    await expectErrorResponse(
                        response,
                        403,
                        'Debe verificar su correo electrónico'
                    );
                }
            );
        }
    });


    /*
     * =====================================================
     * TRADITIONAL REGISTRATION SCHEMA
     * =====================================================
     */

    test.describe('Registro tradicional - Validación del nombre', () => {

        const invalidNames = [

            ['ausente', undefined],

            ['null', null],

            ['cadena vacía', ''],

            ['espacios', '   '],

            ['un carácter', 'A'],

            ['51 caracteres', 'a'.repeat(51)],

            ['número', 123],

            ['booleano', true],

            ['objeto', {}],

            ['arreglo', ['QA Legal']]
        ];


        for (const [
            description,
            nombre
        ] of invalidNames) {

            test(
                `Nombre ${description}: 400`,
                async ({ request }) => {

                    await expectBadRequest(
                        request,
                        URLS.register,
                        {
                            ...VALID_REGISTER_BODY,

                            nombre
                        }
                    );
                }
            );
        }


        const validNames = [

            ['longitud mínima', 'QA'],

            ['longitud máxima', 'a'.repeat(50)],

            ['acentos', 'José Álvarez'],

            ['espacios exteriores', '  QA Legal  '],

            ['espacios interiores', 'QA    Legal']
        ];


        for (const [
            description,
            nombre
        ] of validNames) {

            test(
                `Nombre ${description} supera el esquema`,
                async ({ request }) => {

                    const response = await post(
                        request,
                        URLS.register,
                        {
                            ...VALID_REGISTER_BODY,

                            nombre
                        }
                    );

                    await expectErrorResponse(
                        response,
                        401,
                        REQUIRED_TOKEN_MESSAGE
                    );
                }
            );
        }
    });


    test.describe('Registro tradicional - Validación del correo', () => {

        const invalidEmails = [

            ['ausente', undefined],

            ['null', null],

            ['cadena vacía', ''],

            ['espacios', '   '],

            ['sin dominio', 'qa@'],

            ['sin usuario', '@example.com'],

            ['sin arroba', 'invalid-email'],

            ['espacio interior', 'qa legal@example.com'],

            ['número', 123],

            ['booleano', true],

            ['objeto', {}],

            ['arreglo', ['qa@example.com']]
        ];


        for (const [
            description,
            email
        ] of invalidEmails) {

            test(
                `Email ${description}: 400`,
                async ({ request }) => {

                    await expectBadRequest(
                        request,
                        URLS.register,
                        {
                            ...VALID_REGISTER_BODY,

                            email
                        }
                    );
                }
            );
        }


        const validEmails = [

            ['minúsculas', 'qa@example.com'],

            ['mayúsculas', 'QA@EXAMPLE.COM'],

            ['espacios exteriores', '  qa@example.com  '],

            ['alias', 'qa+legal@example.com']
        ];


        for (const [
            description,
            email
        ] of validEmails) {

            test(
                `Email ${description} supera el esquema`,
                async ({ request }) => {

                    const response = await post(
                        request,
                        URLS.register,
                        {
                            ...VALID_REGISTER_BODY,

                            email
                        }
                    );

                    await expectErrorResponse(
                        response,
                        401,
                        REQUIRED_TOKEN_MESSAGE
                    );
                }
            );
        }
    });


    test.describe('Registro tradicional - Validación del país', () => {

        const invalidCountries = [

            ['dos letras', 'PE'],

            ['cuatro letras', 'PERR'],

            ['números', '123'],

            ['alfanumérico', 'P3R'],

            ['espacios', '   '],

            ['número', 123],

            ['booleano', true],

            ['objeto', {}],

            ['arreglo', ['PER']]
        ];


        for (const [
            description,
            pais
        ] of invalidCountries) {

            test(
                `País ${description}: 400`,
                async ({ request }) => {

                    await expectBadRequest(
                        request,
                        URLS.register,
                        {
                            ...VALID_REGISTER_BODY,

                            pais
                        }
                    );
                }
            );
        }


        const validCountries = [

            ['ausente', undefined],

            ['null', null],

            ['cadena vacía', ''],

            ['PER', 'PER'],

            ['minúsculas', 'per'],

            ['espacios exteriores', ' per '],

            ['otro país', 'COL'],

            ['código sintáctico', 'ZZZ']
        ];


        for (const [
            description,
            pais
        ] of validCountries) {

            test(
                `País ${description} supera el esquema`,
                async ({ request }) => {

                    const response = await post(
                        request,
                        URLS.register,
                        {
                            ...VALID_REGISTER_BODY,

                            pais
                        }
                    );

                    await expectErrorResponse(
                        response,
                        401,
                        REQUIRED_TOKEN_MESSAGE
                    );
                }
            );
        }
    });


    /*
     * =====================================================
     * LEGAL DOCUMENT IDS VALIDATION
     * =====================================================
     */

    test.describe('Validación de identificadores legales', () => {

        const invalidDocuments = [

            ['ausentes', undefined],

            ['null', null],

            ['arreglo vacío', []],

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


        const documentOperations = [

            {
                name: 'registro inicial',

                url: URLS.register,

                body: VALID_REGISTER_BODY
            },

            {
                name: 'aceptación posterior',

                url: URLS.accept,

                body: VALID_ACCEPTANCE_BODY
            }
        ];


        for (const operation of documentOperations) {

            for (const [
                description,
                documentoLegalIds
            ] of invalidDocuments) {

                test(
                    `${operation.name}: documentos ${description} -> 400`,
                    async ({ request }) => {

                        await expectBadRequest(
                            request,
                            operation.url,
                            {
                                ...operation.body,

                                documentoLegalIds
                            }
                        );
                    }
                );
            }


            test(
                `${operation.name}: mensaje de documentos duplicados`,
                async ({ request }) => {

                    await expectBadRequest(
                        request,
                        operation.url,
                        {
                            ...operation.body,

                            documentoLegalIds: [1, 1]
                        },
                        'Los documentos legales no pueden estar duplicados'
                    );
                }
            );


            test(
                `${operation.name}: dos identificadores positivos superan el esquema`,
                async ({ request }) => {

                    const response = await post(
                        request,
                        operation.url,
                        {
                            ...operation.body,

                            documentoLegalIds: [1, 2]
                        }
                    );

                    await expectErrorResponse(
                        response,
                        401,
                        REQUIRED_TOKEN_MESSAGE
                    );
                }
            );


            test(
                `${operation.name}: permite invertir el orden de los identificadores`,
                async ({ request }) => {

                    const response = await post(
                        request,
                        operation.url,
                        {
                            ...operation.body,

                            documentoLegalIds: [2, 1]
                        }
                    );

                    await expectErrorResponse(
                        response,
                        401,
                        REQUIRED_TOKEN_MESSAGE
                    );
                }
            );
        }


        test('registro inicial con un solo documento: 400', async ({ request }) => {

            await expectBadRequest(
                request,
                URLS.register,
                {
                    ...VALID_REGISTER_BODY,

                    documentoLegalIds: [1]
                },
                'Debe aceptar los dos documentos legales obligatorios'
            );
        });


        test('aceptación posterior con un documento supera el esquema', async ({ request }) => {

            const response = await post(
                request,
                URLS.accept,
                {
                    documentoLegalIds: [1]
                }
            );

            await expectErrorResponse(
                response,
                401,
                REQUIRED_TOKEN_MESSAGE
            );
        });
    });


    /*
     * =====================================================
     * IDENTITY INJECTION PROTECTION
     * =====================================================
     */

    test.describe('Protección de identidad autenticada', () => {

        const forbiddenFields = [

            ['firebaseUid', 'unexpected-uid'],

            ['firebase_uid', 'unexpected-uid'],

            ['uid', 'unexpected-uid'],

            ['usuarioId', 123],

            ['usuario_id', 123],

            ['idToken', INVALID_TOKEN],

            ['password', 'simulated-password'],

            ['provider', 'google.com'],

            ['email_verified', true],

            ['metodoAceptacion', 'tradicional'],

            ['role', 'admin'],

            ['success', true],

            ['extra', 'unexpected']
        ];


        for (const operation of protectedOperations) {

            for (const [
                field,
                value
            ] of forbiddenFields) {

                test(
                    `${operation.name}: rechaza campo ${field}`,
                    async ({ request }) => {

                        await expectBadRequest(
                            request,
                            operation.url,
                            {
                                ...operation.body,

                                [field]: value
                            }
                        );
                    }
                );
            }
        }


        for (const operation of [

            {
                name: 'consulta de aceptaciones',

                url: URLS.pending,

                body: {}
            },

            {
                name: 'registro de aceptaciones',

                url: URLS.accept,

                body: VALID_ACCEPTANCE_BODY
            }

        ]) {

            for (const [
                field,
                value
            ] of [

                ['email', 'other@example.com'],

                ['nombre', 'Otro usuario'],

                ['pais', 'PER']

            ]) {

                test(
                    `${operation.name}: rechaza ${field}`,
                    async ({ request }) => {

                        await expectBadRequest(
                            request,
                            operation.url,
                            {
                                ...operation.body,

                                [field]: value
                            }
                        );
                    }
                );
            }
        }


        test('consulta de pendientes rechaza documentoLegalIds', async ({ request }) => {

            await expectBadRequest(
                request,
                URLS.pending,
                {
                    documentoLegalIds: [1, 2]
                }
            );
        });
    });


    /*
     * =====================================================
     * AUTHENTICATED READ OPERATIONS
     * =====================================================
     */

    test.describe('Consultas autenticadas', () => {

        for (const account of registeredAccounts) {

            test(
                `${account.name}: consulta aceptaciones de usuario registrado`,
                async ({ request }) => {

                    requireAccount(
                        account.token,
                        account.state,
                        'registered'
                    );

                    const response = await getPending(
                        request,
                        account.token
                    );

                    await expectPendingResponse(response);
                }
            );


            test(
                `${account.name}: consulta de usuario no registrado -> 404`,
                async ({ request }) => {

                    requireAccount(
                        account.token,
                        account.state,
                        'unregistered'
                    );

                    const response = await getPending(
                        request,
                        account.token
                    );

                    await expectErrorResponse(
                        response,
                        404,
                        USER_NOT_REGISTERED_MESSAGE
                    );
                }
            );


            test(
                `${account.name}: consulta sin body`,
                async ({ request }) => {

                    requireAccount(
                        account.token,
                        account.state,
                        'registered'
                    );

                    const response =
                        await securePost(request,
                            URLS.pending,
                            {
                                headers:
                                    bearerHeaders(account.token)
                            }
                        );

                    await expectPendingResponse(response);
                }
            );


            test(
                `${account.name}: los documentos pendientes pertenecen a los vigentes`,
                async ({ request }) => {

                    requireAccount(
                        account.token,
                        account.state,
                        'registered'
                    );

                    const activeDocuments =
                        await getActiveDocuments(request);

                    const response = await getPending(
                        request,
                        account.token
                    );

                    const pending =
                        await expectPendingResponse(response);

                    for (
                        const document of
                        pending.documentos_pendientes
                    ) {

                        const activeDocument =
                            activeDocuments.find(
                                active =>
                                    active.documento_legal_id ===
                                    document.documento_legal_id
                            );

                        expect(activeDocument)
                            .toBeDefined();

                        expect(document.tipo === activeDocument.tipo, 'El documento debe coincidir con el vigente: tipo').toBe(true);

                        expect(document.version === activeDocument.version, 'El documento debe coincidir con el vigente: version').toBe(true);

                        expect(document.url === activeDocument.url, 'El documento debe coincidir con el vigente: url').toBe(true);
                    }
                }
            );


            test(
                `${account.name}: dos consultas consecutivas no modifican aceptaciones`,
                async ({ request }) => {

                    requireAccount(
                        account.token,
                        account.state,
                        'registered'
                    );

                    const first =
                        await expectPendingResponse(
                            await getPending(
                                request,
                                account.token
                            )
                        );

                    const second =
                        await expectPendingResponse(
                            await getPending(
                                request,
                                account.token
                            )
                        );

                    expect(isDeepStrictEqual(second, first), 'Las respuestas deben conservar su contenido').toBe(true);
                }
            );


            test(
                `${account.name}: token real no permite enviar otro UID`,
                async ({ request }) => {

                    test.skip(
                        !account.token,

                        'Requiere token Firebase real'
                    );

                    const response = await post(
                        request,
                        URLS.pending,
                        {
                            firebaseUid: 'another-user-uid'
                        },
                        account.token
                    );

                    await expectErrorResponse(
                        response,
                        400
                    );
                }
            );


            test(
                `${account.name}: token real no permite enviar otro email`,
                async ({ request }) => {

                    test.skip(
                        !account.token,

                        'Requiere token Firebase real'
                    );

                    const response = await post(
                        request,
                        URLS.pending,
                        {
                            email: 'another-user@example.com'
                        },
                        account.token
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
     * AUTHENTICATED REGISTRATION SCENARIOS
     * =====================================================
     *
     * Los escenarios que podrían insertar usuarios
     * requieren autorización de mutaciones, incluso
     * cuando el resultado esperado sea un rechazo.
     *
     * El registro exitoso permanece al final.
     */

    test.describe('Registro tradicional autenticado', () => {

        test.describe.configure({

            mode: 'default'
        });


        test('rechaza el registro tradicional con proveedor Google', async ({ request }) => {

            test.skip(
                !GOOGLE_TOKEN,

                'Requiere token Google real'
            );

            requireMutationPermission();

            const ids =
                await getActiveDocumentIds(request);

            const response =
                await registerTraditional(
                    request,
                    GOOGLE_TOKEN,
                    createRegistrationBody(
                        'qa-google@example.com',
                        ids
                    )
                );

            await expectErrorResponse(
                response,
                403,
                INVALID_REGISTRATION_METHOD_MESSAGE
            );
        });


        test('rechaza correo diferente al autenticado', async ({ request }) => {

            test.skip(
                !TRADITIONAL_TOKEN ||
                !TRADITIONAL_EMAIL,

                'Requiere identidad tradicional'
            );

            requireMutationPermission();

            const ids =
                await getActiveDocumentIds(request);

            const differentEmail =
                TRADITIONAL_EMAIL
                    .trim()
                    .toLowerCase() === 'other@example.com'
                    ? 'another@example.com'
                    : 'other@example.com';

            const response =
                await registerTraditional(
                    request,
                    TRADITIONAL_TOKEN,
                    createRegistrationBody(
                        differentEmail,
                        ids
                    )
                );

            await expectErrorResponse(
                response,
                403,
                EMAIL_MISMATCH_MESSAGE
            );
        });


        test('rechaza registro autenticado sin documentos', async ({ request }) => {

            test.skip(
                !TRADITIONAL_TOKEN ||
                !TRADITIONAL_EMAIL,

                'Requiere identidad tradicional'
            );

            const response =
                await registerTraditional(
                    request,
                    TRADITIONAL_TOKEN,
                    {
                        nombre: 'QA Legal',

                        email: TRADITIONAL_EMAIL
                    }
                );

            await expectErrorResponse(
                response,
                400
            );
        });


        test('rechaza UID proporcionado en registro autenticado', async ({ request }) => {

            test.skip(
                !TRADITIONAL_TOKEN ||
                !TRADITIONAL_EMAIL,

                'Requiere identidad tradicional'
            );

            const ids =
                await getActiveDocumentIds(request);

            const response =
                await registerTraditional(
                    request,
                    TRADITIONAL_TOKEN,
                    {
                        ...createRegistrationBody(
                            TRADITIONAL_EMAIL,
                            ids
                        ),

                        firebaseUid:
                            'another-user-uid'
                    }
                );

            await expectErrorResponse(
                response,
                400
            );
        });


        test('registro duplicado: 409', async ({ request }) => {

            requireTraditionalAccount('registered');

            requireMutationPermission();

            const ids =
                await getActiveDocumentIds(request);

            const response =
                await registerTraditional(
                    request,
                    TRADITIONAL_TOKEN,
                    createRegistrationBody(
                        TRADITIONAL_EMAIL,
                        ids
                    )
                );

            await expectErrorResponse(
                response,
                409,
                DUPLICATE_USER_MESSAGE
            );
        });


        test('registro duplicado con correo normalizado: 409', async ({ request }) => {

            requireTraditionalAccount('registered');

            requireMutationPermission();

            const ids =
                await getActiveDocumentIds(request);

            const response =
                await registerTraditional(
                    request,
                    TRADITIONAL_TOKEN,
                    createRegistrationBody(
                        `  ${TRADITIONAL_EMAIL.toUpperCase()}  `,
                        ids
                    )
                );

            await expectErrorResponse(
                response,
                409,
                DUPLICATE_USER_MESSAGE
            );
        });


        test('registro con documentos no vigentes: 409', async ({ request }) => {

            requireTraditionalAccount('unregistered');

            requireMutationPermission();

            const before =
                await getPending(
                    request,
                    TRADITIONAL_TOKEN
                );

            await expectErrorResponse(
                before,
                404,
                USER_NOT_REGISTERED_MESSAGE
            );

            const activeIds =
                await getActiveDocumentIds(request);

            const invalidIds =
                getNonActiveDocumentIds(activeIds);

            const response =
                await registerTraditional(
                    request,
                    TRADITIONAL_TOKEN,
                    createRegistrationBody(
                        TRADITIONAL_EMAIL,
                        invalidIds
                    )
                );

            await expectErrorResponse(
                response,
                409,
                REQUIRED_REGISTRATION_DOCUMENTS_MESSAGE
            );

            const after =
                await getPending(
                    request,
                    TRADITIONAL_TOKEN
                );

            await expectErrorResponse(
                after,
                404,
                USER_NOT_REGISTERED_MESSAGE
            );
        });


        test('registro con un documento vigente y otro no vigente: 409', async ({ request }) => {

            requireTraditionalAccount('unregistered');

            requireMutationPermission();

            const activeIds =
                await getActiveDocumentIds(request);

            const invalidIds =
                getNonActiveDocumentIds(activeIds);

            const response =
                await registerTraditional(
                    request,
                    TRADITIONAL_TOKEN,
                    createRegistrationBody(
                        TRADITIONAL_EMAIL,
                        [
                            activeIds[0],
                            invalidIds[0]
                        ]
                    )
                );

            await expectErrorResponse(
                response,
                409,
                REQUIRED_REGISTRATION_DOCUMENTS_MESSAGE
            );

            await expectErrorResponse(
                await getPending(
                    request,
                    TRADITIONAL_TOKEN
                ),
                404,
                USER_NOT_REGISTERED_MESSAGE
            );
        });


        /*
         * MUTACIÓN REAL:
         *
         * Crea el usuario tradicional y sus
         * aceptaciones legales iniciales.
         */

        test('registro tradicional exitoso y aceptaciones iniciales completas', async ({ request }) => {

            requireTraditionalAccount('unregistered');

            requireMutationPermission();

            await expectErrorResponse(
                await getPending(
                    request,
                    TRADITIONAL_TOKEN
                ),
                404,
                USER_NOT_REGISTERED_MESSAGE
            );

            const activeIds =
                await getActiveDocumentIds(request);

            /*
             * Se omite pais para comprobar
             * el valor predeterminado.
             *
             * También se invierte el orden de los
             * documentos para comprobar que la
             * aceptación no depende del orden.
             */

            const response =
                await registerTraditional(
                    request,
                    TRADITIONAL_TOKEN,
                    {
                        nombre: '  QA    Legal  ',

                        email:
                            `  ${TRADITIONAL_EMAIL.toUpperCase()}  `,

                        documentoLegalIds:
                            [...activeIds].reverse()
                    }
                );

            const user =
                await expectTraditionalRegistration(
                    response,
                    TRADITIONAL_EMAIL
                );

            expect(user.nombre === 'QA Legal', 'Nombre de registro inesperado').toBe(true);

            /*
             * El usuario recién creado debe tener
             * todas las aceptaciones completas.
             */

            await expectCompleteAcceptances(
                await getPending(
                    request,
                    TRADITIONAL_TOKEN
                )
            );

            /*
             * La misma identidad no debe poder
             * registrarse nuevamente.
             */

            const duplicate =
                await registerTraditional(
                    request,
                    TRADITIONAL_TOKEN,
                    createRegistrationBody(
                        TRADITIONAL_EMAIL,
                        activeIds
                    )
                );

            await expectErrorResponse(
                duplicate,
                409,
                DUPLICATE_USER_MESSAGE
            );
        });
    });


    /*
     * =====================================================
     * PENDING LEGAL ACCEPTANCE SCENARIOS
     * =====================================================
     *
     * Utiliza una cuenta independiente.
     *
     * El estado esperado se configura mediante
     * TEST_LEGAL_PENDING_COUNT.
     *
     * No se crean ni publican documentos legales.
     */

    test.describe('Aceptaciones legales posteriores', () => {

        test.describe.configure({

            mode: 'default'
        });


        test('consulta el número esperado de documentos pendientes', async ({ request }) => {

            requirePendingAccount();

            requireIndependentPendingAccount();

            const response =
                await getPending(
                    request,
                    PENDING_TOKEN
                );

            const body =
                await expectPendingResponse(response);

            expect(body.aceptaciones_completas === false, 'Deben existir aceptaciones pendientes').toBe(true);

            expect(body.documentos_pendientes.length).toBe(Number(PENDING_COUNT));
        });


        test('rechaza documentos no vigentes sin modificar las aceptaciones', async ({ request }) => {

            requirePendingAccount();

            requireIndependentPendingAccount();

            requireMutationPermission();

            const before =
                await expectPendingResponse(
                    await getPending(
                        request,
                        PENDING_TOKEN
                    )
                );

            expect(before.documentos_pendientes.length).toBe(Number(PENDING_COUNT));

            const activeIds =
                await getActiveDocumentIds(request);

            const invalidIds =
                getNonActiveDocumentIds(activeIds);

            const response =
                await registerAcceptances(
                    request,
                    PENDING_TOKEN,
                    invalidIds
                );

            await expectErrorResponse(
                response,
                409,
                CHANGED_DOCUMENTS_MESSAGE
            );

            const after =
                await expectPendingResponse(
                    await getPending(
                        request,
                        PENDING_TOKEN
                    )
                );

            expect(isDeepStrictEqual(after, before), 'Las respuestas deben conservar su contenido').toBe(true);
        });


        test('rechaza un documento vigente junto con otro no vigente', async ({ request }) => {

            requirePendingAccount();

            requireIndependentPendingAccount();

            requireMutationPermission();

            const before =
                await expectPendingResponse(
                    await getPending(
                        request,
                        PENDING_TOKEN
                    )
                );

            expect(before.documentos_pendientes.length).toBe(Number(PENDING_COUNT));

            const activeIds =
                await getActiveDocumentIds(request);

            const invalidIds =
                getNonActiveDocumentIds(activeIds);

            const response =
                await registerAcceptances(
                    request,
                    PENDING_TOKEN,
                    [
                        activeIds[0],
                        invalidIds[0]
                    ]
                );

            await expectErrorResponse(
                response,
                409,
                CHANGED_DOCUMENTS_MESSAGE
            );

            const after =
                await expectPendingResponse(
                    await getPending(
                        request,
                        PENDING_TOKEN
                    )
                );

            expect(isDeepStrictEqual(after, before), 'Las respuestas deben conservar su contenido').toBe(true);
        });


        test('rechaza aceptación parcial cuando existen dos documentos pendientes', async ({ request }) => {

            requirePendingAccount();

            requireIndependentPendingAccount();

            requireMutationPermission();

            test.skip(
                PENDING_COUNT !== '2',

                'Requiere dos documentos pendientes'
            );

            const before =
                await expectPendingResponse(
                    await getPending(
                        request,
                        PENDING_TOKEN
                    )
                );

            expect(before.documentos_pendientes.length).toBe(2);

            const pendingIds =
                getPendingDocumentIds(before);

            const response =
                await registerAcceptances(
                    request,
                    PENDING_TOKEN,
                    [pendingIds[0]]
                );

            await expectErrorResponse(
                response,
                409,
                REQUIRED_PENDING_DOCUMENTS_MESSAGE
            );

            const after =
                await expectPendingResponse(
                    await getPending(
                        request,
                        PENDING_TOKEN
                    )
                );

            expect(isDeepStrictEqual(after, before), 'Las respuestas deben conservar su contenido').toBe(true);
        });


        test('rechaza un documento ya aceptado si todavía existe otro pendiente', async ({ request }) => {

            requirePendingAccount();

            requireIndependentPendingAccount();

            requireMutationPermission();

            test.skip(
                PENDING_COUNT !== '1',

                'Requiere exactamente un documento pendiente'
            );

            const before =
                await expectPendingResponse(
                    await getPending(
                        request,
                        PENDING_TOKEN
                    )
                );

            expect(before.documentos_pendientes.length).toBe(1);

            const activeIds =
                await getActiveDocumentIds(request);

            const pendingIds =
                getPendingDocumentIds(before);

            const acceptedId =
                activeIds.find(
                    id => !pendingIds.includes(id)
                );

            expect(acceptedId)
                .toBeDefined();

            const response =
                await registerAcceptances(
                    request,
                    PENDING_TOKEN,
                    [acceptedId]
                );

            await expectErrorResponse(
                response,
                409,
                REQUIRED_PENDING_DOCUMENTS_MESSAGE
            );

            const after =
                await expectPendingResponse(
                    await getPending(
                        request,
                        PENDING_TOKEN
                    )
                );

            expect(isDeepStrictEqual(after, before), 'Las respuestas deben conservar su contenido').toBe(true);
        });


        test('rechaza documentos duplicados con token real', async ({ request }) => {

            requirePendingAccount();

            requireIndependentPendingAccount();

            const before =
                await expectPendingResponse(
                    await getPending(
                        request,
                        PENDING_TOKEN
                    )
                );

            expect(before.documentos_pendientes.length).toBe(Number(PENDING_COUNT));

            const pendingIds =
                getPendingDocumentIds(before);

            const response =
                await registerAcceptances(
                    request,
                    PENDING_TOKEN,
                    [
                        pendingIds[0],
                        pendingIds[0]
                    ]
                );

            await expectErrorResponse(
                response,
                400,
                'Los documentos legales no pueden estar duplicados'
            );

            const after =
                await expectPendingResponse(
                    await getPending(
                        request,
                        PENDING_TOKEN
                    )
                );

            expect(isDeepStrictEqual(after, before), 'Las respuestas deben conservar su contenido').toBe(true);
        });


        /*
         * MUTACIÓN REAL:
         *
         * Completa las aceptaciones pendientes.
         *
         * Comprueba también que repetir la operación
         * no genere un error de duplicidad.
         */

        test('registra todas las aceptaciones pendientes y permite repetir la operación', async ({ request }) => {

            requirePendingAccount();

            requireIndependentPendingAccount();

            requireMutationPermission();

            const before =
                await expectPendingResponse(
                    await getPending(
                        request,
                        PENDING_TOKEN
                    )
                );

            expect(before.aceptaciones_completas === false, 'Deben existir aceptaciones pendientes').toBe(true);

            expect(before.documentos_pendientes.length).toBe(Number(PENDING_COUNT));

            const pendingIds =
                getPendingDocumentIds(before);

            const response =
                await registerAcceptances(
                    request,
                    PENDING_TOKEN,
                    pendingIds
                );

            await expectCompleteAcceptances(response);

            /*
             * Verifica el estado persistido mediante
             * una solicitud HTTP independiente.
             */

            await expectCompleteAcceptances(
                await getPending(
                    request,
                    PENDING_TOKEN
                )
            );

            /*
             * El repositorio utiliza:
             *
             * ON CONFLICT DO NOTHING
             *
             * Repetir la aceptación debe conservar
             * el estado funcional completo.
             */

            const repeated =
                await registerAcceptances(
                    request,
                    PENDING_TOKEN,
                    pendingIds
                );

            await expectCompleteAcceptances(repeated);

            await expectCompleteAcceptances(
                await getPending(
                    request,
                    PENDING_TOKEN
                )
            );
        });
    });
});