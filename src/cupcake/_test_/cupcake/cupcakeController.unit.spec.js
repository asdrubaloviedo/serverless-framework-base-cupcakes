jest.mock('@cupcake/services/cupcake', () => ({
  DoTestCupcake: { execute: jest.fn().mockResolvedValue('ok') },
  GetAllCupcake: { execute: jest.fn().mockResolvedValue([{ id: 1 }]) },
  GetAllNameImageCupcake: { execute: jest.fn().mockResolvedValue([{ id: 2 }]) },
  GetAllNameImageMoviesCupcake: { execute: jest.fn().mockResolvedValue([{ id: 3 }]) },
  GetByIdCupcake: { execute: jest.fn().mockResolvedValue(null) },
  GetByIdInfoImageCupcake: { execute: jest.fn().mockResolvedValue(null) },
  GetAllRamdomCupcake: { execute: jest.fn().mockResolvedValue([{ id: 9 }]) },
  GetAllNameImageFiltrosCupcake: { execute: jest.fn().mockResolvedValue([{ id: 7 }]) },
}));
jest.mock('@cupcake/services/cupcakeUserState', () => ({
  GetByIdCupcakeUserStateCupcake: { execute: jest.fn().mockResolvedValue(null) },
  CreateOneCupcakeUserStateCupcake: { execute: jest.fn().mockResolvedValue([{ ok: true }]) },
  PatchOneCupcakeUserStateCupcake: { execute: jest.fn().mockResolvedValue([{ ok: 'p' }]) },
}));

const Ctrl = require('../../controller/cupcake');
const S = require('@cupcake/services/cupcake');
const US = require('@cupcake/services/cupcakeUserState');

describe('CupcakeController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('doTest -> ejecuta servicio', async () => {
    const r = await Ctrl.doTest();
    expect(S.DoTestCupcake.execute).toHaveBeenCalled();
    expect(r).toBe('ok');
  });

  test('getAll -> pasa params', async () => {
    const p = { email: 'a', tiempo:1, dificultad:2, festividad:3, predominante:'r', secundario:'b'};
    await Ctrl.getAll(p);
    expect(S.GetAllCupcake.execute).toHaveBeenCalledWith(p);
  });

  test('getById -> null -> message', async () => {
    const r = await Ctrl.getById({ id: 5 });
    expect(S.GetByIdCupcake.execute).toHaveBeenCalledWith({
      email: undefined, id: 5, tiempo: undefined, dificultad: undefined, festividad: undefined, predominante: undefined, secundario: undefined
    });
    expect(r).toEqual({ message: 'Cupcake not found' });
  });

  test('getByIdInfoImage -> null -> message', async () => {
    const r = await Ctrl.getByIdInfoImage({ id: 1 });
    expect(r).toEqual({ message: 'Info and image not found' });
  });

  test('getByIdCupcakeUserState -> null -> message', async () => {
    const r = await Ctrl.getByIdCupcakeUserState({ email: 'x', id: 1 });
    expect(US.GetByIdCupcakeUserStateCupcake.execute).toHaveBeenCalled();
    expect(r).toEqual({ message: 'Cupcake user states were not found' });
  });

  test('createOneCupcakeUserState -> pasa params', async () => {
    const r = await Ctrl.createOneCupcakeUserState({ email: 'e', cupcake: 1, estado: 2 });
    expect(US.CreateOneCupcakeUserStateCupcake.execute).toHaveBeenCalledWith({ email: 'e', cupcake: 1, estado: 2 });
    expect(r).toEqual([{ ok: true }]);
  });

  test('patchOneCupcakeUserState -> pasa params', async () => {
    const r = await Ctrl.patchOneCupcakeUserState({ email: 'e', cupcake: 1, estado: 2, valor: true });
    expect(US.PatchOneCupcakeUserStateCupcake.execute).toHaveBeenCalledWith({ email: 'e', cupcake: 1, estado: 2, valor: true });
    expect(r).toEqual([{ ok: 'p' }]);
  });

  test('getAllNameImageFiltros -> pasa params', async () => {
    await Ctrl.getAllNameImageFiltros({ tiempo:1, dificultad:'todas', festividad:'todas', colorpredominante:'todos', colorsecundario:'todos' });
    expect(S.GetAllNameImageFiltrosCupcake.execute).toHaveBeenCalledWith({
      tiempo:1, dificultad:'todas', festividad:'todas', colorpredominante:'todos', colorsecundario:'todos'
    });
  });
});
