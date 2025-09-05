describe('RecipeController.getById', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('con id -> llama servicio y devuelve resultado', async () => {
    jest.isolateModules(() => {
      jest.doMock('@recipe/services/recipe', () => ({
        GetByIdRecipe: { execute: jest.fn().mockResolvedValue([{ id: 9 }]) },
      }));
    });
    const RecipeController = require('../../controller/recipe');

    const res = await RecipeController.getById({ id: '9' });
    expect(res).toEqual([{ id: 9 }]);
    const { GetByIdRecipe } = require('@recipe/services/recipe');
    expect(GetByIdRecipe.execute).toHaveBeenCalledWith({ id: '9' });
  });

  test('servicio retorna null -> { message: "Recipe not found" }', async () => {
    jest.isolateModules(() => {
      jest.doMock('@recipe/services/recipe', () => ({
        GetByIdRecipe: { execute: jest.fn().mockResolvedValue(null) },
      }));
    });
    const RecipeController = require('../../controller/recipe');

    const res = await RecipeController.getById({});
    expect(res).toEqual({ message: 'Recipe not found' });
  });

  test('propaga error del servicio', async () => {
    jest.isolateModules(() => {
      jest.doMock('@recipe/services/recipe', () => ({
        GetByIdRecipe: { execute: jest.fn().mockRejectedValue(new Error('boom')) },
      }));
    });
    const RecipeController = require('../../controller/recipe');

    await expect(RecipeController.getById({ id: '1' })).rejects.toThrow('boom');
  });
});
