jest.mock('@cupcake/repositories/index', () => {
  const repo = {
    getAllNameImageInfoByUserEmail: jest.fn(),
  };

  return {
    CupcakeRepository: jest.fn(() => repo),
  };
});

const { CupcakeRepository } = require('@cupcake/repositories/index');
const S = require('../../../services/cupcake/GetAllNameImageInfoCupcake');

describe('GetAllNameImageInfoCupcake Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sin email retorna arreglo vacío y no consulta repositorio', async () => {
    const repo = new CupcakeRepository();

    const res = await S.execute({});

    expect(res).toEqual([]);
    expect(repo.getAllNameImageInfoByUserEmail).not.toHaveBeenCalled();
  });

  test('email sin cupcakes retorna total 0 y arreglo vacío', async () => {
    const repo = new CupcakeRepository();

    repo.getAllNameImageInfoByUserEmail.mockResolvedValueOnce([]);

    const res = await S.execute({ email: 'USER@MAIL.COM' });

    expect(repo.getAllNameImageInfoByUserEmail).toHaveBeenCalledWith({
      lowerCaseEmail: 'user@mail.com',
    });

    expect(res).toEqual({
      total_cupcakes: 0,
      cupcakes: [],
    });
  });

  test('email con cupcakes retorna total numérico y omite total_cupcakes en cada item', async () => {
    const repo = new CupcakeRepository();

    repo.getAllNameImageInfoByUserEmail.mockResolvedValueOnce([
      {
        total_cupcakes: '2',
        cupcake_id: 1,
        nombre: 'Chocolate',
      },
      {
        total_cupcakes: '2',
        cupcake_id: 2,
        nombre: 'Vainilla',
      },
    ]);

    const res = await S.execute({ email: 'USER@MAIL.COM' });

    expect(repo.getAllNameImageInfoByUserEmail).toHaveBeenCalledWith({
      lowerCaseEmail: 'user@mail.com',
    });

    expect(res).toEqual({
      total_cupcakes: 2,
      cupcakes: [
        {
          cupcake_id: 1,
          nombre: 'Chocolate',
        },
        {
          cupcake_id: 2,
          nombre: 'Vainilla',
        },
      ],
    });
  });
});