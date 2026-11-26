
/*
 * =========================================================
 * USER SERVICES
 * =========================================================
 *
 * Exportamos los servicios de forma diferida mediante getters.
 *
 * De esta manera Node.js no carga todos los servicios apenas se
 * importa este index.
 *
 * Esto es importante porque CreateOneUser puede terminar
 * inicializando dependencias relacionadas con PostgreSQL,
 * mientras que el flujo de recuperación de contraseña no
 * necesita base de datos.
 */

module.exports = {
    get GoogleAuthUser() {
        return require('@user/services/user/GoogleAuthUser');
    },

    /*
     * Servicio para crear un usuario en nuestra base de datos.
     *
     * Se carga únicamente cuando alguien accede a:
     * services.CreateOneUser
     */
    get CreateOneUser() {
        return require(
            '@user/services/user/CreateOneUser'
        );
    },

    /*
     * Servicio para consultar los datos del perfil y avatar
     * de un usuario existente mediante su Firebase UID.
     *
     * Esta operación es exclusivamente de lectura.
     *
     * No crea usuarios ni registra aceptaciones legales.
     */
    get GetUserProfile() {
        return require(
            '@user/services/user/GetUserProfile'
        );
    },

    /*
     * Servicio para actualizar los datos del perfil
     * de un usuario existente.
     */
    get UpdateOneUser() {
        return require(
            '@user/services/user/UpdateOneUser'
        );
    },

    /*
     * Servicio para obtener las preferencias guardadas
     * de un usuario.
     */
    get GetUserPreferences() {
        return require(
            '@user/services/user/GetUserPreferences'
        );
    },

    /*
     * Servicio para actualizar las preferencias
     * de un usuario existente.
     */
    get UpdateUserPreferences() {
        return require(
            '@user/services/user/UpdateUserPreferences'
        );
    },

    /*
     * Genera mediante Firebase Authentication el enlace seguro
     * para cambiar la contraseña.
     */
    get GeneratePasswordResetLink() {
        return require(
            '@user/services/user/GeneratePasswordResetLink'
        );
    },

    /*
     * Envía mediante Amazon SES el correo personalizado con el
     * enlace generado por Firebase.
     */
    get SendPasswordResetEmail() {
        return require(
            '@user/services/user/SendPasswordResetEmail'
        );
    },

    /*
     * Servicio para obtener los documentos legales vigentes.
     */
    get GetActiveLegalDocuments() {
        return require(
            '@user/services/user/GetActiveLegalDocuments'
        );
    },

    /*
     * Servicio para consultar los documentos legales
     * pendientes de aceptación de un usuario.
     */
    get GetPendingLegalAcceptances() {
        return require(
            '@user/services/user/GetPendingLegalAcceptances'
        );
    },

    /*
     * Servicio para registrar las aceptaciones legales
     * posteriores a la creación de una cuenta.
     */
    get RegisterLegalAcceptances() {
        return require(
            '@user/services/user/RegisterLegalAcceptances'
        );
    }
};
