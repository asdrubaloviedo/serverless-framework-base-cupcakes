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
    }
};