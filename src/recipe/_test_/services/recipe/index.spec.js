describe('services/recipe/index', () => {
  test('exporta GetByIdRecipe', () => {
    const S = require('@recipe/services/recipe');
    expect(S).toHaveProperty('GetByIdRecipe');
    // opcional: verificar que sea una clase/función utilizable
    expect(typeof S.GetByIdRecipe).toBe('function');
  });
});
