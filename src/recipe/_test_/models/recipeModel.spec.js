describe('RecipeModel', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('getById llama db.query con SQL y params', async () => {
    const query = jest.fn().mockResolvedValue('rows');
    jest.isolateModules(() => {
      jest.doMock('@db/db', () => ({ query }));
    });

    const { RecipeModel } = require('../../models/recipe');
    const res = await RecipeModel.getById({ query: 'Q', params: [1] });

    expect(query).toHaveBeenCalledWith('Q', [1]);
    expect(res).toBe('rows');
  });
});
