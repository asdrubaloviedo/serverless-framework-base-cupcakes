// const { DoTestCupcake, GetAllCupcake, GetAllNameImageCupcake, GetAllNameImageMoviesCupcake, GetByIdCupcake, GetByIdInfoImageCupcake, GetAllRamdomCupcake, GetAllNameImageFiltrosCupcake } = require('@cupcake/services/cupcake');
// const { GetByIdCupcakeUserStateCupcake, CreateOneCupcakeUserStateCupcake, PatchOneCupcakeUserStateCupcake } = require('@cupcake/services/cupcakeUserState');

const { DoTestCupcake } = require('@cupcake/services/cupcake');

class CupcakeController {

  static async doTest() {
    return DoTestCupcake.execute(); 
  };

  // static async getAllNameImageCount(email) {
  //   return GetAllCategoriesNameImageCountCupcake.execute(email);
  // };
}

module.exports = CupcakeController;
