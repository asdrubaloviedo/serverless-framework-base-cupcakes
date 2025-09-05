// Smoke: asegura que el index de repositories exporta PackageRepository
describe('repositories/index.js (package)', () => {
  test('exporta PackageRepository', () => {
    const R = require('@package/repositories');
    expect(R).toHaveProperty('PackageRepository');
    expect(typeof R.PackageRepository).toBe('function');
  });
});
