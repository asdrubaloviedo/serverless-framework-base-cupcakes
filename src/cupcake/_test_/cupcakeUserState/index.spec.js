describe('services/cupcakeUserState/index', () => {
  test('exporta GetByIdCupcakeUserStateCupcake, CreateOneCupcakeUserStateCupcake, PatchOneCupcakeUserStateCupcake', () => {
    const S = require('../../services/cupcakeUserState');
    expect(S).toHaveProperty('GetByIdCupcakeUserStateCupcake');
    expect(S).toHaveProperty('CreateOneCupcakeUserStateCupcake');
    expect(S).toHaveProperty('PatchOneCupcakeUserStateCupcake');
  });
});
