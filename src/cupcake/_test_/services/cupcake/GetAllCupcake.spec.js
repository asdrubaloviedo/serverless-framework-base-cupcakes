jest.mock('@cupcake/repositories/index', () => {
  const repo = {
    getAll:            jest.fn().mockResolvedValue([{ id: 1 }]),
    getAllWithFilters: jest.fn().mockResolvedValue([{ id: 2 }]),
    getAllByUserEmail: jest.fn().mockResolvedValue([{ id: 3 }]),
  };
  return { CupcakeRepository: jest.fn(() => repo) };
});

const { CupcakeRepository } = require('@cupcake/repositories/index');
const GetAllCupcake = require('../../../services/cupcake/GetAllCupcake');

describe('GetAllCupcake Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('email solo -> getAllByUserEmail (lowercase)', async () => {
    const repo = new CupcakeRepository();
    repo.getAllByUserEmail.mockResolvedValueOnce([{ id: 10 }]);

    const res = await GetAllCupcake.execute({
      email: 'A@A.COM', tiempo: undefined, dificultad: undefined, festividad: undefined, predominante: undefined, secundario: undefined
    });
    expect(repo.getAllByUserEmail).toHaveBeenCalledWith({ lowerCaseEmail: 'a@a.com' });
    expect(res).toEqual([{ id: 10 }]);
  });

  test('filtros sin email -> getAllWithFilters', async () => {
    const repo = new CupcakeRepository();
    repo.getAllWithFilters.mockResolvedValueOnce([{ id: 20 }]);

    const res = await GetAllCupcake.execute({
      email: undefined, tiempo: 30, dificultad: '2', festividad: '3', predominante: 'rojo', secundario: 'azul'
    });
    expect(repo.getAllWithFilters).toHaveBeenCalledWith({
      tiempo: 30, dificultad: '2', festividad: '3', predominante: 'rojo', secundario: 'azul'
    });
    expect(res).toEqual([{ id: 20 }]);
  });

  test('default -> getAll', async () => {
    const repo = new CupcakeRepository();
    repo.getAll.mockResolvedValueOnce([{ id: 99 }]);

    const res = await GetAllCupcake.execute({});
    expect(repo.getAll).toHaveBeenCalled();
    expect(res).toEqual([{ id: 99 }]);
  });
});
