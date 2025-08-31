const { CupcakeRepository } = require("@cupcake/repositories");

// GET Registros completos de la tabla cupcakes bajo diferentes parametros de filtrado
class GetAllCupcake {
    static async execute({ cupcakeModel, email, tiempo, dificultad, festividad, predominante, secundario }) {
        try {
            const cupcakeRepository = new CupcakeRepository(cupcakeModel);

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
        } catch (err) {
            throw new Error(`[CupcakeService] Fallo en GetAllCupcake: ${err.message}`);
        }
    }
}

module.exports = GetAllCupcake;