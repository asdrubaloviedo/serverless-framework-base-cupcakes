jest.mock('@user/models/user', () => ({
  UserModel: { create: jest.fn(), getCreated: jest.fn() },
}));

const { UserModel } = require('@user/models/user');
const UserRepository = require('../../repositories/UserRepository');

beforeEach(() => jest.clearAllMocks());

describe('UserRepository', () => {
  test('create arma SQL y pasa params', async () => {
    const repo = new UserRepository();
    await repo.create({ email: 'a@a.com' });
    expect(UserModel.create).toHaveBeenCalledWith({
      query: expect.stringContaining('INSERT INTO usuarios'),
      params: ['a@a.com'],
    });
  });

  test('getCreated arma SQL y pasa params', async () => {
    const repo = new UserRepository();
    await repo.getCreated({ email: 'b@b.com' });
    expect(UserModel.getCreated).toHaveBeenCalledWith({
      query: expect.stringContaining('FROM usuarios'),
      params: ['b@b.com'],
    });
  });
});
