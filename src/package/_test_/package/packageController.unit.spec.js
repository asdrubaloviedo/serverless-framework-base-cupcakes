// Controller (unit)
describe('PackageController.getAll', () => {
  test('pasa el email tal cual al servicio', async () => {
    jest.resetModules();
    const execute = jest.fn().mockResolvedValue([{ id: 1 }]);
    jest.doMock('@package/services/package', () => ({
      GetAllPackage: { execute },
    }));

    const Controller = require('@package/controller/package');
    const res = await Controller.getAll({ email: 'User@Mail.com' });

    expect(execute).toHaveBeenCalledWith({ email: 'User@Mail.com' });
    expect(res).toEqual([{ id: 1 }]);
  });

  test('sin email -> pasa undefined', async () => {
    jest.resetModules();
    const execute = jest.fn().mockResolvedValue([{ id: 2 }]);
    jest.doMock('@package/services/package', () => ({
      GetAllPackage: { execute },
    }));

    const Controller = require('@package/controller/package');
    const res = await Controller.getAll({}); // sin email

    expect(execute).toHaveBeenCalledWith({ email: undefined });
    expect(res).toEqual([{ id: 2 }]);
  });

  test('propaga el error del servicio', async () => {
    jest.resetModules();
    const execute = jest.fn().mockRejectedValue(new Error('boom'));
    jest.doMock('@package/services/package', () => ({
      GetAllPackage: { execute },
    }));

    const Controller = require('@package/controller/package');
    await expect(Controller.getAll({ email: 'a@b.com' })).rejects.toThrow('boom');
  });
});
