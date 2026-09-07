jest.mock('@cupcake/services/cupcake', () => ({
  DoTestCupcake: { execute: jest.fn().mockResolvedValue('ok-test') },
  GetAllCupcake: { execute: jest.fn().mockResolvedValue(['all']) },
  GetAllNameImageCupcake: { execute: jest.fn().mockResolvedValue(['nameimg']) },
  GetAllNameImageMoviesCupcake: { execute: jest.fn().mockResolvedValue(['movies']) },
  GetByIdCupcake: { execute: jest.fn().mockResolvedValue(['byid']) },
  GetByIdInfoImageCupcake: { execute: jest.fn().mockResolvedValue(['infoimg']) },
  GetAllRamdomCupcake: { execute: jest.fn().mockResolvedValue(['rand']) },
  GetAllNameImageFiltrosCupcake: { execute: jest.fn().mockResolvedValue(['filtros']) },
  GetAllNameImageInfoCupcake: { execute: jest.fn().mockResolvedValue(['info-user']) },
  GetFeaturedPackageByUserEmail: { execute: jest.fn().mockResolvedValue({ paquete_id: 2 }) },
}));

jest.mock('@cupcake/services/cupcakeUserState', () => ({
  GetByIdCupcakeUserStateCupcake: { execute: jest.fn().mockResolvedValue(['states']) },
  CreateOneCupcakeUserStateCupcake: { execute: jest.fn().mockResolvedValue(['created']) },
  PatchOneCupcakeUserStateCupcake: { execute: jest.fn().mockResolvedValue(['patched']) },
}));

jest.mock('@cupcake/services/cupcakeCollection', () => ({
  GetCupcakeCollections: {
    execute: jest.fn().mockResolvedValue(['collections']),
  },

  GetCupcakesByCollection: {
    execute: jest.fn().mockResolvedValue(['collection-cupcakes']),
  },

  CreateCupcakeCollection: {
    execute: jest.fn().mockResolvedValue(['collection-created']),
  },

  SaveCupcakeCollection: {
    execute: jest.fn().mockResolvedValue(['cupcake-saved']),
  },
}));

jest.mock('@cupcake/services/cupcakeRating', () => ({
  GetCupcakeRating: {
    execute: jest.fn().mockResolvedValue({
      calificacion: 5
    })
  },

  SaveCupcakeRating: {
    execute: jest.fn().mockResolvedValue({
      ok: true
    })
  }
}));

const C = require('../../controller/cupcake');

const SC = require('@cupcake/services/cupcake');
const SU = require('@cupcake/services/cupcakeUserState');
const SCollection = require('@cupcake/services/cupcakeCollection');
const SRating = require('@cupcake/services/cupcakeRating');

