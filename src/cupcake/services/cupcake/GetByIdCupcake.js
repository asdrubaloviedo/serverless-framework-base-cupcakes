const { CupcakeRepository } = require("@cupcake/repositories/index");

// GET Info del cupcake por id.
class GetByIdCupcake {
    static async execute({ email, id, tiempo, dificultad, festividad, predominante, secundario }) {
        const cupcakeRepository = new CupcakeRepository();

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
    }
}

module.exports = GetByIdCupcake;