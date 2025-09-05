describe('services/index user (aggregator)', () => {
  test('exporta ServiceUserMedalLeage, ServiceUserPackage y ServiceUser', () => {
    const S = require('../../services');
    expect(S).toHaveProperty('ServiceUserMedalLeage');
    expect(S).toHaveProperty('ServiceUserPackage');
    expect(S).toHaveProperty('ServiceUser');

    expect(S.ServiceUserMedalLeage).toHaveProperty('CreateOneUserMedalLeage');
    expect(S.ServiceUserMedalLeage).toHaveProperty('UpdateUserMedalLeage');
    expect(S.ServiceUserPackage).toHaveProperty('CreateOneUserPackage');
    expect(S.ServiceUser).toHaveProperty('CreateOneUser');
  });
});
