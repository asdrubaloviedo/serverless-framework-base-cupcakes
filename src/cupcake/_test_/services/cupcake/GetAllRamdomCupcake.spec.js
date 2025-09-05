jest.mock('@cupcake/repositories/index', () => {
  const repo = { getAllRamdom: jest.fn().mockResolvedValue([{ id: 9 }]) };
  return { CupcakeRepository: jest.fn(() => repo) };
});

const { CupcakeRepository } = require('@cupcake/repositories/index');
const S = require('../../../services/cupcake/GetAllRamdomCupcake');

describe('GetAllRamdomCupcake Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('con filas -> devuelve', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute();
    expect(repo.getAllRamdom).toHaveBeenCalled();
    expect(res).toEqual([{ id: 9 }]);
  });

  test('sin filas -> null', async () => {
    const repo = new CupcakeRepository();
    repo.getAllRamdom.mockResolvedValueOnce([]);
    const res = await S.execute();
    expect(res).toBeNull();
  });
});
