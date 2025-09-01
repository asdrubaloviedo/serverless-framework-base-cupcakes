// Dejamos publico todas las variables del ambiente de trabajo
module.exports = {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
  APP_PORT: process.env.APP_PORT,
  ENDPOINT_ROOT: process.env.ENDPOINT_ROOT,
  CATEGORY_MODULE: process.env.CATEGORY_MODULE,
  CUPCAKE_MODULE: process.env.CUPCAKE_MODULE,
  FESTIVITY_MODULE: process.env.FESTIVITY_MODULE,
  INGREDIENT_MODULE: process.env.INGREDIENT_MODULE,
  PACKAGE_MODULE: process.env.PACKAGE_MODULE,
  RECIPE_MODULE: process.env.RECIPE_MODULE,
  USER_MODULE: process.env.USER_MODULE
};