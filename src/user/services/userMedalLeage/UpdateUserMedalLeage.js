const { UserMedalLeageRepository } = require("@user/repositories/index");

// PATCH Actualizacion de requisitos de la tabla usuario_medalla.  
class UpdateUserMedalLeage {
    static async execute({ email, cupcake, estado, valor }) {
        const userMedalLeageRepository = new UserMedalLeageRepository();

        // API: '/actualizar-usuario-medalla'
        try {
            await userMedalLeageRepository.update({ email, cupcake, estado, valor });
        } catch (e) {
            // No enviar el error al usuario
            throw new Error('Error updating the cupcake user state');
        }       
        
        const newUserMedalLeage = await userMedalLeageRepository.getUpdated({ email, cupcake, estado, valor });
        return newUserMedalLeage;
    }
}

module.exports = UpdateUserMedalLeage;