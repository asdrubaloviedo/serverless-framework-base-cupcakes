const { DoTestCupcake, GetAllCupcake, GetAllNameImageCupcake, GetAllNameImageMoviesCupcake, GetByIdCupcake, GetByIdInfoImageCupcake, GetAllRamdomCupcake, GetAllNameImageFiltrosCupcake, GetAllNameImageInfoCupcake } = require('@cupcake/services/cupcake');
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

  static async getAllNameImageInfoByUserEmail(params = {}) {
    const { email, tipo } = params;
    return GetAllNameImageInfoCupcake.execute({ email, tipo });
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

  static async getByIdInfoImage(params = {}) {
    const { id } = params;
    const result = await GetByIdInfoImageCupcake.execute({ id });
    if (result) return result;
    return { message: 'Info and image not found' };
  };

  static async getByIdCupcakeUserState(params = {}) {
    const { email, id } = params;
    const result = await GetByIdCupcakeUserStateCupcake.execute({ email, id });
    if (result) return result;
    return { message: 'Cupcake user states were not found' };
  };

  static async createOneCupcakeUserState(params = {}) {
    const { email, cupcake, estado } = params;
    return CreateOneCupcakeUserStateCupcake.execute({ email, cupcake, estado });
  };
  
  static async patchOneCupcakeUserState(params = {}) {
    const { email, cupcake, estado, valor } = params;
    return PatchOneCupcakeUserStateCupcake.execute({ email, cupcake, estado, valor });
  };
  
  static async getAllRamdom() {
    return GetAllRamdomCupcake.execute();
  };
  
  static async getAllNameImageFiltros(params = {}) {
    const {
      tiempo,
      dificultad,
      festividad,
      colorpredominante,
      colorsecundario
    } = params;
    return GetAllNameImageFiltrosCupcake.execute({tiempo, dificultad, festividad, colorpredominante, colorsecundario });
  };
}

module.exports = CupcakeController;
