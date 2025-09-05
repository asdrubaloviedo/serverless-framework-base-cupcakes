describe('repositories/index user', () => {
  test('exporta UserRepository, UserMedalLeageRepository y UserPackageRepository', () => {
    const R = require('../../repositories');
    expect(R).toHaveProperty('UserRepository');
    expect(R).toHaveProperty('UserMedalLeageRepository');
    expect(R).toHaveProperty('UserPackageRepository');
  });
});
