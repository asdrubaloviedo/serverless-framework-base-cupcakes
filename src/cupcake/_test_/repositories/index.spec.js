describe('repositories/index cupcake (aggregator)', () => {

  test('exporta repositories de cupcake', () => {

    const R =
      require('../../repositories/index');

    expect(R).toHaveProperty(
      'CupcakeRepository'
    );

    expect(R).toHaveProperty(
      'CupcakeUserStateRepository'
    );

    expect(R).toHaveProperty(
      'CupcakeRatingRepository'
    );

    expect(R).toHaveProperty(
      'CupcakeCollectionRepository'
    );
  });

});