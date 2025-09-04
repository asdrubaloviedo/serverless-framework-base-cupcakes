const S = require('@category/services');

test('services/index exporta GetAllCategoriesNameImageCountCategory', () => {
  // El índice real expone { ServiceCategory: { GetAllCategoriesNameImageCountCategory } }
  expect(S).toHaveProperty('ServiceCategory.GetAllCategoriesNameImageCountCategory');
  expect(typeof S.ServiceCategory.GetAllCategoriesNameImageCountCategory.execute).toBe('function');
});
