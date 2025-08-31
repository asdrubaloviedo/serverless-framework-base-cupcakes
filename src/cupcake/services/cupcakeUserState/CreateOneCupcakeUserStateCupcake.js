const { CupcakeUserStateRepository } = require("@cupcake/repositories");

/* POST Si el usuario, cupcake y estado no existe en la tabla cupcake_usuario_estados
  entonces se lo inserta con el estado false. */
class CreateOneCupcakeUserStateCupcake {
    static async execute({ cupcakeUserStateModel, email, cupcake, estado }) {
        try {
            const cupcakeUserStateRepository = new CupcakeUserStateRepository(cupcakeUserStateModel);

            // API: '/insertar-cupcake-estados'
            try {
                await cupcakeUserStateRepository.create({ email, cupcake, estado });
            } catch (e) {
                // No enviar el error al usuario
                throw new Error('Error creating the cupcake user state');
            }

            const cupcakeUserState = await cupcakeUserStateRepository.getByUserEmailAndIdAndState({ email, cupcake, estado });
            return cupcakeUserState;
        } catch (err) {
            throw new Error(`[CupcakeService] Fallo en CreateOneCupcakeUserStateCupcake: ${err.message}`);
        }
    }
}

module.exports = CreateOneCupcakeUserStateCupcake;