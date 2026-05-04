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

const {
  CreateOneUserMedalLeage,
  UpdateUserMedalLeage,
} = require('@user/services/userMedalLeage');

const { CreateOneUserPackage } = require('@user/services/userPackage');
const { CreateOneUser } = require('@user/services/user');

const UserController = require('../../controller/user');

describe('UserController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('createOneUserMedalLeage pasa params', async () => {
    CreateOneUserMedalLeage.execute.mockResolvedValue([{ ok: 1 }]);

    const r = await UserController.createOneUserMedalLeage({
      email: 'a@a.com',
      medalla: 1,
    });

    expect(CreateOneUserMedalLeage.execute).toHaveBeenCalledWith({
      email: 'a@a.com',
      medalla: 1,
    });

    expect(r).toEqual([{ ok: 1 }]);
  });

  test('patchOneUserMedalLeage pasa params', async () => {
    UpdateUserMedalLeage.execute.mockResolvedValue([{ ok: 2 }]);

    const r = await UserController.patchOneUserMedalLeage({
      email: 'a@a.com',
      cupcake: 1,
      estado: 2,
      valor: true,
    });

    expect(UpdateUserMedalLeage.execute).toHaveBeenCalledWith({
      email: 'a@a.com',
      cupcake: 1,
      estado: 2,
      valor: true,
    });

    expect(r).toEqual([{ ok: 2 }]);
  });

  test('createOneUserPackage pasa params', async () => {
    CreateOneUserPackage.execute.mockResolvedValue([{ ok: 3 }]);

    const r = await UserController.createOneUserPackage({
      email: 'a@a.com',
      paquete: 1,
      moneda: 'PEN',
      montoCentavos: 3499,
      paisCompra: 'PER',
      paymentProvider: 'stripe',
      paymentProviderId: 'pay_123',
    });

    expect(CreateOneUserPackage.execute).toHaveBeenCalledWith({
      email: 'a@a.com',
      paquete: 1,
      moneda: 'PEN',
      montoCentavos: 3499,
      paisCompra: 'PER',
      paymentProvider: 'stripe',
      paymentProviderId: 'pay_123',
    });

    expect(r).toEqual([{ ok: 3 }]);
  });

  test('createOneUser pasa params con pais por defecto', async () => {
    CreateOneUser.execute.mockResolvedValue([{ ok: 4 }]);

    const r = await UserController.createOneUser({
      nombre: 'Juan Perez',
      email: 'b@b.com',
    });

    expect(CreateOneUser.execute).toHaveBeenCalledWith({
      nombre: 'Juan Perez',
      email: 'b@b.com',
      pais: 'PER',
    });

    expect(r).toEqual([{ ok: 4 }]);
  });

  test('createOneUser pasa pais personalizado', async () => {
    CreateOneUser.execute.mockResolvedValue([{ ok: 5 }]);

    const r = await UserController.createOneUser({
      nombre: 'Juan Perez',
      email: 'b@b.com',
      pais: 'FRA',
    });

    expect(CreateOneUser.execute).toHaveBeenCalledWith({
      nombre: 'Juan Perez',
      email: 'b@b.com',
      pais: 'FRA',
    });

    expect(r).toEqual([{ ok: 5 }]);
  });
});