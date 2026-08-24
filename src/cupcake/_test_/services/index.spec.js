describe('services/index cupcake (aggregator)', () => {

  test('exporta los services de cupcake', () => {

    const S =
      require('../../services/index');

    expect(S).toHaveProperty(
      'ServiceCupcake'
    );

    expect(S).toHaveProperty(
      'ServiceCupcakeUserState'
    );

    expect(S).toHaveProperty(
      'ServiceCupcakeRating'
    );

    expect(S).toHaveProperty(
      'ServiceCupcakeCollection'
    );
  });

});