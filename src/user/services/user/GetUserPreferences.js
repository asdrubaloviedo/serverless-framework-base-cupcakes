const { UserRepository } = require("@user/repositories/index");

/**
 * Servicio encargado de obtener las preferencias de un usuario.
 *
 * Las preferencias se buscan mediante el email del usuario.
 * El repository se encarga de resolver internamente la relación:
 *
 * usuarios
 *      ↓
 * usuario_preferencias
 */
class GetUserPreferences {

    static async execute({ email }) {
        const userRepository = new UserRepository();

        const preferences = await userRepository.getPreferences({
            email
        });

        /*
         * Si no existe el usuario o no tiene una fila asociada
         * en usuario_preferencias, devolvemos null.
         *
         * Los valores por defecto pertenecen a PostgreSQL,
         * por lo que no duplicamos esos defaults aquí.
         */
        if (!preferences || preferences.length === 0) {
            return null;
        }

        return preferences;
    }
}

module.exports = GetUserPreferences;