// src/category/controller/category.js
const { GetAllCategoriesNameImageCountCategory } = require('@category/services/category');

class CategoryController {

  static async getAllNameImageCount(email) {
    return GetAllCategoriesNameImageCountCategory.execute(email);
  };
}

module.exports = CategoryController;
