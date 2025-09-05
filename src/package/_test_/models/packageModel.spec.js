// Model + DB mock
describe('PackageModel', () => {
  test('getAll llama db.query con SQL y params', async () => {
    jest.resetModules();
    const query = jest.fn().mockResolvedValue([{ ok: 1 }]);
    jest.doMock('@db/db', () => ({ query }), { virtual: true });

    const { PackageModel } = require('@package/models/package');
    const res = await PackageModel.getAll({ query: 'SELECT 1', params: ['a'] });

    expect(query).toHaveBeenCalledWith('SELECT 1', ['a']);
    expect(res).toEqual([{ ok: 1 }]);
  });
});
