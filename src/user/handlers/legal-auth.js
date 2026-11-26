
require('module-alias/register');

const z = require('zod');

const LegalAuthService = require(
    '@user/services/user/LegalAuthService'
);

const LegalAuthLambdaService = require(
    '@user/services/user/LegalAuthLambdaService'
);

const {
    validateCreateUser
} = require('@user/schema/user');


/*
 * =========================================================
 * REQUEST SCHEMAS
 * =========================================================
 */

/*
 * La consulta de aceptaciones no requiere parámetros.
 *
 * La identidad se obtiene exclusivamente del token
 * de Firebase.
 */
const getPendingAcceptancesSchema = z.object({})
    .strict();


/*
 * Registro de aceptaciones legales posteriores.
 *
 * El usuario puede tener uno o dos documentos pendientes.
 */
const registerAcceptancesSchema = z.object({

    documentoLegalIds: z.array(
        z.number()
            .int()
            .positive()
    )
        .min(1)
        .max(2)
        .refine(
            (ids) => new Set(ids).size === ids.length,
            {
                message: 'Los documentos legales no pueden estar duplicados'
            }
        )

}).strict();


/*
 * =========================================================
 * RESPONSE HELPERS
 * =========================================================
 */

const ok = (body, code = 200) => ({
    statusCode: code,
    body: JSON.stringify(body)
});


const fail = (error) => {

    const allowedCodes = [
        400,
        401,
        403,
        404,
        405,
        409,
        500,
        502,
        503
    ];

    const statusCode = allowedCodes.includes(
        error?.statusCode
    )
        ? error.statusCode
        : 500;

    const message =
        statusCode === 500
            ? 'Error interno del servidor'
            : (
                error?.message ||
                'No fue posible completar la operación'
            );

    return {
        statusCode,
        body: JSON.stringify({
            message
        })
    };
};


/*
 * =========================================================
 * REQUEST HELPERS
 * =========================================================
 */

const json = (event) => {

    if (
        event?.body === undefined ||
        event?.body === null ||
        event?.body === ''
    ) {
        return {};
    }

    try {

        if (event.isBase64Encoded === true) {

            return JSON.parse(
                Buffer.from(
                    event.body,
                    'base64'
                ).toString('utf8')
            );
        }

        return typeof event.body === 'string'
            ? JSON.parse(event.body)
            : event.body;

    } catch {

        throw {
            statusCode: 400,
            message: 'JSON inválido'
        };
    }
};


const validBody = (event, validator) => {

    const data = json(event);

    const result = validator(data);

    if (!result.success) {

        const issue =
            result.error.issues?.[0];

        throw {
            statusCode: 400,
            message:
                issue?.message ||
                'Parámetros inválidos'
        };
    }

    return result.data;
};


/*
 * =========================================================
 * ROUTE HELPERS
 * =========================================================
 */

const methodOf = (event) => (
    event?.httpMethod ||
    event?.requestContext?.http?.method ||
    ''
).toUpperCase();


const ensureSlash = (value) => (
    value
        ? (
            value.startsWith('/')
                ? value
                : `/${value}`
        )
        : ''
);


const strip = (path, prefix) => {

    if (!prefix) {
        return path;
    }

    if (path === prefix) {
        return '/';
    }

    if (path.startsWith(prefix + '/')) {
        return path.slice(prefix.length);
    }

    return path;
};


const normalize = (event) => {

    let path =
        event.rawPath ||
        event.path ||
        '/';

    const stage = event.requestContext?.stage
        ? `/${event.requestContext.stage}`
        : '';

    path = strip(path, stage);

    const root = ensureSlash(
        process.env.ENDPOINT_ROOT || 'cupcakeslife'
    );

    path = strip(path, root);

    const userModule = ensureSlash(
        process.env.USER_MODULE || 'usuarios'
    );

    path = strip(path, userModule);

    if (!path.startsWith('/')) {
        path = `/${path}`;
    }

    if (
        path.length > 1 &&
        path.endsWith('/')
    ) {
        path = path.slice(0, -1);
    }

    return path;
};


/*
 * =========================================================
 * REGISTER TRADITIONAL USER
 * =========================================================
 */

const registerTraditional = async (event) => {

    const params = validBody(
        event,
        validateCreateUser
    );

    /*
     * Verificamos la identidad mediante Firebase.
     */
    const identity =
        await LegalAuthService.authenticate(
            event.headers
        );

    /*
     * Esta operación corresponde exclusivamente
     * al registro tradicional.
     */
    if (identity.provider !== 'password') {

        throw {
            statusCode: 403,
            message: 'Método de registro no válido'
        };
    }

    /*
     * El correo recibido en el body debe coincidir
     * con el correo autenticado mediante Firebase.
     */
    if (params.email !== identity.email) {

        throw {
            statusCode: 403,
            message: 'El correo no coincide con la identidad autenticada'
        };
    }

    /*
     * Enviamos únicamente los parámetros necesarios
     * a la Lambda interna.
     *
     * El correo y el UID proceden de la identidad
     * autenticada mediante Firebase, no del body.
     */
    const result =
        await LegalAuthLambdaService.execute({

            action: 'register-traditional',

            email: identity.email,

            firebaseUid: identity.uid,

            nombre: params.nombre,

            pais: params.pais,

            documentoLegalIds:
                params.documentoLegalIds
        });

    /*
     * Conservamos el formato de respuesta original
     * del registro tradicional.
     */
    if (!Array.isArray(result.usuario)) {

        throw {
            statusCode: 502,
            message: 'Respuesta interna inválida'
        };
    }

    return result.usuario;
};


