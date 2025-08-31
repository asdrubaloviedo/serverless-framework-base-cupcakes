const { CupcakeUserStateRepository } = require("@cupcake/repositories");

// PATCH Actualizacion de estados de cupcake por usuario_id, cupcake_id y estado_id.
class PatchOneCupcakeUserStateCupcake {
    static async execute({ cupcakeUserStateModel, email, cupcake, estado, valor }) {
        try {
            const cupcakeUserStateRepository = new CupcakeUserStateRepository(cupcakeUserStateModel);

            // API: '/actualizar-cupcake-estados'
            try {
                await cupcakeUserStateRepository.update({ email, cupcake, estado, valor });
            } catch (e) {
                // No enviar el error al usuario
                throw new Error('Error updating the cupcake user state');
            }

            const cupcakeUserState = await cupcakeUserStateRepository.getByUserEmailAndIdAndState({ email, cupcake, estado });
            return cupcakeUserState;
        } catch (err) {
            throw new Error(`[CupcakeService] Fallo en PatchOneCupcakeUserStateCupcake: ${err.message}`);
        }
    }
}

module.exports = PatchOneCupcakeUserStateCupcake;