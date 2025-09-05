jest.mock('@user/models/user', () => ({
  UserPackageModel: { create: jest.fn(), getCreated: jest.fn() },
}));

const { UserPackageModel } = require('@user/models/user');
const UserPackageRepository = require('../../repositories/UserPackageRepository');

beforeEach(() => jest.clearAllMocks());

describe('UserPackageRepository', () => {
  test('create arma SQL y pasa params', async () => {
    const repo = new UserPackageRepository();
    await repo.create({ email: 'a@a.com', paquete: 9 });
    expect(UserPackageModel.create).toHaveBeenCalledWith({
      query: expect.stringContaining('INSERT INTO usuario_paquetes'),
      params: ['a@a.com', 9],
    });
  });

  test('getCreated arma SQL y pasa params', async () => {
    const repo = new UserPackageRepository();
    await repo.getCreated({ email: 'b@b.com', paquete: 2 });
    expect(UserPackageModel.getCreated).toHaveBeenCalledWith({
      query: expect.stringContaining('FROM usuario_paquetes'),
      params: ['b@b.com', 2],
    });
  });
});
