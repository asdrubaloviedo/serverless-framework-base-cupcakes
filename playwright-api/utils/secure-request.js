'use strict';

const http = require('node:http');
const https = require('node:https');
const zlib = require('node:zlib');

const REDACTED = '[REDACTED]';
const DEFAULT_TIMEOUT = 30000;
const MAX_RESPONSE_SIZE = 20 * 1024 * 1024;

const ALLOWED_METHODS = new Set([
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS'
]);

/**
 * Obtiene las credenciales sensibles disponibles
 * en las variables de entorno.
 */
function getSensitiveValues() {
    return Object.entries(process.env)
        .filter(([key, value]) => {
            return (
                typeof value === 'string' &&
                value.length > 0 &&
                /TOKEN|PASSWORD|SECRET|API_?KEY|PRIVATE_?KEY|CREDENTIAL|AUTHORIZATION/i.test(key)
            );
        })
        .map(([, value]) => value)
        .sort((a, b) => b.length - a.length);
}

/**
 * Elimina credenciales conocidas y patrones sensibles.
 */
function redactSensitiveData(value, additionalSecrets = []) {
    let result = String(value ?? '');

    const sensitiveValues = [
        ...new Set([
            ...getSensitiveValues(),
            ...additionalSecrets
        ])
    ]
        .filter(secret => (
            typeof secret === 'string' &&
            secret.length > 0
        ))
        .sort((a, b) => b.length - a.length);

    for (const secret of sensitiveValues) {
        result = result.split(secret).join(REDACTED);

        try {
            const encodedSecret = encodeURIComponent(secret);

            if (encodedSecret !== secret) {
                result = result
                    .split(encodedSecret)
                    .join(REDACTED);
            }
        } catch {
            // La credencial original ya fue redactada.
        }
    }

    result = result.replace(
        /\bBearer\s+[^\s"',;}\]]+/gi,
        `Bearer ${REDACTED}`
    );

    result = result.replace(
        /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
        REDACTED
    );

    result = result.replace(
        /((?:authorization|proxy-authorization|cookie|set-cookie|x-api-key)\s*:\s*)[^\r\n]+/gi,
        `$1${REDACTED}`
    );

    result = result.replace(
        /("(?:idToken|accessToken|refreshToken|customToken|password|privateKey|apiKey|clientSecret|authorization)"\s*:\s*)"(?:\\.|[^"\\])*"/gi,
        `$1"${REDACTED}"`
    );

    result = result.replace(
        /([?&](?:key|api_key|apiKey|token|idToken|access_token|refresh_token|password|client_secret)=)[^&#\s]+/gi,
        `$1${REDACTED}`
    );

    return result;
}

/**
 * Construye una cabecera Bearer sin registrar el token.
 */
