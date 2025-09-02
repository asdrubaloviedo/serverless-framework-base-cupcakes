const { UserMedalLeageRepository } = require("@user/repositories/index");

/* POST Si el usuario no existe en la tabla usuario_medallas entonces se le
  inserta un registro por medalla con 0 requisitos alcanzados y con el estado false. */
class CreateOneUserMedalLeage {
    static async execute({ email, medalla }) {
        const userMedalLeageRepository = new UserMedalLeageRepository();

        try {
            await userMedalLeageRepository.create({ email, medalla });
        } catch (e) {
            // No enviar el error al usuario
            throw new Error('Error creating the user medal state');
        }       
        
        const newUserMedalLeage = await userMedalLeageRepository.getByUserEmailAndMedal({ email, medalla });
        return newUserMedalLeage;
    }
}

module.exports = CreateOneUserMedalLeage;