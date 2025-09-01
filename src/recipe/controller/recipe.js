const { GetByIdRecipe } = require('@recipe/services/recipe');

class RecipeController {

  static async getById(params = {}) {
    const { id } = params;
    const result = await GetByIdRecipe.execute({ id });
    if (result) return result;
    return { message: 'Recipe not found' };
  };
}

module.exports = RecipeController;
