// src/category/handlers/getCategoriesByUserNameImageCount.js
require('module-alias/register');
const CategoryController = require('@category/controller/category');
const categoryModel = require('@category/models/category');

const controller = new CategoryController({ categoryModel });

module.exports.handler = async (event) => {
  const email = event.queryStringParameters?.email || null;

  const result = await controller.getAllNameImageCountRaw(email);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
