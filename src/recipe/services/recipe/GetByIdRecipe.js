const { RecipeRepository } = require("@recipe/repositories/index");

// GET Receta de cupcake por id.
class GetByIdRecipe {
    static async execute({ id }) {
        const recipeRepository = new RecipeRepository();

        // API: '/receta'
        const recipes = await recipeRepository.getById({ id });

        if (recipes.length === 0) return null;
        return recipes;
    }
}

module.exports = GetByIdRecipe;