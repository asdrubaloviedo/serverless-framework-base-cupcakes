describe('RecipeRepository', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('getById arma SQL y pasa params', async () => {
    const getById = jest.fn();
    jest.isolateModules(() => {
      jest.doMock('@recipe/models/recipe', () => ({
        RecipeModel: { getById },
      }));
    });

    const RecipeRepository = require('../../repositories/RecipeRepository');
    const repo = new RecipeRepository();

    await repo.getById({ id: 7 });

    expect(getById).toHaveBeenCalledTimes(1);
    const arg = getById.mock.calls[0][0];
    expect(arg.query).toEqual(expect.stringContaining('SELECT'));
    expect(arg.query).toEqual(expect.stringContaining('ORDER BY'));
    expect(arg.params).toEqual([7]);
  });
});
