jest.mock('@user/repositories/index', () => ({
  UserRepository: jest.fn(),
}));
const { UserRepository } = require('@user/repositories/index');
const CreateOneUser = require('../../services/user/CreateOneUser');

beforeEach(() => jest.clearAllMocks());

describe('CreateOneUser Service', () => {
  test('crea y devuelve usuario', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const getCreated = jest.fn().mockResolvedValue([{ id: 1 }]);
    UserRepository.mockImplementation(() => ({ create, getCreated }));

    const res = await CreateOneUser.execute({ email: 'a@a.com' });
    expect(create).toHaveBeenCalledWith({ email: 'a@a.com' });
    expect(getCreated).toHaveBeenCalledWith({ email: 'a@a.com' });
    expect(res).toEqual([{ id: 1 }]);
  });

  test('si no hay filas -> null', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const getCreated = jest.fn().mockResolvedValue([]);
    UserRepository.mockImplementation(() => ({ create, getCreated }));

    const res = await CreateOneUser.execute({ email: 'b@b.com' });
    expect(res).toBeNull();
  });

  test('error en create -> error genérico', async () => {
    const create = jest.fn().mockRejectedValue(new Error('db down'));
    const getCreated = jest.fn(); // no debería llamarse
    UserRepository.mockImplementation(() => ({ create, getCreated }));

    await expect(CreateOneUser.execute({ email: 'x@x.com' }))
      .rejects.toThrow('Error creating the user');
    expect(getCreated).not.toHaveBeenCalled();
  });
});
