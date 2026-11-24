require('module-alias/register');

const GoogleAuthUser = require(
    '@user/services/user/GoogleAuthUser'
);

const {
    validateGoogleAuthUser
} = require('@user/schema/user');


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

    const statusCode =
        Number(error?.statusCode) || 500;

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

    if (!event?.body) {
        return {};
    }

    try {

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


const validBody = (event) => {

    const data = json(event);

    const result =
        validateGoogleAuthUser(data);

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
 * GOOGLE AUTH HANDLER
 * =========================================================
 *
 * Esta Lambda se ejecuta fuera de la VPC.
 *
 * Responsabilidades:
 *
 * 1. Validar la solicitud recibida desde Android.
 * 2. Verificar el token mediante Firebase Admin.
 * 3. Solicitar la operación a la Lambda interna.
 * 4. Devolver el resultado al cliente.
 *
 * No accede directamente a PostgreSQL en DEV y PROD.
 */

const handler = async (event) => {

    try {

        const params = validBody(event);

        const result =
            await GoogleAuthUser.execute(params);

        return ok(result);

    } catch (error) {

        console.error(
            '[GoogleAuthHandler] Error',
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