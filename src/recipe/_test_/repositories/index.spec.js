describe('repositories/index recipe', () => {
  test('exporta RecipeRepository', () => {
    const R = require('../../repositories/index');
    expect(R).toHaveProperty('RecipeRepository');
    expect(typeof R.RecipeRepository).toBe('function');
  });
});
