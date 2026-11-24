jest.mock('@user/services/user/FirebaseAuthService', () => ({ getAuth: jest.fn() }));
jest.mock('@user/repositories', () => ({ UserRepository: jest.fn() }));
const FirebaseAuthService = require('@user/services/user/FirebaseAuthService');
const { UserRepository } = require('@user/repositories');
const GoogleAuthUser = require('@user/services/user/GoogleAuthUser');
const verifyIdToken = jest.fn();
const existsByEmail = jest.fn();
const registerGoogle = jest.fn();
const token = 'valid-test-token-123456789';
const decoded = { email: 'USER@EXAMPLE.COM', email_verified: true, name: 'Nombre Google', firebase: { sign_in_provider: 'google.com' } };
beforeEach(() => {
 jest.clearAllMocks();
 FirebaseAuthService.getAuth.mockReturnValue({ verifyIdToken });
 UserRepository.mockImplementation(() => ({ existsByEmail, registerGoogle }));
 verifyIdToken.mockResolvedValue(decoded);
});
describe('GoogleAuthUser', () => {
 test('login existente: permite acceso sin insertar', async () => {
  existsByEmail.mockResolvedValue(true);
  await expect(GoogleAuthUser.execute({idToken:token,action:'login'})).resolves.toEqual({success:true,action:'login',email:'user@example.com'});
  expect(existsByEmail).toHaveBeenCalledWith({email:'user@example.com'});
  expect(registerGoogle).not.toHaveBeenCalled();
  expect(verifyIdToken).toHaveBeenCalledWith(token,true);
 });
 test('login inexistente: 404 sin insertar', async () => {
  existsByEmail.mockResolvedValue(false);
  await expect(GoogleAuthUser.execute({idToken:token,action:'login'})).rejects.toMatchObject({statusCode:404});
  expect(registerGoogle).not.toHaveBeenCalled();
 });
 test('registro nuevo: crea usuario', async () => {
  registerGoogle.mockResolvedValue([{usuario_id:42}]);
  await expect(GoogleAuthUser.execute({idToken:token,action:'register',nombre:'Ana López'})).resolves.toMatchObject({success:true,action:'register'});
  expect(registerGoogle).toHaveBeenCalledWith({nombre:'Ana López',email:'user@example.com'});
 });
 test('registro duplicado: 409', async () => {
  registerGoogle.mockResolvedValue([]);
  await expect(GoogleAuthUser.execute({idToken:token,action:'register'})).rejects.toMatchObject({statusCode:409});
 });
 test('token inválido: 401 sin acceder a base de datos', async () => {
  verifyIdToken.mockRejectedValue(new Error('invalid token'));
  await expect(GoogleAuthUser.execute({idToken:token,action:'login'})).rejects.toMatchObject({statusCode:401});
  expect(UserRepository).not.toHaveBeenCalled();
 });
 test.each([
  [{...decoded,email_verified:false}],
  [{...decoded,firebase:{sign_in_provider:'password'}}],
  [{...decoded,email:''}]
 ])('identidad no válida: 403', async (claims) => {
  verifyIdToken.mockResolvedValue(claims);
  await expect(GoogleAuthUser.execute({idToken:token,action:'login'})).rejects.toMatchObject({statusCode:403});
  expect(UserRepository).not.toHaveBeenCalled();
 });
 test('error PostgreSQL se propaga', async () => {
  existsByEmail.mockRejectedValue(new Error('DB unavailable'));
  await expect(GoogleAuthUser.execute({idToken:token,action:'login'})).rejects.toThrow('DB unavailable');
 });
});
