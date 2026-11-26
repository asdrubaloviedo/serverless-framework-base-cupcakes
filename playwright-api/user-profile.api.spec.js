'use strict';

const { test, expect } = require('@playwright/test');

const {
    baseURL,
    environment
} = require('./config/environments');

const {
    authorizationHeaders,
    secureRequest,
    secureGet
} = require('./utils/secure-request');

const url = `${baseURL}usuarios/consultar-usuario`;

const accounts = [
    {
        name: 'tradicional',
        token: process.env.TEST_LEGAL_TRADITIONAL_ID_TOKEN,
        state: process.env.TEST_LEGAL_TRADITIONAL_ACCOUNT_STATE,
        email: process.env.TEST_LEGAL_TRADITIONAL_EMAIL
    },
    {
        name: 'Google',
        token: process.env.TEST_LEGAL_GOOGLE_ID_TOKEN,
        state: process.env.TEST_LEGAL_GOOGLE_ACCOUNT_STATE,
        email: process.env.TEST_LEGAL_GOOGLE_EMAIL
    }
];

/**
 * Obtiene el cuerpo JSON sin propagar errores
 * que puedan contener información sensible.
 */
async function readJson(response) {
    try {
        return await response.json();
    } catch {
        throw new Error(
            'La respuesta HTTP no contiene un JSON válido.'
        );
    }
}

/**
 * Valida una respuesta HTTP de error sin imprimir
 * el contenido completo del cuerpo.
 */
async function expectError(response, status) {
    expect(response.status()).toBe(status);

    const body = await readJson(response);

    const validBody = (
        body !== null &&
        typeof body === 'object' &&
        !Array.isArray(body) &&
        Object.keys(body).length === 1 &&
        Object.prototype.hasOwnProperty.call(body, 'message') &&
        typeof body.message === 'string' &&
        body.message.trim().length > 0
    );

    expect(
        validBody,
        'La respuesta debe contener exclusivamente un mensaje de error válido'
    ).toBe(true);
}

/**
 * Valida el contrato de respuesta del perfil.
 *
 * Las aserciones sobre información personal se realizan
 * mediante valores booleanos para evitar que los datos
 * originales aparezcan en los reportes de Playwright.
 */
async function expectProfile(response, email) {
    expect(response.status()).toBe(200);

    const responseHeaders = response.headers();

    expect(
        typeof responseHeaders['cache-control'] === 'string' &&
        responseHeaders['cache-control'].includes('no-store'),
        'La respuesta debe impedir el almacenamiento en caché'
    ).toBe(true);

    const body = await readJson(response);

    expect(
        Array.isArray(body),
        'La respuesta debe ser un arreglo'
    ).toBe(true);

    expect(body.length).toBe(1);

    const user = body[0];

    expect(
        user !== null &&
        typeof user === 'object' &&
        !Array.isArray(user),
        'El perfil debe ser un objeto válido'
    ).toBe(true);

    const validProfile = (
        typeof user.usuario_id === 'number' &&
        typeof user.email === 'string' &&
        typeof user.avatar_id === 'number' &&
        typeof user.avatar_nombre === 'string' &&
        typeof user.avatar_url === 'string'
    );

    expect(
        validProfile,
        'El perfil debe cumplir el contrato de respuesta'
    ).toBe(true);

    expect(
        Number.isSafeInteger(user.usuario_id),
        'El identificador del usuario debe ser un entero seguro'
    ).toBe(true);

    expect(
        user.usuario_id > 0,
        'El identificador del usuario debe ser positivo'
    ).toBe(true);

    if (email) {
        expect(
            user.email === email.trim().toLowerCase(),
            'El correo del perfil debe coincidir con la cuenta autenticada'
        ).toBe(true);
    }

    const forbiddenFields = [
        'password',
        'idToken',
        'firebase_uid',
        'documentoLegalIds',
        'documentos_pendientes'
    ];

    for (const field of forbiddenFields) {
        expect(
            Object.prototype.hasOwnProperty.call(user, field),
            `El perfil no debe exponer el campo ${field}`
        ).toBe(false);
    }

    return user;
}

test.use({
    trace: 'off'
});

