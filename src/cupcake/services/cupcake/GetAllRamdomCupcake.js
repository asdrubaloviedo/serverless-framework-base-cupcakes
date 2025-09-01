const { CupcakeRepository } = require("@cupcake/repositories/index");

// GET Id de un registro de la tabla cupcakes de forma aleatoria.
class GetAllRamdomCupcake {
    static async execute() {
        const cupcakeRepository = new CupcakeRepository();

        // API: '/ramdom'
        const cupcakeUserStates = await cupcakeRepository.getAllRamdom();        

        if (cupcakeUserStates.length === 0) return null;
        return cupcakeUserStates;
    }
}

module.exports = GetAllRamdomCupcake;