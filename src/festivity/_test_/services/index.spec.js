// Smoke de services/index.js
describe('services/index festivity', () => {
  test('exporta ServiceFestivity con GetAllNameImageCountFestivity', () => {
    jest.resetModules();
    const mod = require('@festivity/services');
    expect(mod).toHaveProperty('ServiceFestivity');
    expect(mod.ServiceFestivity).toHaveProperty('GetAllNameImageCountFestivity');
    expect(typeof mod.ServiceFestivity.GetAllNameImageCountFestivity.execute).toBe('function');
  });
});
