const { CupcakeRepository } = require("@cupcake/repositories/index");

// GET Registros completos de la tabla cupcakes bajo diferentes parametros de filtrado
class GetAllCupcake {
    static async execute({ email, tiempo, dificultad, festividad, predominante, secundario }) {
        const cupcakeRepository = new CupcakeRepository();

        // API: '/usuario'
        if (
            email &&
            !tiempo &&
            !dificultad &&
            !festividad &&
            !predominante &&
            !secundario
        ) {
            const lowerCaseEmail = email.toLowerCase();
            const cupcakes = await cupcakeRepository.getAllByUserEmail({ lowerCaseEmail });
            if (cupcakes.length === 0) return [];
            return cupcakes;
        }

        // API: '/busqueda'
        if (
            !email &&
            (tiempo || dificultad || festividad || predominante || secundario)
        ) {
            const cupcakes = await cupcakeRepository.getAllWithFilters({
                tiempo,
                dificultad,
                festividad,
                predominante,
                secundario
            });
            if (cupcakes.length === 0) return [];
            return cupcakes;
        }

        // API: '/'
        const cupcakes = await cupcakeRepository.getAll();
        return cupcakes;
    }
}

module.exports = GetAllCupcake;