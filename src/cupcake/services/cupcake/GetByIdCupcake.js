const { CupcakeRepository } = require("@cupcake/repositories");

// GET Info del cupcake por id.
class GetByIdCupcake {
    static async execute({ cupcakeModel, email, id, tiempo, dificultad, festividad, predominante, secundario }) {
        try {
            const cupcakeRepository = new CupcakeRepository(cupcakeModel);

            // API: '/ramdom/usuario'
            if (
                email &&
                !tiempo &&
                !dificultad &&
                !festividad &&
                !predominante &&
                !secundario
            ) {
                const lowerCaseEmail = email.toLowerCase();
                const cupcakes = await cupcakeRepository.getRandomByUserEmail({ lowerCaseEmail });

                if (cupcakes.length === 0) return [];
                return cupcakes;
            }

            // API: '/busqueda/usuario'
            if (
                email &&
                (tiempo || dificultad || festividad || predominante || secundario)
            ) {
                const cupcakes = await cupcakeRepository.getByFilters({ email, tiempo, dificultad, festividad, predominante, secundario });

                if (cupcakes.length === 0) return [];
                return cupcakes;
            }

            // API: '/cupcake'
            const cupcake = await cupcakeRepository.getById({ id });

            if (cupcake.length === 0) return null;
            return cupcake;
        } catch (err) {
            throw new Error(`[CupcakeService] Fallo en GetByIdCupcake: ${err.message}`);
        }
    }
}

module.exports = GetByIdCupcake;