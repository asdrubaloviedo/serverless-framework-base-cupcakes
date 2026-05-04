const { UserRepository } = require("@user/repositories/index");

// POST Adicion de usuarios nuevos a la tabla usuarios.
class CreateOneUser {
    static async execute({ nombre, email, pais = 'PER' }) {
        const userRepository = new UserRepository();

        // API: '/insertar-usuario-nuevo'
        try {
            await userRepository.create({ nombre, email, pais });
        } catch (e) {
            // No enviar el error al usuario
            throw new Error('Error creating the user');
        }
        
        const newUser = await userRepository.getCreated({ email });

        if (newUser.length === 0) return null;

        return newUser;
    }
}

module.exports = CreateOneUser;