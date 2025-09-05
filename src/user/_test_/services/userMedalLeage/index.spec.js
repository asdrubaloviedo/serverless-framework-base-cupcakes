describe('services/userMedalLeage/index', () => {
  test('exporta CreateOneUserMedalLeage y UpdateUserMedalLeage', () => {
    const S = require('@user/services/userMedalLeage'); // alias
    expect(S).toHaveProperty('CreateOneUserMedalLeage');
    expect(S).toHaveProperty('UpdateUserMedalLeage');
  });
});
