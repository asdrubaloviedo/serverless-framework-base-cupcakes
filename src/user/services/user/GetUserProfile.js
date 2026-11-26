
"use strict";

const {
    UserRepository
} = require('@user/repositories');


/*
 * =========================================================
 * GET USER PROFILE
 * =========================================================
 *
 * Consulta los datos del usuario y su avatar mediante
 * el UID de Firebase.
 *
 * La identidad debe haber sido autenticada previamente
 * mediante Firebase Admin.
 *
 * Esta operación es exclusivamente de lectura.
 *
 * No crea usuarios.
 * No actualiza usuarios.
 * No registra aceptaciones legales.
 */
class GetUserProfile {

    static async execute(params = {}) {

        const {
            firebaseUid
        } = params;


        /*
         * =================================================
         * VALIDATE FIREBASE UID
         * =================================================
         *
         * El UID distingue mayúsculas y minúsculas.
         * No debe modificarse ni normalizarse.
         */
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


        /*
         * =================================================
         * GET USER PROFILE
         * =================================================
         *
         * Reutilizamos la consulta existente del repositorio.
         */
        const repository =
            new UserRepository();

        const usuario =
            await repository.getByFirebaseUid({
                firebaseUid
            });


        /*
         * Validación defensiva de la respuesta
         * del repositorio.
         */
        if (!Array.isArray(usuario)) {

            throw {
                statusCode: 500,
                message: 'Error interno del servidor'
            };
        }


        /*
         * El usuario autenticado mediante Firebase
         * debe existir previamente en PostgreSQL.
         */
        if (usuario.length === 0) {

            throw {
                statusCode: 404,
                message: 'Usuario no registrado'
            };
        }


        /*
         * Firebase UID debe identificar exclusivamente
         * a un usuario.
         */
        if (usuario.length !== 1) {

            throw {
                statusCode: 500,
                message: 'Error interno del servidor'
            };
        }


        /*
         * Conservamos el formato de lista utilizado
         * por el modelo de usuario existente en Android.
         */
        return usuario;
    }
}

module.exports = GetUserProfile;