function authorizationHeaders(token) {
    if (
        typeof token !== 'string' ||
        token.trim().length === 0
    ) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`
    };
}

/**
 * Comprueba si existe una cabecera,
 * independientemente de sus mayusculas.
 */
function hasHeader(headers, name) {
    const normalizedName = name.toLowerCase();

    return Object.keys(headers).some(
        key => key.toLowerCase() === normalizedName
    );
}

/**
 * Establece una cabecera sin generar duplicados.
 */
function setHeader(headers, name, value) {
    const normalizedName = name.toLowerCase();

    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === normalizedName) {
            delete headers[key];
        }
    }

    headers[name] = value;
}

/**
 * Construye la URL incluyendo parametros de consulta.
 */
function buildRequestUrl(url, params) {
    const target = new URL(url);

    if (
        target.protocol !== 'https:' &&
        target.protocol !== 'http:'
    ) {
        throw new Error('Protocolo HTTP no permitido');
    }

    if (target.username || target.password) {
        throw new Error('Credenciales en URL no permitidas');
    }

    // HTTP sin TLS solo se permite para pruebas
    // controladas sobre loopback.
    if (
        target.protocol === 'http:' &&
        !['127.0.0.1', 'localhost', '[::1]']
            .includes(target.hostname)
    ) {
        throw new Error('Se requiere una conexion HTTPS');
    }

    if (params === undefined || params === null) {
        return target;
    }

    if (
        typeof params === 'string' ||
        params instanceof URLSearchParams
    ) {
        const searchParams = new URLSearchParams(params);

        for (const [key, value] of searchParams) {
            target.searchParams.append(key, value);
        }

        return target;
    }

    if (typeof params !== 'object') {
        throw new Error('Parametros HTTP no validos');
    }

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
            target.searchParams.append(
                key,
                String(value)
            );
        }
    }

    return target;
}

/**
 * Prepara el cuerpo HTTP sin alterar los JSON
 * malformados utilizados en las pruebas.
 */
function buildRequestBody(options, headers) {
    if (options.data === undefined) {
        return null;
    }

    const data = options.data;

    let body;

    if (Buffer.isBuffer(data)) {
        body = Buffer.from(data);

        if (!hasHeader(headers, 'content-type')) {
            setHeader(
                headers,
                'Content-Type',
                'application/octet-stream'
            );
        }

    } else if (typeof data === 'string') {
        // Conservar exactamente el texto recibido.
        body = Buffer.from(data, 'utf8');

        if (!hasHeader(headers, 'content-type')) {
            setHeader(
                headers,
                'Content-Type',
                'application/octet-stream'
            );
        }

    } else {
        // Incluye objetos, arreglos, null,
        // booleanos y valores numericos.
        const serialized = JSON.stringify(data);

        if (serialized === undefined) {
            throw new Error('Cuerpo HTTP no valido');
        }

        body = Buffer.from(serialized, 'utf8');

        if (!hasHeader(headers, 'content-type')) {
            setHeader(
                headers,
                'Content-Type',
                'application/json'
            );
        }
    }

    // Permite enviar un body incluso mediante GET.
    setHeader(
        headers,
        'Content-Length',
        String(body.length)
    );

    return body;
}

/**
 * Normaliza las cabeceras de respuesta.
 */
function normalizeResponseHeaders(headers) {
    const normalized = {};

    for (const [key, value] of Object.entries(headers)) {
        if (value === undefined) {
            continue;
        }

        normalized[key.toLowerCase()] = Array.isArray(value)
            ? value.join('\n')
            : String(value);
    }

    return normalized;
}

/**
 * Descomprime respuestas HTTP cuando corresponde.
 */
function decodeResponseBody(buffer, headers) {
    const encoding = String(
        headers['content-encoding'] || ''
    ).trim().toLowerCase();

    const limits = {
        maxOutputLength: MAX_RESPONSE_SIZE
    };

    if (!encoding || encoding === 'identity') {
        return buffer;
    }

    if (encoding === 'gzip' || encoding === 'x-gzip') {
        return zlib.gunzipSync(buffer, limits);
    }

    if (encoding === 'deflate') {
        return zlib.inflateSync(buffer, limits);
    }

    if (encoding === 'br') {
        return zlib.brotliDecompressSync(buffer, limits);
    }

    throw new Error('Codificacion HTTP no soportada');
}

/**
 * Adaptador compatible con las operaciones de
 * APIResponse utilizadas por las suites actuales.
 */
function createSecureResponse(
    statusCode,
    statusMessage,
    headers,
    buffer,
    requestUrl
) {
    const responseHeaders = Object.freeze({
        ...headers
    });

    return Object.freeze({
        status() {
            return statusCode;
        },

        statusText() {
            return statusMessage;
        },

        ok() {
            return statusCode >= 200 &&
                statusCode < 300;
        },

        headers() {
            return { ...responseHeaders };
        },

        headersArray() {
            return Object.entries(responseHeaders)
                .map(([name, value]) => ({
                    name,
                    value
                }));
        },

        url() {
            return requestUrl;
        },

        async text() {
            return buffer.toString('utf8');
        },

        async json() {
            try {
                return JSON.parse(
                    buffer.toString('utf8')
                );
            } catch {
                throw new Error(
                    'La respuesta HTTP no contiene JSON valido'
                );
            }
        },

        async body() {
            return Buffer.from(buffer);
        }
    });
}

/**
 * Ejecuta una solicitud mediante HTTP nativo.
 *
 * No utiliza APIRequestContext de Playwright.
 * No sigue redirecciones automaticamente.
 * No desactiva la validacion de certificados TLS.
 */
function executeNativeRequest(
    target,
    method,
    headers,
    body,
    timeout
) {
    return new Promise((resolve, reject) => {
        const transport = target.protocol === 'https:'
            ? https
            : http;

        let settled = false;
        let timer = null;
        let clientRequest;

        function finish(error, response) {
            if (settled) {
                return;
            }

            settled = true;

            if (timer !== null) {
                clearTimeout(timer);
            }

            if (error) {
                reject(error);
                return;
            }

            resolve(response);
        }

        const requestOptions = {
            method,
            headers,
            agent: false
        };

        if (target.protocol === 'https:') {
            requestOptions.rejectUnauthorized = true;
        }

        clientRequest = transport.request(
            target,
            requestOptions,
            response => {
                const chunks = [];
                let receivedBytes = 0;

                response.on('data', chunk => {
                    if (settled) {
                        return;
                    }

                    receivedBytes += chunk.length;

                    if (receivedBytes > MAX_RESPONSE_SIZE) {
                        finish(
                            new Error(
                                'Respuesta HTTP demasiado grande'
                            )
                        );

                        response.destroy();
                        clientRequest.destroy();
                        return;
                    }

                    chunks.push(Buffer.from(chunk));
                });

                response.on('error', () => {
                    finish(
                        new Error('Error de respuesta HTTP')
                    );
                });

                response.on('aborted', () => {
                    finish(
                        new Error('Respuesta HTTP interrumpida')
                    );
                });

                response.on('close', () => {
                    if (!response.complete) {
                        finish(
                            new Error('Respuesta HTTP incompleta')
                        );
                    }
                });

                response.on('end', () => {
                    if (settled) {
                        return;
                    }

                    try {
                        const responseHeaders =
                            normalizeResponseHeaders(
                                response.headers
                            );

                        const rawBody = Buffer.concat(chunks);

                        const decodedBody = rawBody.length === 0
                            ? rawBody
                            : decodeResponseBody(
                                rawBody,
                                responseHeaders
                            );

                        if (decodedBody.length > MAX_RESPONSE_SIZE) {
                            throw new Error(
                                'Respuesta HTTP demasiado grande'
                            );
                        }

                        finish(
                            null,
                            createSecureResponse(
                                response.statusCode || 0,
                                response.statusMessage || '',
                                responseHeaders,
                                decodedBody,
                                target.toString()
                            )
                        );

                    } catch {
                        finish(
                            new Error(
                                'No fue posible procesar la respuesta HTTP'
                            )
                        );
                    }
                });
            }
        );

        clientRequest.on('error', () => {
            finish(
                new Error('Error de transporte HTTP')
            );
        });

        if (timeout > 0) {
            timer = setTimeout(() => {
                finish(
                    new Error('Tiempo de espera HTTP agotado')
                );

                clientRequest.destroy();
            }, timeout);
        }

        if (body !== null) {
            clientRequest.end(body);
        } else {
            clientRequest.end();
        }
    });
}

/**
 * Ejecuta una solicitud HTTP protegida.
 *
 * El argumento request se conserva exclusivamente
 * por compatibilidad con las suites existentes.
 *
 * Nunca se utiliza request.fetch().
 */
async function secureRequest(
    request,
    method,
    url,
    options = {}
) {
    const normalizedMethod = String(method ?? '')
        .trim()
        .toUpperCase();

    if (!ALLOWED_METHODS.has(normalizedMethod)) {
        throw new Error('Metodo HTTP no permitido');
    }

    if (
        typeof url !== 'string' ||
        url.trim().length === 0
    ) {
        throw new Error('URL de solicitud no valida');
    }

    try {
        const allowedOptions = new Set([
            'headers',
            'params',
            'data',
            'timeout',
            'failOnStatusCode',
            'maxRedirects'
        ]);

        for (const key of Object.keys(options)) {
            if (!allowedOptions.has(key)) {
                throw new Error(
                    'Opcion HTTP no soportada'
                );
            }
        }

        const target = buildRequestUrl(
            url,
            options.params
        );

        const headers = {
            ...options.headers
        };

        if (!hasHeader(headers, 'accept')) {
            setHeader(
                headers,
                'Accept',
                'application/json'
            );
        }

        if (!hasHeader(headers, 'accept-encoding')) {
            setHeader(
                headers,
                'Accept-Encoding',
                'identity'
            );
        }

        const timeout = options.timeout ?? DEFAULT_TIMEOUT;

        if (
            !Number.isSafeInteger(timeout) ||
            timeout < 0 ||
            timeout > 2147483647
        ) {
            throw new Error(
                'Tiempo de espera HTTP no valido'
            );
        }

        const body = buildRequestBody(
            options,
            headers
        );

        return await executeNativeRequest(
            target,
            normalizedMethod,
            headers,
            body,
            timeout
        );

    } catch {
        // Nunca propagar errores originales, cabeceras,
        // cuerpos HTTP, tokens ni registros de transporte.
        throw new Error(
            `No fue posible completar la solicitud HTTP ${normalizedMethod}. ` +
            'Los detalles originales se han omitido por seguridad.'
        );
    }
}

/**
 * Ejecuta una solicitud GET protegida.
 */
async function secureGet(request, url, options = {}) {
    return secureRequest(
        request,
        'GET',
        url,
        options
    );
}

/**
 * Ejecuta una solicitud POST protegida.
 */
async function securePost(request, url, options = {}) {
    return secureRequest(
        request,
        'POST',
        url,
        options
    );
}

/**
 * Ejecuta una solicitud PUT protegida.
 */
async function securePut(request, url, options = {}) {
    return secureRequest(
        request,
        'PUT',
        url,
        options
    );
}

/**
 * Ejecuta una solicitud PATCH protegida.
 */
async function securePatch(request, url, options = {}) {
    return secureRequest(
        request,
        'PATCH',
        url,
        options
    );
}

/**
 * Ejecuta una solicitud DELETE protegida.
 */
async function secureDelete(request, url, options = {}) {
    return secureRequest(
        request,
        'DELETE',
        url,
        options
    );
}

module.exports = {
    redactSensitiveData,
    authorizationHeaders,
    secureRequest,
    secureGet,
    securePost,
    securePut,
    securePatch,
    secureDelete
};