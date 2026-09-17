const { UserRepository } = require("@user/repositories/index");

/**
 * Servicio encargado de actualizar las preferencias de un usuario.
 *
 * El usuario se identifica mediante su email.
 *
 * Las preferencias pueden recibirse de forma parcial.
 * El repository conserva los valores actuales de cualquier
 * preferencia que no haya sido incluida en la petición.
 */
class UpdateUserPreferences {

    static async execute({
        email,
        recordatorios,
        mensajes,
        promociones,
        musica,
        efectos_sonido,
        vibracion,
        tema
    }) {
        const userRepository = new UserRepository();

         /*
         * Actualizamos únicamente las preferencias
         * recibidas en la petición.
         */
        await userRepository.updatePreferences({
            email,
            recordatorios,
            mensajes,
            promociones,
            musica,
            efectos_sonido,
            vibracion,
            tema
        });

        /*
         * Después de guardar consultamos nuevamente las
         * preferencias para devolver al cliente el estado
         * definitivo almacenado en PostgreSQL.
         */
        const preferences = await userRepository.getPreferences({
            email
        });

        if (!preferences || preferences.length === 0) {
            return null;
        }

        return preferences;
    }
}

module.exports = UpdateUserPreferences;