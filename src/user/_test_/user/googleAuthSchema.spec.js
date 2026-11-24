const { validateGoogleAuthUser } = require('@user/schema/user');
const token = 'valid-test-token-123456789';
describe('Esquema google-auth', () => {
 test.each(['login','register'])('acepta acción %s', action => {
  expect(validateGoogleAuthUser({idToken:token,action}).success).toBe(true);
 });
 test.each([
  [{action:'login'}],
  [{idToken:token}],
  [{idToken:'short',action:'login'}],
  [{idToken:token,action:'delete'}],
  [{idToken:token,action:'login',email:'forged@example.com'}],
  [{idToken:token,action:'register',nombre:'a'.repeat(51)}]
 ])('rechaza body inválido %#', body => {
  expect(validateGoogleAuthUser(body).success).toBe(false);
 });
});
