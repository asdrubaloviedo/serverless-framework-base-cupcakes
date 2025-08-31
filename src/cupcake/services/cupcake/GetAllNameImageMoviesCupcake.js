const { CupcakeRepository } = require("@cupcake/repositories");

// GET Nombre e imagen principal de los Registros de la tabla cupcakes, que pertenezcan a una pelicula bajo diferentes parametros de filtrado
class GetAllNameImageMoviesCupcake {
    static async execute({ cupcakeModel, email }) {
        try {
            const cupcakeRepository = new CupcakeRepository(cupcakeModel);

            // API: '/name-image-peliculas/usuario'
            if (email) {
                const lowerCaseEmail = email.toLowerCase();
                const cupcakes = await cupcakeRepository.getAllNameImageMoviesByUserEmail({ lowerCaseEmail });

                if (cupcakes.length === 0) return [];
                return cupcakes;
            }

            // API: '/cupcakes/name-image-peliculas'
            const cupcakes = await cupcakeRepository.getAllNameImageMovies();

            if (cupcakes.length === 0) return [];
            return cupcakes;
        } catch (err) {
            throw new Error(`[CupcakeService] Fallo en GetAllNameImageMoviesCupcake: ${err.message}`);
        }
    }
}

module.exports = GetAllNameImageMoviesCupcake;