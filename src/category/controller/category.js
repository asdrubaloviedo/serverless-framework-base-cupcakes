const { GetAllCategoriesNameImageCountCategory } = require('@category/services/category');

class CategoryController {

  static async getAllNameImageCount(params = {}) {
    const { email } = params;
    return GetAllCategoriesNameImageCountCategory.execute({ email });
  };
}

module.exports = CategoryController;
