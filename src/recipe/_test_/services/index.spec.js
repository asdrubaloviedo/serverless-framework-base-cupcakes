describe('services/index recipe', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('exporta ServiceRecipe', () => {
    jest.isolateModules(() => {
      jest.doMock('@recipe/services/recipe', () => ({
        GetByIdRecipe: function GetByIdRecipe() {},
      }));
      // ⚠️ Si este test falla, revisa que el archivo real use "require" (no "requiere").
      const S = require('../../services/index');
      expect(S).toHaveProperty('ServiceRecipe');
      expect(S.ServiceRecipe).toHaveProperty('GetByIdRecipe');
    });
  });
});
