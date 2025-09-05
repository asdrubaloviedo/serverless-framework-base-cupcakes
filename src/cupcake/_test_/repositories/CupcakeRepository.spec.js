jest.mock('@cupcake/models/cupcake', () => {
  const m = {
    CupcakeModel: {
      getAll:                        jest.fn(),
      getAllWithFilters:             jest.fn(),
      getAllByUserEmail:             jest.fn(),
      getAllRamdom:                  jest.fn(),
      getAllNameImage:               jest.fn(),
      getAllNameImageByUserEmail:    jest.fn(),
      getAllNameImageByUserEmailAndStatus: jest.fn(),
      getAllNameImageByCategory:     jest.fn(),
      getAllNameImageByUserEmailAndCategory: jest.fn(),
      getAllNameImageByFestivity:    jest.fn(),
      getAllNameImageByUserEmailAndFestivity: jest.fn(),
      getAllNameImageMovies:         jest.fn(),
      getAllNameImageMoviesByUserEmail: jest.fn(),
      getAllNameImageFiltros:        jest.fn(),
      getById:                       jest.fn(),
      getRandomByUserEmail:          jest.fn(),
      getByFilters:                  jest.fn(),
      getByIdInfoImage:              jest.fn(),
    }
  };
  return m;
});

const { CupcakeModel } = require('@cupcake/models/cupcake');
const Repo = require('../../repositories/CupcakeRepository');

describe('CupcakeRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAll -> usa SQL fijo', async () => {
    const r = new Repo();
    await r.getAll();
    expect(CupcakeModel.getAll).toHaveBeenCalled();
    const arg = CupcakeModel.getAll.mock.calls[0][0];
    expect(arg).toHaveProperty('query');
    expect(String(arg.query)).toMatch(/SELECT C\.\*/);
  });

  test('getAllWithFilters -> arma SQL dinámico y params', async () => {
    const r = new Repo();
    await r.getAllWithFilters({
      tiempo: 120, dificultad: '2', festividad: '3', predominante: 'rojo', secundario: 'azul'
    });
    const { query, params } = CupcakeModel.getAllWithFilters.mock.calls[0][0];
    expect(query).toMatch(/cu\.tiempo <= \$1/);
    expect(query).toMatch(/cu\.dificultad_id = \$2/);
    expect(query).toMatch(/cu\.festividad_id = \$3/);
    expect(query).toMatch(/cu\.colorPredominante = \$4/);
    expect(query).toMatch(/cu\.colorSecundario = \$5/);
    expect(Array.isArray(params)).toBe(true);
    expect(params.slice(0,5)).toEqual([120,'2','3','rojo','azul']);
  });

  test('getByFilters -> contiene condiciones esperadas y placeholders', async () => {
    const r = new Repo();
    await r.getByFilters({ email: 'a@a.com', tiempo: 50, dificultad: '0', festividad:'0', predominante:'todos', secundario:'todos' });
    const { query, params } = CupcakeModel.getByFilters.mock.calls[0][0];
    expect(query).toMatch(/imc\.main = 1/);
    expect(query).toMatch(/AND \(cu\.tiempo <= \$2\)/);
    expect(query).toMatch(/\)\s+AS c/);
    expect(params[0]).toBe('a@a.com');
    expect(params[1]).toBe(50);
  });

  test('getAllNameImageByUserEmailAndStatus -> pasa params', async () => {
    const r = new Repo();
    await r.getAllNameImageByUserEmailAndStatus({ lowerCaseEmail: 'x@x.com', estado: 2 });
    const { query, params } = CupcakeModel.getAllNameImageByUserEmailAndStatus.mock.calls[0][0];
    expect(params).toEqual(['x@x.com', 2]);
    expect(query).toMatch(/cue\.estado_id = \$2/);
  });

  test('getById -> pasa params', async () => {
    const r = new Repo();
    await r.getById({ id: 7 });
    const { query, params } = CupcakeModel.getById.mock.calls[0][0];
    expect(params).toEqual([7]);
    expect(query).toMatch(/WHERE C\.cupcake_id = \$1/);
  });

  test('getByIdInfoImage -> pasa params', async () => {
    const r = new Repo();
    await r.getByIdInfoImage({ id: 9 });
    const { query, params } = CupcakeModel.getByIdInfoImage.mock.calls[0][0];
    expect(params).toEqual([9]);
    expect(query).toMatch(/LEFT JOIN imagenes im/);
  });
});
