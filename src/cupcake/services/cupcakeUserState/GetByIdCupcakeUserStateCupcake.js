const { CupcakeUserStateRepository } = require("@cupcake/repositories/index");

// GET Estados o logros de cupcake por id bajo diferentes parametros de filtrado
class GetByIdCupcakeUserStateCupcake {
    static async execute({ email, id }) {
        const cupcakeUserStateRepository = new CupcakeUserStateRepository();
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
    }
}

module.exports = GetByIdCupcakeUserStateCupcake;