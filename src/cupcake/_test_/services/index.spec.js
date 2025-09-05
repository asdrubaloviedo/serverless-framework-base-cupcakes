describe('services/index cupcake (aggregator)', () => {
  test('exporta ServiceCupcake y ServiceCupcakeUserState', () => {
    const S = require('../../services/index');
    expect(S).toHaveProperty('ServiceCupcake');
    expect(S).toHaveProperty('ServiceCupcakeUserState');
  });
});
