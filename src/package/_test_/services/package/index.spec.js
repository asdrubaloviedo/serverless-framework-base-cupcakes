// Smoke: asegura que el index del submódulo services/package exporta GetAllPackage
describe('services/package/index.js', () => {
  test('exporta GetAllPackage', () => {
    const S = require('@package/services/package');
    expect(S).toHaveProperty('GetAllPackage');
    expect(typeof S.GetAllPackage.execute).toBe('function');
  });
});
