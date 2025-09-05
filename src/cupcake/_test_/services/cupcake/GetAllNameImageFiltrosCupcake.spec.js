jest.mock('@cupcake/repositories/index', () => {
  const repo = {
    getAllNameImageFiltros: jest.fn().mockResolvedValue([{ id: 1 }]),
  };
  return { CupcakeRepository: jest.fn(() => repo) };
});

const { CupcakeRepository } = require('@cupcake/repositories/index');
const S = require('../../../services/cupcake/GetAllNameImageFiltrosCupcake');

describe('GetAllNameImageFiltrosCupcake Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('arma arrays y llama repo con params', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({
      tiempo: 150,
      dificultad: 'dificil',
      festividad: 'navidad',
      colorpredominante: 'rojo',
      colorsecundario: 'azul'
    });
    expect(repo.getAllNameImageFiltros).toHaveBeenCalled();
    const args = repo.getAllNameImageFiltros.mock.calls[0][0];
    expect(args.tiempo).toBe(150);
    expect(args.arrayDificultad).toEqual([4]);
    expect(args.arrayFestividad).toEqual([4]);
    expect(args.arrayColorPredominante).toEqual(['rojo']);
    expect(args.arrayColorSecundario).toEqual(['azul']);
    expect(res).toEqual([{ id: 1 }]);
  });

  test('sin coincidencias -> []', async () => {
    const repo = new CupcakeRepository();
    repo.getAllNameImageFiltros.mockResolvedValueOnce([]);
    const res = await S.execute({
      tiempo: 10, dificultad: 'todas', festividad: 'todas', colorpredominante: 'todos', colorsecundario: 'todos'
    });
    expect(res).toEqual([]);
  });
});
