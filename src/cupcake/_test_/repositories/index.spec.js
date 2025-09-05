describe('repositories/index cupcake', () => {
  test('exporta CupcakeRepository y CupcakeUserStateRepository', () => {
    const R = require('../../repositories/index');
    expect(R).toHaveProperty('CupcakeRepository');
    expect(R).toHaveProperty('CupcakeUserStateRepository');
  });
});
