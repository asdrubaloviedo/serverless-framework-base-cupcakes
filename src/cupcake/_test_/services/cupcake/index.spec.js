describe('services/cupcake/index', () => {
  test('exporta todos los servicios', () => {
    const S = require('../../../services/cupcake');
    expect(S).toHaveProperty('DoTestCupcake');
    expect(S).toHaveProperty('GetAllCupcake');
    expect(S).toHaveProperty('GetAllNameImageCupcake');
    expect(S).toHaveProperty('GetAllNameImageMoviesCupcake');
    expect(S).toHaveProperty('GetByIdCupcake');
    expect(S).toHaveProperty('GetByIdInfoImageCupcake');
    expect(S).toHaveProperty('GetAllRamdomCupcake');
    expect(S).toHaveProperty('GetAllNameImageFiltrosCupcake');
  });
});
