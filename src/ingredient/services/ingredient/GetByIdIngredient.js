const { IngredientRepository } = require("@ingredient/repositories/index");

// GET Ingredientes de cupcake por id.
class GetByIdIngredient {
    static async execute({ id }) {
        const ingredientRepository = new IngredientRepository();

        // API: '/ingredientes'
        const cupcakeIngredients = await ingredientRepository.getById({ id });

        if (cupcakeIngredients.length === 0) return null;
        return cupcakeIngredients;
    }
}

module.exports = GetByIdIngredient;