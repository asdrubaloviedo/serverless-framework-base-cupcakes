const { UserRepository } = require("@user/repositories/index");

// PATCH Actualización del perfil del usuario.
class UpdateOneUser {

    static async execute({ nombre, email, avatarId }) {
        const userRepository = new UserRepository();

        try {
            await userRepository.update({
                nombre,
                email,
                avatarId
            });
        } catch (e) {
            // No enviamos detalles internos de base de datos al cliente.
            throw new Error('Error updating the user');
        }

        /*
         * Recuperamos nuevamente el usuario para devolver
         * también la información completa del avatar.
         */
        const updatedUser =
            await userRepository.getCreated({
                email
            });

        if (updatedUser.length === 0) {
            return null;
        }

        return updatedUser;
    }
}

module.exports = UpdateOneUser;