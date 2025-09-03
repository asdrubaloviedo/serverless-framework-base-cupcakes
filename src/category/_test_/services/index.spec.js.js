// src/category/_test_/services/index.spec.js
const S = require('@category/services');

test('services/index exporta GetAllCategoriesNameImageCountCategory', () => {
  expect(S).toHaveProperty('GetAllCategoriesNameImageCountCategory');
  expect(typeof S.GetAllCategoriesNameImageCountCategory.execute).toBe('function');
});
