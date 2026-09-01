require('module-alias/register');

const {
    GeneratePasswordResetLink,
    SendPasswordResetEmail
} = require('@user/services/user');

const {
    validateSendPasswordResetEmail
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


const fail = (err) => {

    const code = Number(err?.statusCode) || 500;

    return {
        statusCode: code,
        body: JSON.stringify({
            message:
                err?.message ||
                'Internal server error'
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
        validateSendPasswordResetEmail(data);


    if (!result.success) {

        const issue =
            result.error.issues?.[0];

        const field =
            issue?.path?.join('.');


        const message =
            (
                issue?.code === 'invalid_type' &&
                issue?.received === 'undefined'
            )
                ? (
                    field === 'email'
                        ? 'User email is required.'
                        : 'Field is required.'
                )
                : (
                    issue?.message ||
                    'Parámetros inválidos'
                );


        throw {
            statusCode: 400,
            message,
            field
        };
    }


    return result.data;
};


/*
 * =========================================================
 * PASSWORD RESET HANDLER
 * =========================================================
 *
 * Esta Lambda está separada del resto del módulo user.
 *
 * No utiliza PostgreSQL ni necesita acceso a la VPC.
 *
 * Flujo:
 *
 * 1. Recibe y valida el email.
 * 2. Firebase Admin genera el enlace seguro.
 * 3. Amazon SES envía el correo personalizado.
 */
const handler = async (event) => {

    try {

        const {
            email
        } = validBody(event);


        /*
         * Generamos el enlace oficial de recuperación
         * utilizando Firebase Authentication.
         */
        const resetLink =
            await GeneratePasswordResetLink.execute({
                email
            });


        /*
         * Enviamos nuestro correo personalizado
         * mediante Amazon SES.
         */
        await SendPasswordResetEmail.execute({
            email,
            resetLink
        });


        /*
         * Nunca devolvemos el enlace de recuperación
         * al cliente.
         */
        return ok({
            message:
                'Password reset email sent.'
        });

    } catch (error) {

        console.error(
            'Password reset error:',
            error
        );

        return fail(error);
    }
};


module.exports = {
    handler
};