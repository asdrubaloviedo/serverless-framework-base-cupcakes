const Router = require('express');
const CategoryController = require('@category/controller/category');

const categoryRouter = ({
  categoryModel
}) => {
  const categoryRouter = Router();

  const categoryController = new CategoryController({
    categoryModel
  });

  /* GET Nombre, imagen principal y cantidad de los Registros de la tabla cupcake_categorias */
  categoryRouter.get(
    '/categorias-imagen-cantidad',
    categoryController.getAllNameImageCount
  );

  /* GET Nombre, imagen principal y cantidad de los Registros de la tabla cupcake_categorias que este disponibles para un usuario por id */
  categoryRouter.get(
    '/categorias-imagen-cantidad/usuario',
    categoryController.getAllNameImageCount
  );

  return categoryRouter;
};

module.exports = categoryRouter;
