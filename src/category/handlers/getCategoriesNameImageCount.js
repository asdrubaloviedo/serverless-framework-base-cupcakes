// src/category/handlers/getCategoriesNameImageCount.js
require('module-alias/register');
const CategoryController = require('@category/controller/category');

const handler = async (event) => {
  try {
    const email = event.queryStringParameters?.email || null;
    console.log('📨 Email recibido:', email);
    const result = await CategoryController.getAllNameImageCount(email);

    return {
      statusCode: 200,
      body: JSON.stringify({
        email,
        result
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

