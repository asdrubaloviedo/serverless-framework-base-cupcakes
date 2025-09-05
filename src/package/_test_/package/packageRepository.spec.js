// Repository (unit)
describe('PackageRepository', () => {
  test('getAll arma SQL y pasa params', async () => {
    jest.resetModules();
    const getAll = jest.fn();
    jest.doMock('@package/models/package', () => ({
      PackageModel: { getAll },
    }));

    const Repo = require('@package/repositories/PackageRepository');
    const repo = new Repo();
    await repo.getAll({ lowerCaseEmail: 'a@b.com' });

    expect(getAll).toHaveBeenCalledTimes(1);
    const arg = getAll.mock.calls[0][0];
    expect(arg.query).toMatch(/SELECT/i);
    expect(arg.params).toEqual(['a@b.com']);
  });
});
