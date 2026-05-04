jest.mock('@cupcake/models/cupcake', () => ({
  CupcakeModel: {
    getAllNameImageInfoPackagesByUserEmail: jest.fn(),
    getAllNameImageInfoMissingPackagesByUserEmail: jest.fn(),
  },
}));

const { CupcakeModel } = require('@cupcake/models/cupcake');
const CupcakeRepository = require('@cupcake/repositories/CupcakeRepository');

describe('CupcakeRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAllNameImageInfoPackagesByUserEmail arma query y params', async () => {
    const repo = new CupcakeRepository();

    await repo.getAllNameImageInfoPackagesByUserEmail({
      lowerCaseEmail: 'test@test.com',
    });

    expect(
      CupcakeModel.getAllNameImageInfoPackagesByUserEmail
    ).toHaveBeenCalledWith({
      query: expect.stringContaining('paquete_id'),
      params: ['test@test.com'],
    });
  });

  test('getAllNameImageInfoMissingPackagesByUserEmail arma query y params', async () => {
    const repo = new CupcakeRepository();

    await repo.getAllNameImageInfoMissingPackagesByUserEmail({
      lowerCaseEmail: 'test@test.com',
    });

    expect(
      CupcakeModel.getAllNameImageInfoMissingPackagesByUserEmail
    ).toHaveBeenCalledWith({
      query: expect.stringContaining('NOT EXISTS'),
      params: ['test@test.com'],
    });
  });
});