describe('CupcakeController', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('doTest -> llama servicio', async () => {

    const r = await C.doTest();

    expect(
      SC.DoTestCupcake.execute
    ).toHaveBeenCalled();

    expect(r).toBe('ok-test');
  });

  test('getAll pasa params', async () => {

    const p = {
      email: 'a',
      tiempo: 1,
      dificultad: '2',
      festividad: '3',
      predominante: 'rojo',
      secundario: 'azul',
    };

    const r = await C.getAll(p);

    expect(
      SC.GetAllCupcake.execute
    ).toHaveBeenCalledWith(p);

    expect(r).toEqual(['all']);
  });

  test('getAllNameImage mapea params', async () => {

    const p = {
      email: 'a',
      estado: 2,
      categoria: 3,
      festividad: 4,
    };

    await C.getAllNameImage(p);

    expect(
      SC.GetAllNameImageCupcake.execute
    ).toHaveBeenCalledWith(p);
  });

  test('getAllNameImageMovies con email', async () => {

    await C.getAllNameImageMovies({
      email: 'a@a.com',
    });

    expect(
      SC.GetAllNameImageMoviesCupcake.execute
    ).toHaveBeenCalledWith({
      email: 'a@a.com',
    });
  });

  test('getById -> retorna filas, y null -> mensaje', async () => {

    let r = await C.getById({
      id: 7,
    });

    expect(
      SC.GetByIdCupcake.execute
    ).toHaveBeenCalledWith({
      id: 7,
      email: undefined,
      tiempo: undefined,
      dificultad: undefined,
      festividad: undefined,
      predominante: undefined,
      secundario: undefined,
    });

    expect(r).toEqual(['byid']);

    SC.GetByIdCupcake.execute
      .mockResolvedValueOnce(null);

    r = await C.getById({
      id: 7,
    });

    expect(r).toEqual({
      message: 'Cupcake not found',
    });
  });

  test('getByIdInfoImage -> filas o mensaje', async () => {

    let r = await C.getByIdInfoImage({
      id: 9,
    });

    expect(
      SC.GetByIdInfoImageCupcake.execute
    ).toHaveBeenCalledWith({
      id: 9,
    });

    expect(r).toEqual(['infoimg']);

    SC.GetByIdInfoImageCupcake.execute
      .mockResolvedValueOnce(null);

    r = await C.getByIdInfoImage({
      id: 9,
    });

    expect(r).toEqual({
      message: 'Info and image not found',
    });
  });

  test('getByIdCupcakeUserState -> filas o mensaje', async () => {

    let r = await C.getByIdCupcakeUserState({
      email: 'a',
      id: 1,
    });

    expect(
      SU.GetByIdCupcakeUserStateCupcake.execute
    ).toHaveBeenCalledWith({
      email: 'a',
      id: 1,
    });

    expect(r).toEqual(['states']);

    SU.GetByIdCupcakeUserStateCupcake.execute
      .mockResolvedValueOnce(null);

    r = await C.getByIdCupcakeUserState({
      email: 'a',
      id: 1,
    });

    expect(r).toEqual({
      message: 'Cupcake user states were not found',
    });
  });

  test('createOneCupcakeUserState / patchOneCupcakeUserState', async () => {

    const p = {
      email: 'a',
      cupcake: 1,
      estado: 2,
    };

    await C.createOneCupcakeUserState(p);

    expect(
      SU.CreateOneCupcakeUserStateCupcake.execute
    ).toHaveBeenCalledWith(p);

    await C.patchOneCupcakeUserState({
      ...p,
      valor: true,
    });

    expect(
      SU.PatchOneCupcakeUserStateCupcake.execute
    ).toHaveBeenCalledWith({
      ...p,
      valor: true,
    });
  });

  /*
   * =========================================================
   * COLLECTIONS
   * =========================================================
   */

  test('getCupcakeCollections pasa email y cupcake', async () => {

    const p = {
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: '2',
    };

    const r =
      await C.getCupcakeCollections(p);

    expect(
      SCollection
        .GetCupcakeCollections
        .execute
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: '2',
    });

    expect(r).toEqual([
      'collections',
    ]);
  });

  test('getCupcakeCollections permite cupcake undefined', async () => {
    const p = {
      email: 'asdrubaloviedo2@gmail.com',
    };

    const r =
      await C.getCupcakeCollections(p);

    expect(
      SCollection
        .GetCupcakeCollections
        .execute
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: undefined,
    });

    expect(r).toEqual([
      'collections',
    ]);
  });

  test('getCupcakesByCollection pasa email y collection', async () => {

    const p = {
      email: 'asdrubaloviedo2@gmail.com',
      collection: '3',
    };

    const r =
      await C.getCupcakesByCollection(p);

    expect(
      SCollection
        .GetCupcakesByCollection
        .execute
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      collection: '3',
    });

    expect(r).toEqual([
      'collection-cupcakes',
    ]);
  });

  test('createCupcakeCollection pasa email y nombre', async () => {

    const p = {
      email: 'asdrubaloviedo2@gmail.com',
      nombre: 'Cumpleaños',
    };

    const r =
      await C.createCupcakeCollection(p);

    expect(
      SCollection
        .CreateCupcakeCollection
        .execute
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      nombre: 'Cumpleaños',
    });

    expect(r).toEqual([
      'collection-created',
    ]);
  });

  test('saveCupcakeCollection pasa email, collection y cupcake', async () => {

    const p = {
      email: 'asdrubaloviedo2@gmail.com',
      collection: 1,
      cupcake: 2,
    };

    const r =
      await C.saveCupcakeCollection(p);

    expect(
      SCollection
        .SaveCupcakeCollection
        .execute
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      collection: 1,
      cupcake: 2,
    });

    expect(r).toEqual([
      'cupcake-saved',
    ]);
  });

  test('getAllRamdom', async () => {

    const r = await C.getAllRamdom();

    expect(
      SC.GetAllRamdomCupcake.execute
    ).toHaveBeenCalled();

    expect(r).toEqual(['rand']);
  });

  test('getAllNameImageFiltros mapea params', async () => {

    const p = {
      tiempo: 150,
      dificultad: 'media',
      festividad: 'navidad',
      colorpredominante: 'rojo',
      colorsecundario: 'azul',
    };

    await C.getAllNameImageFiltros(p);

    expect(
      SC.GetAllNameImageFiltrosCupcake.execute
    ).toHaveBeenCalledWith(p);
  });

  test('getAllNameImageInfoByUserEmail pasa email y tipo', async () => {

    const result =
      await C.getAllNameImageInfoByUserEmail({
        email: 'usuario@gmail.com',
        tipo: 'paquetes'
      });

    expect(
      SC.GetAllNameImageInfoCupcake.execute
    ).toHaveBeenCalledWith({
      email: 'usuario@gmail.com',
      tipo: 'paquetes'
    });

    expect(result).toEqual([
      'info-user'
    ]);
  });


  test('getFeaturedPackageByUserEmail pasa el email al servicio', async () => {

    const result =
      await C.getFeaturedPackageByUserEmail({
        email: 'usuario@gmail.com'
      });

    expect(
      SC.GetFeaturedPackageByUserEmail.execute
    ).toHaveBeenCalledWith({
      email: 'usuario@gmail.com'
    });

    expect(result).toEqual({
      paquete_id: 2
    });
  });


  test('getCupcakeRating pasa email e id como cupcake', async () => {

    const result =
      await C.getCupcakeRating({
        email: 'usuario@gmail.com',
        id: 65
      });

    expect(
      SRating.GetCupcakeRating.execute
    ).toHaveBeenCalledWith({
      email: 'usuario@gmail.com',
      cupcake: 65
    });

    expect(result).toEqual({
      calificacion: 5
    });
  });

  test('saveCupcakeRating pasa los datos al servicio', async () => {

    const result =
      await C.saveCupcakeRating({
        email: 'usuario@gmail.com',
        cupcake: 65,
        calificacion: 5,
        comentario: 'Excelente'
      });

    expect(
      SRating.SaveCupcakeRating.execute
    ).toHaveBeenCalledWith({
      email: 'usuario@gmail.com',
      cupcake: 65,
      calificacion: 5,
      comentario: 'Excelente'
    });

    expect(result).toEqual({
      ok: true
    });
  });
});