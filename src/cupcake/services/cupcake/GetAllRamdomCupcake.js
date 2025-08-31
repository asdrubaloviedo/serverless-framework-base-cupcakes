const { CupcakeRepository } = require("@cupcake/repositories");

// GET Id de un registro de la tabla cupcakes de forma aleatoria.
class GetAllRamdomCupcake {
    static async execute({ cupcakeModel }) {
        try {
            const cupcakeRepository = new CupcakeRepository(cupcakeModel);

            // API: '/ramdom'
            const cupcakeUserStates = await cupcakeRepository.getAllRamdom();        

            if (cupcakeUserStates.length === 0) return null;
            return cupcakeUserStates;
        } catch (err) {
            throw new Error(`[CupcakeService] Fallo en GetAllRamdomCupcake: ${err.message}`);
        }
    }
}

module.exports = GetAllRamdomCupcake;