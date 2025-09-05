jest.mock('@cupcake/models/cupcake', () => ({
  CupcakeModel: {
    getAll: jest.fn(),
    getAllWithFilters: jest.fn(),
    getAllByUserEmail: jest.fn(),
    getAllRamdom: jest.fn(),
    getAllNameImage: jest.fn(),
    getAllNameImageByUserEmail: jest.fn(),
    getAllNameImageByUserEmailAndStatus: jest.fn(),
    getAllNameImageByCategory: jest.fn(),
    getAllNameImageByUserEmailAndCategory: jest.fn(),
    getAllNameImageByFestivity: jest.fn(),
    getAllNameImageByUserEmailAndFestivity: jest.fn(),
    getAllNameImageMovies: jest.fn(),
    getAllNameImageMoviesByUserEmail: jest.fn(),
    getAllNameImageFiltros: jest.fn(),
    getById: jest.fn(),
    getRandomByUserEmail: jest.fn(),
    getByFilters: jest.fn(),
    getByIdInfoImage: jest.fn(),
  }
}));

const { CupcakeModel } = require('@cupcake/models/cupcake');
const Repo = require('../../repositories/CupcakeRepository');

describe('CupcakeRepository (más métodos)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAllByUserEmail pasa email en params', async () => {
    const r = new Repo();
    await r.getAllByUserEmail({ lowerCaseEmail: 'x@x.com' });
    const { params } = CupcakeModel.getAllByUserEmail.mock.calls[0][0];
    expect(params).toEqual(['x@x.com']);
  });

  test('getAllRamdom usa SQL sin params', async () => {
    const r = new Repo();
    await r.getAllRamdom();
    const arg = CupcakeModel.getAllRamdom.mock.calls[0][0];
    expect(arg).toHaveProperty('query');
    expect(arg).not.toHaveProperty('params');
  });

  test('getAllNameImage SQL básico', async () => {
    const r = new Repo();
    await r.getAllNameImage();
    const { query } = CupcakeModel.getAllNameImage.mock.calls[0][0];
    expect(String(query)).toMatch(/SELECT c\.cupcake_id, c\.nombre, im\.codigo/);
  });

  test('getAllNameImageByUserEmail pasa params', async () => {
    const r = new Repo();
    await r.getAllNameImageByUserEmail({ lowerCaseEmail: 'a@a.com' });
    const { params } = CupcakeModel.getAllNameImageByUserEmail.mock.calls[0][0];
    expect(params).toEqual(['a@a.com']);
  });

  test('getAllNameImageByUserEmailAndStatus pasa params', async () => {
    const r = new Repo();
    await r.getAllNameImageByUserEmailAndStatus({ lowerCaseEmail: 'a@a.com', estado: 2 });
    const { params } = CupcakeModel.getAllNameImageByUserEmailAndStatus.mock.calls[0][0];
    expect(params).toEqual(['a@a.com', 2]);
  });

  test('getAllNameImageByCategory pasa categoria', async () => {
    const r = new Repo();
    await r.getAllNameImageByCategory({ categoria: 9 });
    const { params } = CupcakeModel.getAllNameImageByCategory.mock.calls[0][0];
    expect(params).toEqual([9]);
  });

  test('getAllNameImageByUserEmailAndCategory params correctos', async () => {
    const r = new Repo();
    await r.getAllNameImageByUserEmailAndCategory({ lowerCaseEmail: 'a@a.com', categoria: 9 });
    const { params } = CupcakeModel.getAllNameImageByUserEmailAndCategory.mock.calls[0][0];
    expect(params).toEqual(['a@a.com', 9]);
  });

  test('getAllNameImageByFestivity pasa festividad', async () => {
    const r = new Repo();
    await r.getAllNameImageByFestivity({ festividad: 4 });
    const { params } = CupcakeModel.getAllNameImageByFestivity.mock.calls[0][0];
    expect(params).toEqual([4]);
  });

  test('getAllNameImageByUserEmailAndFestivity params correctos', async () => {
    const r = new Repo();
    await r.getAllNameImageByUserEmailAndFestivity({ lowerCaseEmail: 'a@a.com', festividad: 4 });
    const { params } = CupcakeModel.getAllNameImageByUserEmailAndFestivity.mock.calls[0][0];
    expect(params).toEqual(['a@a.com', 4]);
  });

  test('getAllNameImageMovies sin params', async () => {
    const r = new Repo();
    await r.getAllNameImageMovies();
    const { query } = CupcakeModel.getAllNameImageMovies.mock.calls[0][0];
    expect(String(query)).toMatch(/cu\.pelicula = TRUE/);
  });

  test('getAllNameImageMoviesByUserEmail con email', async () => {
    const r = new Repo();
    await r.getAllNameImageMoviesByUserEmail({ lowerCaseEmail: 'a@a.com' });
    const { params } = CupcakeModel.getAllNameImageMoviesByUserEmail.mock.calls[0][0];
    expect(params).toEqual(['a@a.com']);
  });

  test('getAllNameImageFiltros con arrays', async () => {
    const r = new Repo();
    await r.getAllNameImageFiltros({
      tiempo: 150,
      arrayDificultad: [1,2],
      arrayFestividad: [3,4],
      arrayColorPredominante: ['rojo'],
      arrayColorSecundario: ['azul']
    });
    const { query, params } = CupcakeModel.getAllNameImageFiltros.mock.calls[0][0];
    expect(String(query)).toMatch(/ANY/);
    expect(params).toEqual([150, [1,2], [3,4], ['rojo'], ['azul']]);
  });

  test('getRandomByUserEmail pasa email', async () => {
    const r = new Repo();
    await r.getRandomByUserEmail({ lowerCaseEmail: 'a@a.com' });
    const { params } = CupcakeModel.getRandomByUserEmail.mock.calls[0][0];
    expect(params).toEqual(['a@a.com']);
  });
});
