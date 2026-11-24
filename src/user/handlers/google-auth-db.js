require('module-alias/register');

const z = require('zod');

const GoogleAuthDatabase = require(
    '@user/services/user/GoogleAuthDatabase'
);


/*
 * =========================================================
 * INTERNAL REQUEST SCHEMA
 * =========================================================
 *
 * Valida exclusivamente los parámetros enviados
 * por la Lambda de autenticación con Google.
 */

const internalSchema = z.discriminatedUnion(
    'action',
    [
        z.object({

            action: z.literal('login'),

            email: z.string()
                .trim()
                .email()
                .transform(
                    (value) => value.toLowerCase()
                )

        }).strict(),

        z.object({

            action: z.literal('register'),

            email: z.string()
                .trim()
                .email()
                .transform(
                    (value) => value.toLowerCase()
                ),

            nombre: z.string()
                .trim()
                .min(1)

        }).strict()
    ]
);


/*
 * =========================================================
 * RESPONSE HELPERS
 * =========================================================
 */

const fail = (statusCode, message) => ({
    success: false,
    statusCode,
    message
});


/*
 * =========================================================
 * GOOGLE AUTH DATABASE HANDLER
 * =========================================================
 *
 * Esta Lambda se ejecuta dentro de la VPC.
 *
 * No tiene un endpoint HTTP público.
 *
 * Responsabilidades:
 *
 * 1. Validar los parámetros internos.
 * 2. Consultar usuarios registrados.
 * 3. Registrar nuevos usuarios.
 * 4. Devolver el resultado a la Lambda de Google Auth.
 *
 * La autorización de la invocación se controla mediante IAM.
 */

const handler = async (event) => {

    try {

        const validation =
            internalSchema.safeParse(event);

        if (!validation.success) {

            console.warn(
                '[GoogleAuthDB] Solicitud interna inválida'
            );

            return fail(
                400,
                'Parámetros internos inválidos'
            );
        }

        const params = validation.data;

        console.log(
            '[GoogleAuthDB] Iniciando operación',
            {
                action: params.action
            }
        );

        const result =
            await GoogleAuthDatabase.execute(params);

        console.log(
            '[GoogleAuthDB] Operación completada',
            {
                action: params.action
            }
        );

        return result;

    } catch (error) {

        const allowedCodes = [
            400,
            404,
            409
        ];

        const statusCode =
            allowedCodes.includes(error?.statusCode)
                ? error.statusCode
                : 500;

        console.error(
            '[GoogleAuthDB] Error',
            {
                statusCode,
                code: error?.code
            }
        );

        return fail(
            statusCode,
            statusCode === 500
                ? 'Error interno del servidor'
                : error.message
        );
    }
};


module.exports = {
    handler
};