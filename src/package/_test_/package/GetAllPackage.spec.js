// Service (unit)
describe('GetAllPackage Service', () => {
  test('con email -> llama repo y devuelve filas', async () => {
    jest.resetModules();
    const getAll = jest.fn().mockResolvedValue([{ id: 1 }]);
    jest.doMock('@package/repositories/index', () => ({
      PackageRepository: function () { return { getAll }; },
    }));

    const Service = require('@package/services/package/GetAllPackage');
    const res = await Service.execute({ email: 'User@Mail.com' });

    expect(getAll).toHaveBeenCalledWith({ lowerCaseEmail: 'user@mail.com' });
    expect(res).toEqual([{ id: 1 }]);
  });

  test('sin datos -> null', async () => {
    jest.resetModules();
    const getAll = jest.fn().mockResolvedValue([]);
    jest.doMock('@package/repositories/index', () => ({
      PackageRepository: function () { return { getAll }; },
    }));

    const Service = require('@package/services/package/GetAllPackage');
    const res = await Service.execute({ email: 'x@y.com' });

    expect(res).toBeNull();
  });

  test('propaga error del repo', async () => {
    jest.resetModules();
    const getAll = jest.fn().mockRejectedValue(new Error('db down'));
    jest.doMock('@package/repositories/index', () => ({
      PackageRepository: function () { return { getAll }; },
    }));

    const Service = require('@package/services/package/GetAllPackage');
    await expect(Service.execute({ email: 'x@y.com' })).rejects.toThrow('db down');
  });
});
