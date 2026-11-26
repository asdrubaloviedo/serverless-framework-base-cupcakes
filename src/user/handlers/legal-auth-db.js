
require('module-alias/register');

const z = require('zod');

const LegalAuthDatabase = require(
    '@user/services/user/LegalAuthDatabase'
);


/*
 * =========================================================
 * REUSABLE SCHEMA FIELDS
 * =========================================================
 */

const emailRequired = z.string()
    .trim()
    .email()
    .transform(
        (value) => value.toLowerCase()
    );


/*
 * UID obtenido desde el token validado por Firebase.
 *
 * Distingue mayúsculas y minúsculas.
 * No debe normalizarse ni modificarse.
 */
const firebaseUidRequired = z.string()
    .min(1)
    .max(128)
    .refine(
        (value) => value.trim().length > 0,
        {
            message: 'Identidad de usuario no válida'
        }
    );


/*
 * Identificadores de documentos legales.
 *
 * Deben ser números enteros positivos
 * y no pueden estar duplicados.
 */
const legalDocumentIdsSchema = z.array(
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
    );


/*
 * =========================================================
 * INTERNAL REQUEST SCHEMA
 * =========================================================
 *
 * Valida exclusivamente los parámetros enviados
 * por la Lambda pública de autenticación legal.
 */

const internalSchema = z.discriminatedUnion(
    'action',
    [
        /*
         * Registro tradicional.
         *
         * Requiere aceptar los dos documentos legales
         * obligatorios durante la creación de la cuenta.
         */
        z.object({

            action: z.literal('register-traditional'),

            email: emailRequired,

            firebaseUid: firebaseUidRequired,

            nombre: z.string()
                .trim()
                .min(2)
                .max(50)
                .transform(
                    (value) => value.replace(/\s+/g, ' ')
                ),

            pais: z.string()
                .trim()
                .regex(/^[A-Za-z]{3}$/)
                .transform(
                    (value) => value.toUpperCase()
                )
                .default('PER'),

            documentoLegalIds: legalDocumentIdsSchema
                .length(2)

        }).strict(),


        /*
         * Consulta del perfil del usuario autenticado.
         *
         * Requiere exclusivamente el Firebase UID obtenido
         * desde la identidad previamente autenticada.
         *
         * No crea usuarios ni registra aceptaciones legales.
         */
        z.object({

            action: z.literal('get-user-profile'),

            firebaseUid: firebaseUidRequired

        }).strict(),


        /*
         * Consulta de documentos legales pendientes
         * de aceptación mediante Firebase UID.
         */
        z.object({

            action: z.literal('get-pending-acceptances'),

            firebaseUid: firebaseUidRequired

        }).strict(),


        /*
         * Registro de aceptaciones posteriores.
         *
         * El usuario puede tener uno o dos documentos
         * pendientes de aceptación.
         */
        z.object({

            action: z.literal('register-acceptances'),

            firebaseUid: firebaseUidRequired,

            documentoLegalIds: legalDocumentIdsSchema

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
 * LEGAL AUTH DATABASE HANDLER
 * =========================================================
 *
 * Esta Lambda se ejecuta dentro de la VPC.
 *
 * No tiene un endpoint HTTP público.
 *
 * Responsabilidades:
 *
 * 1. Validar los parámetros internos.
 * 2. Registrar usuarios tradicionales con Firebase UID.
 * 3. Consultar el perfil del usuario autenticado.
 * 4. Consultar aceptaciones legales pendientes.
 * 5. Registrar aceptaciones legales posteriores.
 * 6. Devolver el resultado a la Lambda pública.
 *
 * La autorización de la invocación se controla mediante IAM.
 */

const handler = async (event) => {

    try {

        const validation =
            internalSchema.safeParse(event);

        if (!validation.success) {

            console.warn(
                '[LegalAuthDB] Solicitud interna inválida'
            );

            return fail(
                400,
                'Parámetros internos inválidos'
            );
        }

        const params = validation.data;

        console.log(
            '[LegalAuthDB] Iniciando operación',
            {
                action: params.action
            }
        );

        const result =
            await LegalAuthDatabase.execute(params);

        console.log(
            '[LegalAuthDB] Operación completada',
            {
                action: params.action
            }
        );

        return result;

    } catch (error) {

        const allowedCodes = [
            400,
            401,
            403,
            404,
            409,
            503
        ];

        const statusCode =
            allowedCodes.includes(error?.statusCode)
                ? error.statusCode
                : 500;

        console.error(
            '[LegalAuthDB] Error',
            {
                statusCode,
                code: error?.code
            }
        );

        return fail(
            statusCode,
            statusCode === 500 ||
                typeof error?.message !== 'string'
                ? 'Error interno del servidor'
                : error.message
        );
    }
};


module.exports = {
    handler
};
