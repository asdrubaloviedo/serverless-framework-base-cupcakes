const { CupcakeRepository } = require("@cupcake/repositories/index");

// GET Info e imagen principal de cupcake por id.
class GetByIdInfoImageCupcake {
    static async execute({ id }) {
        const cupcakeRepository = new CupcakeRepository();

        // API: '/all-image'
        const cupcake = await cupcakeRepository.getByIdInfoImage({ id });

        if (cupcake.length === 0) return null;
        return cupcake;
    }
}

module.exports = GetByIdInfoImageCupcake;