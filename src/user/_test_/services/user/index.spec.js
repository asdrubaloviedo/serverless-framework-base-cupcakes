describe('services/user/index', () => {
  test('exporta CreateOneUser', () => {
    const S = require('@user/services/user'); // usar alias
    expect(S).toHaveProperty('CreateOneUser');
    expect(typeof S.CreateOneUser).toBe('function');
  });
});
