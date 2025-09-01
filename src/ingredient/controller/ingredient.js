const { GetByIdIngredient } = require('@ingredient/services/ingredient');

class IngredientController {

  static async getById(params = {}) {
    const { id } = params;
    const result = await GetByIdIngredient.execute({ id });
    if (result) return result;
    return { message: 'Ingredients were not found' };
  };
}

module.exports = IngredientController;