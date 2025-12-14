jest.mock('@user/repositories/index', () => ({
  UserPackageRepository: jest.fn(),
}));

const { UserPackageRepository } = require('@user/repositories/index');
const CreateOneUserPackage = require('../../services/userPackage/CreateOneUserPackage');

beforeEach(() => jest.clearAllMocks());

describe('CreateOneUserPackage Service', () => {
  test('crea paquete y devuelve filas', async () => {
    const create = jest.fn().mockResolvedValue(true);
    const getCreated = jest.fn().mockResolvedValue([{ id: 9 }]);

    UserPackageRepository.mockImplementation(() => ({
      create,
      getCreated,
    }));

    const res = await CreateOneUserPackage.execute({
      email: 'a@a.com',
      paquete: 9,
      moneda: 'PEN',
      montoCentavos: 1500,
    });

    expect(create).toHaveBeenCalledWith({
      email: 'a@a.com',
      paquete: 9,
      moneda: 'PEN',
      montoCentavos: 1500,
      paisCompra: undefined,
      paymentProvider: undefined,
      paymentProviderId: undefined,
    });

    expect(getCreated).toHaveBeenCalledWith({
      email: 'a@a.com',
      paquete: 9,
    });

    expect(res).toEqual({
      ok: true,
      code: 'USER_PACKAGE_CREATED',
      httpStatus: 201,
      data: [{ id: 9 }],
    });
  });

  test('error en create -> mensaje amigable', async () => {
    const create = jest.fn().mockRejectedValue(new Error('db'));
    const getCreated = jest.fn();

    UserPackageRepository.mockImplementation(() => ({
      create,
      getCreated,
    }));

    const res = await CreateOneUserPackage.execute({
      email: 'a@a.com',
      paquete: 9,
      moneda: 'PEN',
      montoCentavos: 1500,
    });

    expect(res).toEqual({
      ok: false,
      code: 'USER_PACKAGE_CREATE_ERROR',
      httpStatus: 500,
      message: 'Error creating the user package',
    });

    expect(getCreated).not.toHaveBeenCalled();
  });

  test('si no se inserta -> already exists', async () => {
    const create = jest.fn().mockResolvedValue(false);
    const getCreated = jest.fn();

    UserPackageRepository.mockImplementation(() => ({ create, getCreated }));

    const res = await CreateOneUserPackage.execute({
      email: 'a@a.com',
      paquete: 9,
      moneda: 'PEN',
      montoCentavos: 1500,
    });

    expect(res).toEqual({
      ok: false,
      code: 'USER_PACKAGE_ALREADY_EXISTS',
      httpStatus: 409,
      message: 'El usuario ya tiene este paquete registrado.',
    });

    expect(getCreated).not.toHaveBeenCalled();
  });

});
