const { CupcakeRepository } = require("@cupcake/repositories/index");

// Funcion de testeo simple
class DoTestCupcake {
    static async execute() {
        const cupcakeRepository = new CupcakeRepository();

        // API: '/test'
        return cupcakeRepository.doTest();
    }
}

module.exports = DoTestCupcake;