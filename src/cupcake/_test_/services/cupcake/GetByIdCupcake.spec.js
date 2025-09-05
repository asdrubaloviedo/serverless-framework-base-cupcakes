jest.mock('@cupcake/repositories/index', () => {
  const repo = {
    getRandomByUserEmail: jest.fn().mockResolvedValue([{ id: 1 }]),
    getByFilters:         jest.fn().mockResolvedValue([{ id: 2 }]),
    getById:              jest.fn().mockResolvedValue([{ id: 3 }]),
  };
  return { CupcakeRepository: jest.fn(() => repo) };
});

const { CupcakeRepository } = require('@cupcake/repositories/index');
const S = require('../../../services/cupcake/GetByIdCupcake');

describe('GetByIdCupcake Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('ramdom/usuario -> getRandomByUserEmail', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({ email: 'A@A.com' });
    expect(repo.getRandomByUserEmail).toHaveBeenCalledWith({ lowerCaseEmail: 'a@a.com' });
    expect(res).toEqual([{ id: 1 }]);
  });

  test('busqueda/usuario -> getByFilters', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({ email: 'x@x.com', tiempo: 30, dificultad: '2' });
    expect(repo.getByFilters).toHaveBeenCalled();
    expect(res).toEqual([{ id: 2 }]);
  });

  test('/cupcake -> getById con null si vacío', async () => {
    const repo = new CupcakeRepository();
    repo.getById.mockResolvedValueOnce([]);
    const res = await S.execute({ id: 7 });
    expect(repo.getById).toHaveBeenCalledWith({ id: 7 });
    expect(res).toBeNull();
  });

  test('/cupcake -> con filas', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({ id: 7 });
    expect(res).toEqual([{ id: 3 }]);
  });
});
