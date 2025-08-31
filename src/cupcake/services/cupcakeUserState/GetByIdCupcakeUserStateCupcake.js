const { CupcakeUserStateRepository } = require("@cupcake/repositories");

// GET Estados o logros de cupcake por id bajo diferentes parametros de filtrado
class GetByIdCupcakeUserStateCupcake {
    static async execute({ cupcakeUserStateModel, email, id }) {
        try {
            const cupcakeUserStateRepository = new CupcakeUserStateRepository(cupcakeUserStateModel);
            const lowerCaseEmail = email.toLowerCase();

            // API: '/logros'
            if (email && !id) {
                const cupcakeUserStates = await cupcakeUserStateRepository.getByUserEmail({ lowerCaseEmail });

                if (cupcakeUserStates.length === 0) return null;
                return cupcakeUserStates;
            }

            // API: '/estados'
            const cupcakeUserStates = await cupcakeUserStateRepository.getByUserEmailAndId({ lowerCaseEmail, id });        

            if (cupcakeUserStates.length === 0) return null;
            return cupcakeUserStates;
        } catch (err) {
            throw new Error(`[CupcakeService] Fallo en GetByIdCupcakeUserStateCupcake: ${err.message}`);
        }
    }
}

module.exports = GetByIdCupcakeUserStateCupcake;