const { CupcakeRepository } = require("@cupcake/repositories");

// GET Info e imagen principal de cupcake por id.
class GetByIdInfoImageCupcake {
    static async execute({ cupcakeModel, id }) {
        try {
            const cupcakeRepository = new CupcakeRepository(cupcakeModel);

            // API: '/all-image'
            const cupcake = await cupcakeRepository.getByIdInfoImage({ id });

            if (cupcake.length === 0) return null;
            return cupcake;
        } catch (err) {
            throw new Error(`[CupcakeService] Fallo en GetByIdInfoImageCupcake: ${err.message}`);
        }
    }
}

module.exports = GetByIdInfoImageCupcake;