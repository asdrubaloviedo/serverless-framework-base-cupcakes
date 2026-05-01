jest.mock('@user/services/userMedalLeage', () => ({
  CreateOneUserMedalLeage: { execute: jest.fn() },
  UpdateUserMedalLeage: { execute: jest.fn() },
}));
jest.mock('@user/services/userPackage', () => ({
  CreateOneUserPackage: { execute: jest.fn() },
}));
jest.mock('@user/services/user', () => ({
  CreateOneUser: { execute: jest.fn() },
}));

const { CreateOneUserMedalLeage, UpdateUserMedalLeage } = require('@user/services/userMedalLeage');
const { CreateOneUserPackage } = require('@user/services/userPackage');
const { CreateOneUser } = require('@user/services/user');
const UserController = require('../../controller/user');

beforeEach(() => jest.clearAllMocks());

describe('UserController', () => {
  test('createOneUserMedalLeage pasa params', async () => {
    CreateOneUserMedalLeage.execute.mockResolvedValue([{ ok: 1 }]);
    const r = await UserController.createOneUserMedalLeage({ email: 'a@a.com', medalla: 'oro' });
    expect(CreateOneUserMedalLeage.execute).toHaveBeenCalledWith({ email: 'a@a.com', medalla: 'oro' });
    expect(r).toEqual([{ ok: 1 }]);
  });

  test('patchOneUserMedalLeage pasa params', async () => {
    UpdateUserMedalLeage.execute.mockResolvedValue([{ ok: 2 }]);
    const p = { email: 'a@a.com', cupcake: 1, estado: true, valor: 5 };
    const r = await UserController.patchOneUserMedalLeage(p);
    expect(UpdateUserMedalLeage.execute).toHaveBeenCalledWith(p);
    expect(r).toEqual([{ ok: 2 }]);
  });

  test('createOneUserPackage pasa params', async () => {
    CreateOneUserPackage.execute.mockResolvedValue([{ ok: 3 }]);
    const r = await UserController.createOneUserPackage({ email: 'a@a.com', paquete: 9 });
    expect(CreateOneUserPackage.execute).toHaveBeenCalledWith({ email: 'a@a.com', paquete: 9 });
    expect(r).toEqual([{ ok: 3 }]);
  });

  test('createOneUser pasa params', async () => {
    CreateOneUser.execute.mockResolvedValue([{ ok: 4 }]);

    const r = await UserController.createOneUser({
      nombre: 'Juan Perez',
      email: 'b@b.com',
    });

    expect(CreateOneUser.execute).toHaveBeenCalledWith({
      nombre: 'Juan Perez',
      email: 'b@b.com',
    });

    expect(r).toEqual([{ ok: 4 }]);
  });

  test('propaga error de servicios', async () => {
    CreateOneUser.execute.mockRejectedValue(new Error('boom'));

    await expect(
      UserController.createOneUser({ nombre: 'Juan Perez', email: 'x@x.com' })
    ).rejects.toThrow('boom');
  });
});
