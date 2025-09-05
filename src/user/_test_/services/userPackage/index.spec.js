describe('services/userPackage/index', () => {
  test('exporta CreateOneUserPackage', () => {
    const S = require('@user/services/userPackage'); // alias
    expect(S).toHaveProperty('CreateOneUserPackage');
  });
});