/*
 * =========================================================
 * GET USER PROFILE
 * =========================================================
 *
 * Consulta los datos del perfil y avatar del usuario
 * autenticado.
 *
 * No crea usuarios.
 * No modifica registros.
 * No registra aceptaciones legales.
 */

const getUserProfile = async (event) => {

    /*
     * La consulta no admite parámetros de identificación
     * enviados por el cliente.
     */
    if (
        Object.keys(
            event.queryStringParameters || {}
        ).length > 0 ||
        Object.keys(
            event.multiValueQueryStringParameters || {}
        ).length > 0 ||
        Boolean(event.rawQueryString)
    ) {

        throw {
            statusCode: 400,
            message: 'La consulta no admite parámetros'
        };
    }

    /*
     * La operación GET no requiere body.
     */
    if (
        event.body !== undefined &&
        event.body !== null &&
        event.body !== ''
    ) {

        throw {
            statusCode: 400,
            message: 'La consulta no admite cuerpo de solicitud'
        };
    }

    /*
     * Verificamos la identidad mediante Firebase.
     *
     * Se admiten usuarios tradicionales y de Google
     * conforme a las validaciones de LegalAuthService.
     */
    const identity =
        await LegalAuthService.authenticate(
            event.headers
        );

    /*
     * El UID procede exclusivamente del token
     * previamente autenticado.
     */
    const result =
        await LegalAuthLambdaService.execute({

            action: 'get-user-profile',

            firebaseUid: identity.uid
        });

    /*
     * La respuesta interna debe contener exactamente
     * un usuario.
     */
    if (
        !Array.isArray(result?.usuario) ||
        result.usuario.length !== 1 ||
        !result.usuario[0] ||
        typeof result.usuario[0] !== 'object' ||
        Array.isArray(result.usuario[0])
    ) {

        throw {
            statusCode: 502,
            message: 'Respuesta interna inválida'
        };
    }

    /*
     * Conservamos el formato de arreglo utilizado
     * por el modelo existente de Android.
     */
    return result.usuario;
};


/*
 * =========================================================
 * GET PENDING LEGAL ACCEPTANCES
 * =========================================================
 */

const getPendingAcceptances = async (event) => {

    validBody(
        event,
        (data) =>
            getPendingAcceptancesSchema.safeParse(data)
    );

    /*
     * La identidad puede corresponder a un usuario
     * tradicional o de Google.
     *
     * La consulta se realiza exclusivamente mediante
     * el UID autenticado.
     */
    const identity =
        await LegalAuthService.authenticate(
            event.headers
        );

    return LegalAuthLambdaService.execute({

        action: 'get-pending-acceptances',

        firebaseUid: identity.uid
    });
};


/*
 * =========================================================
 * REGISTER LEGAL ACCEPTANCES
 * =========================================================
 */

const registerAcceptances = async (event) => {

    const params = validBody(
        event,
        (data) =>
            registerAcceptancesSchema.safeParse(data)
    );

    const identity =
        await LegalAuthService.authenticate(
            event.headers
        );

    /*
     * Las aceptaciones se vinculan al usuario
     * mediante su UID autenticado.
     */
    return LegalAuthLambdaService.execute({

        action: 'register-acceptances',

        firebaseUid: identity.uid,

        documentoLegalIds:
            params.documentoLegalIds
    });
};


/*
 * =========================================================
 * ROUTES
 * =========================================================
 */

const routes = {

    '/insertar-usuario-nuevo':
        registerTraditional,

    '/consultar-usuario':
        getUserProfile,

    '/consultar-aceptaciones-legales':
        getPendingAcceptances,

    '/registrar-aceptaciones-legales':
        registerAcceptances
};


/*
 * =========================================================
 * LEGAL AUTH HANDLER
 * =========================================================
 *
 * Esta Lambda se ejecuta fuera de la VPC.
 *
 * Responsabilidades:
 *
 * 1. Identificar la operación solicitada.
 * 2. Validar los parámetros recibidos.
 * 3. Verificar la identidad mediante Firebase.
 * 4. Invocar la Lambda interna.
 * 5. Devolver el resultado a Android.
 *
 * No accede directamente a PostgreSQL en DEV y PROD.
 */

const handler = async (event) => {

    try {

        const method = methodOf(event);

        /*
         * Únicamente admitimos GET y POST.
         */
        if (
            method !== 'POST' &&
            method !== 'GET'
        ) {

            throw {
                statusCode: 405,
                message: 'Método HTTP no permitido'
            };
        }

        const path = normalize(event);

        /*
         * La consulta de perfil utiliza GET.
         *
         * Las operaciones anteriores conservan POST.
         */
        const expectedMethod =
            path === '/consultar-usuario'
                ? 'GET'
                : 'POST';

        if (method !== expectedMethod) {

            throw {
                statusCode: 405,
                message: 'Método HTTP no permitido'
            };
        }

        const fn = routes[path];

        if (typeof fn !== 'function') {

            throw {
                statusCode: 404,
                message: 'Endpoint no encontrado'
            };
        }

        console.log(
            '[LegalAuthHandler] Iniciando operación',
            {
                path
            }
        );

        const result = await fn(event);

        console.log(
            '[LegalAuthHandler] Operación completada',
            {
                path
            }
        );

        /*
         * Evitamos el almacenamiento en caché de los
         * datos personales devueltos por la consulta.
         */
        if (path === '/consultar-usuario') {

            return {
                ...ok(result),
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store'
                }
            };
        }

        return ok(result);

    } catch (error) {

        console.error(
            '[LegalAuthHandler] Error',
            {
                statusCode: error?.statusCode,
                code: error?.code
            }
        );

        return fail(error);
    }
};


module.exports = {
    handler
};
