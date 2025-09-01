const { CupcakeRepository } = require("@cupcake/repositories/index");

// GET Nombre e imagen principal de los Registros de la tabla cupcakes, que pertenezcan a una pelicula bajo diferentes parametros de filtrado
class GetAllNameImageMoviesCupcake {
    static async execute({ email }) {
        const cupcakeRepository = new CupcakeRepository();

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
    }
}

module.exports = GetAllNameImageMoviesCupcake;