const { DoTestCupcake, GetAllCupcake, GetAllNameImageCupcake, GetAllNameImageMoviesCupcake, GetByIdCupcake, GetByIdInfoImageCupcake, GetAllRamdomCupcake, GetAllNameImageFiltrosCupcake } = require('@cupcake/services/cupcake');
const { GetByIdCupcakeUserStateCupcake, CreateOneCupcakeUserStateCupcake, PatchOneCupcakeUserStateCupcake } = require('@cupcake/services/cupcakeUserState');

class CupcakeController {

  static async doTest() {
    return DoTestCupcake.execute(); 
  };

  static async getAll(params = {}) {
    const { email, tiempo, dificultad, festividad, predominante, secundario } = params;
    return GetAllCupcake.execute({ email, tiempo, dificultad, festividad, predominante, secundario });
  };

  static async getAllNameImage(params = {}) {
    const { email, estado, categoria, festividad } = params;
    return GetAllNameImageCupcake.execute({ email, estado, categoria, festividad });
  };

  static async getAllNameImageMovies(params = {}) {
    const { email } = params;
    return GetAllNameImageMoviesCupcake.execute({ email });
  };

  static async getById(params = {}) {
    const {
      email,
      id,
      tiempo,
      dificultad,
      festividad,
      predominante,
      secundario
    } = params;
    const result = await GetByIdCupcake.execute({
      email,
      id,
      tiempo,
      dificultad,
      festividad,
      predominante,
      secundario
    });
    if (result) return result;
    return { message: 'Cupcake not found' };
  };
}

module.exports = CupcakeController;
