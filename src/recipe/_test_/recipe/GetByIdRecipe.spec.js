describe('GetByIdRecipe Service', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('retorna recetas cuando hay datos', async () => {
    jest.isolateModules(() => {
      jest.doMock('@recipe/repositories/index', () => ({
        RecipeRepository: jest.fn().mockImplementation(() => ({
          getById: jest.fn().mockResolvedValue([{ step: 1 }]),
        })),
      }));
    });
    const GetByIdRecipe = require('../../services/recipe/GetByIdRecipe');

    const res = await GetByIdRecipe.execute({ id: '7' });
    expect(res).toEqual([{ step: 1 }]);
  });

  test('retorna null cuando no hay datos', async () => {
    jest.isolateModules(() => {
      jest.doMock('@recipe/repositories/index', () => ({
        RecipeRepository: jest.fn().mockImplementation(() => ({
          getById: jest.fn().mockResolvedValue([]),
        })),
      }));
    });
    const GetByIdRecipe = require('../../services/recipe/GetByIdRecipe');

    const res = await GetByIdRecipe.execute({ id: '7' });
    expect(res).toBeNull();
  });

  test('propaga error del repo', async () => {
    jest.isolateModules(() => {
      jest.doMock('@recipe/repositories/index', () => ({
        RecipeRepository: jest.fn().mockImplementation(() => ({
          getById: jest.fn().mockRejectedValue(new Error('db fail')),
        })),
      }));
    });
    const GetByIdRecipe = require('../../services/recipe/GetByIdRecipe');

    await expect(GetByIdRecipe.execute({ id: '1' })).rejects.toThrow('db fail');
  });
});
