describe('services/index cupcake (aggregator)', () => {

  test('exporta ServiceCupcake, ServiceCupcakeUserState y ServiceCupcakeRating', () => {

    const S = require('../../services/index');

    expect(S).toHaveProperty('ServiceCupcake');

    expect(S).toHaveProperty('ServiceCupcakeUserState');

    expect(S).toHaveProperty('ServiceCupcakeRating');

  });

});