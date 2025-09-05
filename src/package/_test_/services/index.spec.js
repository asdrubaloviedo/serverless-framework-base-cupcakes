// Smoke de services/index.js (corrige "requiere")
describe('services/index package', () => {
  test('exporta ServicePackage', () => {
    jest.resetModules();
    global.requiere = require; // para el typo en el archivo real

    jest.doMock('@package/services/package', () => ({
      GetAllPackage: { execute: jest.fn() },
    }), { virtual: true });

    const S = require('@package/services/index');
    expect(S).toHaveProperty('ServicePackage');
    expect(S.ServicePackage).toHaveProperty('GetAllPackage');
  });
});
