describe('services/index ingredient', () => {
  test('exporta ServiceIngredient', () => {
    const S = require('@ingredient/services');
    expect(S).toHaveProperty('ServiceIngredient');
    // (smoke) no aseguramos estructura interna ya que depende del paquete local
    expect(S.ServiceIngredient).toBeTruthy();
  });
});
