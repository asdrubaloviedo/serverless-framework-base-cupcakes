jest.mock('@user/repositories/index', () => ({
  UserPackageRepository: jest.fn(),
}));
const { UserPackageRepository } = require('@user/repositories/index');
const CreateOneUserPackage = require('../../services/userPackage/CreateOneUserPackage');

beforeEach(() => jest.clearAllMocks());

describe('CreateOneUserPackage Service', () => {
  test('crea paquete y devuelve filas', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const getCreated = jest.fn().mockResolvedValue([{ id: 9 }]);
    UserPackageRepository.mockImplementation(() => ({ create, getCreated }));

    const res = await CreateOneUserPackage.execute({ email: 'a@a.com', paquete: 9 });
    expect(create).toHaveBeenCalledWith({ email: 'a@a.com', paquete: 9 });
    expect(getCreated).toHaveBeenCalledWith({ email: 'a@a.com', paquete: 9 });
    expect(res).toEqual([{ id: 9 }]);
  });

  test('error en create -> mensaje amigable', async () => {
    const create = jest.fn().mockRejectedValue(new Error('db'));
    const getCreated = jest.fn();
    UserPackageRepository.mockImplementation(() => ({ create, getCreated }));

    await expect(
      CreateOneUserPackage.execute({ email: 'a@a.com', paquete: 9 })
    ).rejects.toThrow('Error creating the user package');
    expect(getCreated).not.toHaveBeenCalled();
  });
});
