jest.mock('@cupcake/repositories/index', () => {
  const repo = { getByIdInfoImage: jest.fn().mockResolvedValue([{ id: 1 }]) };
  return { CupcakeRepository: jest.fn(() => repo) };
});

const { CupcakeRepository } = require('@cupcake/repositories/index');
const S = require('../../../services/cupcake/GetByIdInfoImageCupcake');

describe('GetByIdInfoImageCupcake Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('con filas -> devuelve', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({ id: 5 });
    expect(repo.getByIdInfoImage).toHaveBeenCalledWith({ id: 5 });
    expect(res).toEqual([{ id: 1 }]);
  });

  test('sin filas -> null', async () => {
    const repo = new CupcakeRepository();
    repo.getByIdInfoImage.mockResolvedValueOnce([]);
    const res = await S.execute({ id: 5 });
    expect(res).toBeNull();
  });
});
