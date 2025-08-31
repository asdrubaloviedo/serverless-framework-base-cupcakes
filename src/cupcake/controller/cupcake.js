// const { DoTestCupcake, GetAllCupcake, GetAllNameImageCupcake, GetAllNameImageMoviesCupcake, GetByIdCupcake, GetByIdInfoImageCupcake, GetAllRamdomCupcake, GetAllNameImageFiltrosCupcake } = require('@cupcake/services/cupcake');
// const { GetByIdCupcakeUserStateCupcake, CreateOneCupcakeUserStateCupcake, PatchOneCupcakeUserStateCupcake } = require('@cupcake/services/cupcakeUserState');

const { DoTestCupcake, GetAllCupcake } = require('@cupcake/services/cupcake');

class CupcakeController {

  static async doTest() {
    return DoTestCupcake.execute(); 
  };

  // static async getAllNameImageCount(email) {
  //   return GetAllCategoriesNameImageCountCupcake.execute(email);
  // };

  static async getAll(params = {}) {
    const { email, tiempo, dificultad, festividad, predominante, secundario } = params;
    return GetAllCupcake.execute({ cupcakeModel: this.cupcakeModel, email, tiempo, dificultad, festividad, predominante, secundario });
  };

  static async getAllNameImage(params = {}) {
    const { email, estado, categoria, festividad } = params;
    return GetAllNameImageCupcake.execute({ cupcakeModel: this.cupcakeModel, email, estado, categoria, festividad });
  };
}

module.exports = CupcakeController;
