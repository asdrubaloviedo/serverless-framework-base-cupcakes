// src/category/controller/category.js
const { GetAllCategoriesNameImageCountCategory } = require('@category/services/category');

class CategoryController {
  constructor({ categoryModel }) {
    this.categoryModel = categoryModel;
  }

  getAllNameImageCount = async (email) => {
    // const result = await this.getAllNameImageCountRaw(email);
    const result = 'Test';
    // res.status(200).json(result);
  };

  getAllNameImageCountRaw = async (email) => {
    return await GetAllCategoriesNameImageCountCategory.execute({
      categoryModel: this.categoryModel,
      email,
    });
  };
}

module.exports = CategoryController;