test.describe('API - Consulta de perfil autenticado', () => {

    test.beforeEach(() => {
        test.skip(
            environment !== 'dev',
            'Exclusivamente AWS DEV'
        );
    });

    /**
     * Autenticación sin token.
     */
    test('sin token: 401', async ({ request }) => {
        const response = await secureGet(
            request,
            url
        );

        await expectError(response, 401);
    });

    /**
     * Autenticación con token inválido.
     */
    test('token inválido: 401', async ({ request }) => {
        const response = await secureGet(
            request,
            url,
            {
                headers: authorizationHeaders(
                    'invalid-firebase-token-for-profile-tests'
                )
            }
        );

        await expectError(response, 401);
    });

    /**
     * Validación de tokens especiales.
     */
    const tokenScenarios = [
        [
            'expirado',
            process.env.TEST_LEGAL_EXPIRED_ID_TOKEN,
            401
        ],
        [
            'revocado',
            process.env.TEST_LEGAL_REVOKED_ID_TOKEN,
            401
        ],
        [
            'proveedor no autorizado',
            process.env.TEST_LEGAL_UNSUPPORTED_PROVIDER_ID_TOKEN,
            403
        ],
        [
            'Google sin correo verificado',
            process.env.TEST_LEGAL_UNVERIFIED_GOOGLE_ID_TOKEN,
            403
        ]
    ];

    for (const [name, token, status] of tokenScenarios) {

        test(`token ${name}: ${status}`, async ({ request }) => {

            test.skip(
                !token,
                'Requiere token de prueba específico'
            );

            const response = await secureGet(
                request,
                url,
                {
                    headers: authorizationHeaders(token)
                }
            );

            await expectError(response, status);
        });
    }

    /**
     * Protección frente a parámetros de identidad
     * enviados por el cliente.
     */
    const forbiddenQueryParams = {
        email: 'other@example.com',
        firebaseUid: 'other-uid',
        usuario_id: '999'
    };

    for (
        const [field, value]
        of Object.entries(forbiddenQueryParams)
    ) {

        test(`rechaza query ${field}: 400`, async ({ request }) => {

            const response = await secureGet(
                request,
                url,
                {
                    params: {
                        [field]: value
                    }
                }
            );

            await expectError(response, 400);
        });
    }

    /**
     * CloudFront rechaza solicitudes GET con body
     * antes de que lleguen a la Lambda.
     */
    test('CloudFront rechaza GET con body: 403', async ({ request }) => {

        const response = await secureRequest(
            request,
            'GET',
            url,
            {
                data: {
                    email: 'other@example.com'
                }
            }
        );

        expect(response.status()).toBe(403);

        const responseHeaders = response.headers();

        expect(
            /cloudfront/i.test(
                responseHeaders['server'] || ''
            ),
            'La respuesta debe proceder de CloudFront'
        ).toBe(true);

        expect(
            /error from cloudfront/i.test(
                responseHeaders['x-cache'] || ''
            ),
            'CloudFront debe identificar la respuesta como un error'
        ).toBe(true);

        expect(
            /text\/html/i.test(
                responseHeaders['content-type'] || ''
            ),
            'CloudFront debe devolver una respuesta HTML'
        ).toBe(true);

        let responseText;

        try {
            responseText = await response.text();
        } catch {
            throw new Error(
                'No fue posible leer la respuesta de CloudFront.'
            );
        }

        expect(
            /Generated by cloudfront/i.test(responseText),
            'El contenido debe identificar a CloudFront como origen del error'
        ).toBe(true);
    });

    /**
     * Consulta de perfil mediante autenticación
     * tradicional y Google.
     */
    for (const account of accounts) {

        test(`${account.name}: perfil registrado`, async ({ request }) => {

            test.skip(
                !account.token ||
                account.state !== 'registered' ||
                !account.email,
                'Requiere cuenta registrada y correo esperado'
            );

            const response = await secureGet(
                request,
                url,
                {
                    headers: authorizationHeaders(
                        account.token
                    )
                }
            );

            await expectProfile(
                response,
                account.email
            );
        });

        test(`${account.name}: cuenta no registrada: 404`, async ({ request }) => {

            test.skip(
                !account.token ||
                account.state !== 'unregistered',
                'Requiere cuenta Firebase sin registro en PostgreSQL'
            );

            const response = await secureGet(
                request,
                url,
                {
                    headers: authorizationHeaders(
                        account.token
                    )
                }
            );

            await expectError(response, 404);
        });
    }

    /**
     * Verifica el aislamiento de información entre
     * dos usuarios autenticados diferentes.
     */
    test('dos cuentas distintas reciben exclusivamente su propio perfil', async ({ request }) => {

        test.skip(
            accounts.some(account => (
                !account.token ||
                account.state !== 'registered' ||
                !account.email
            )),
            'Requiere dos cuentas registradas con correos esperados'
        );

        expect(
            accounts[0].email.trim().toLowerCase() !==
            accounts[1].email.trim().toLowerCase(),
            'Las cuentas de prueba deben tener correos diferentes'
        ).toBe(true);

        const firstResponse = await secureGet(
            request,
            url,
            {
                headers: authorizationHeaders(
                    accounts[0].token
                )
            }
        );

        const first = await expectProfile(
            firstResponse,
            accounts[0].email
        );

        const secondResponse = await secureGet(
            request,
            url,
            {
                headers: authorizationHeaders(
                    accounts[1].token
                )
            }
        );

        const second = await expectProfile(
            secondResponse,
            accounts[1].email
        );

        expect(
            first.usuario_id !== second.usuario_id,
            'Cada cuenta debe recibir exclusivamente su propio perfil'
        ).toBe(true);
    });
});