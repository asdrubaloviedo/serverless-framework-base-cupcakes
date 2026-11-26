
"use strict";

const UserController = require(
    '@user/controller/user'
);

/*
 * =========================================================
 * LEGAL AUTH DATABASE
 * =========================================================
 *
 * Procesa las operaciones autenticadas que requieren acceso
 * a PostgreSQL.
 *
 * Este servicio se ejecuta dentro de la Lambda interna
 * o directamente en el entorno LOCAL.
 *
 * La identidad del usuario debe haber sido verificada
 * previamente por la Lambda pública mediante Firebase.
 */
class LegalAuthDatabase {

    static async execute(params = {}) {

        const {
            action,
            email,
            firebaseUid,
            nombre,
            pais = 'PER',
            documentoLegalIds
        } = params;

        /*
         * =================================================
         * REGISTRO TRADICIONAL
         * =================================================
         */
        if (action === 'register-traditional') {

            this.validateEmail(email);
            this.validateFirebaseUid(firebaseUid);

            const usuario =
                await UserController.createOneUser({
                    nombre,
                    email,
                    firebaseUid,
                    pais,
                    documentoLegalIds
                });

            return {
                success: true,
                usuario
            };
        }

        /*
         * =================================================
         * CONSULTAR PERFIL DEL USUARIO
         * =================================================
         *
         * Consulta exclusivamente los datos del usuario
         * existente y su avatar mediante Firebase UID.
         *
         * No requiere recibir el correo electrónico.
         *
         * No crea usuarios.
         * No modifica registros.
         * No registra aceptaciones legales.
         */
        if (action === 'get-user-profile') {

            this.validateFirebaseUid(firebaseUid);

            const usuario =
                await UserController.getUserProfile({
                    firebaseUid
                });

            return {
                success: true,
                usuario
            };
        }

        /*
         * =================================================
         * CONSULTAR ACEPTACIONES PENDIENTES
         * =================================================
         */
        if (action === 'get-pending-acceptances') {

            this.validateFirebaseUid(firebaseUid);

            return UserController.getPendingLegalAcceptances({
                firebaseUid
            });
        }

        /*
         * =================================================
         * REGISTRAR ACEPTACIONES POSTERIORES
         * =================================================
         */
        if (action === 'register-acceptances') {

            this.validateFirebaseUid(firebaseUid);

            return UserController.registerLegalAcceptances({
                firebaseUid,
                documentoLegalIds
            });
        }

        /*
         * No permitimos ejecutar operaciones diferentes
         * de las expresamente autorizadas.
         */
        throw {
            statusCode: 400,
            message: 'Operación legal no válida'
        };
    }


    /*
     * Validación defensiva del correo electrónico.
     *
     * El correo continúa siendo necesario durante
     * el registro tradicional.
     */
    static validateEmail(email) {

        if (
            typeof email !== 'string' ||
            !email.trim() ||
            email !== email.trim().toLowerCase() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {

            throw {
                statusCode: 400,
                message: 'Identidad de usuario no válida'
            };
        }
    }


    /*
     * Validación defensiva del UID de Firebase.
     *
     * Esta validación no sustituye la autenticación
     * mediante Firebase realizada en la Lambda pública.
     *
     * El UID distingue mayúsculas y minúsculas.
     */
    static validateFirebaseUid(firebaseUid) {

        if (
            typeof firebaseUid !== 'string' ||
            !firebaseUid.trim() ||
            firebaseUid.length > 128
        ) {

            throw {
                statusCode: 401,
                message: 'Identidad de usuario no válida'
            };
        }
    }
}

module.exports = LegalAuthDatabase;
