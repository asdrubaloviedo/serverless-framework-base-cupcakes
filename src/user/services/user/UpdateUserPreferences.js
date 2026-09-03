const { UserRepository } = require("@user/repositories/index");

/**
 * Servicio encargado de actualizar las preferencias de un usuario.
 *
 * El usuario se identifica mediante su email y el repository
 * se encarga de localizar su usuario_id para actualizar la fila
 * correspondiente en usuario_preferencias.
 */
class UpdateUserPreferences {

    static async execute({
        email,
        recordatorios,
        mensajes,
        promociones,
        musica,
        efectos_sonido,
        vibracion
    }) {
        const userRepository = new UserRepository();

        /*
         * Actualizamos las seis preferencias del usuario.
         */
        await userRepository.updatePreferences({
            email,
            recordatorios,
            mensajes,
            promociones,
            musica,
            efectos_sonido,
            vibracion
        });

        /*
         * Después de guardar, consultamos nuevamente las
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