const { CupcakeRepository } = require("@cupcake/repositories/index");

// GET Nombre, imagen principal, estado Hecho, tiempo y porciones de los Registros de la tabla cupcakes disponibles para un usuario por id.
class GetAllNameImageInfoCupcake {
    static async execute({ email }) {
        if (!email) return [];

        const cupcakeRepository = new CupcakeRepository();

        // API: '/name-image-info/usuario'
        const lowerCaseEmail = email.toLowerCase();

        const cupcakes = await cupcakeRepository.getAllNameImageInfoByUserEmail({
            lowerCaseEmail
        });

        if (cupcakes.length === 0) {
            return {
                total_cupcakes: 0,
                cupcakes: []
            };
        }

        return {
            total_cupcakes: Number(cupcakes[0].total_cupcakes),
            cupcakes: cupcakes.map(({ total_cupcakes, ...cupcake }) => cupcake)
        };
    }
}

module.exports = GetAllNameImageInfoCupcake;