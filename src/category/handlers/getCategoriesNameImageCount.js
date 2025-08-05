// src/category/handlers/getCategoriesNameImageCount.js
require('module-alias/register');
const CategoryController = require('@category/controller/category');
const categoryModel = require('@category/models/category');

const controller = new CategoryController({ categoryModel });

const handler = async (event) => {
  try {
    const email = event.queryStringParameters?.email || null;
    console.log('📨 Email recibido:', email);
    const result = await controller.getAllNameImageCount(email);

    return {
      statusCode: 200,
      body: JSON.stringify({
        email,
        result,
        categoryModel
      })
    };

  } catch (error) {
    console.error('Error en el handler:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error interno del servidor',
        error: error.message || error
      })
    };
  }
};

module.exports = {
  handler
};

