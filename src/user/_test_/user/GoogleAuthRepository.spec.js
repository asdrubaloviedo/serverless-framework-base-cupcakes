jest.mock('@user/models/user', () => ({ UserModel: { create: jest.fn(), getCreated: jest.fn() } }));
const { UserModel } = require('@user/models/user');
const { UserRepository } = require('@user/repositories');
beforeEach(() => jest.clearAllMocks());
describe('UserRepository Google', () => {
 const repo = new UserRepository();
 test('existsByEmail: encontrado', async () => {
  UserModel.getCreated.mockResolvedValue([{usuario_id:1}]);
  await expect(repo.existsByEmail({email:'a@example.com'})).resolves.toBe(true);
  const {query,params} = UserModel.getCreated.mock.calls[0][0];
  expect(query).toMatch(/SELECT usuario_id FROM usuarios/i);
  expect(params).toEqual(['a@example.com']);
 });
 test('existsByEmail: inexistente', async () => {
  UserModel.getCreated.mockResolvedValue([]);
  await expect(repo.existsByEmail({email:'missing@example.com'})).resolves.toBe(false);
 });
 test('registerGoogle: inserción parametrizada', async () => {
  UserModel.create.mockResolvedValue([{usuario_id:2}]);
  await expect(repo.registerGoogle({nombre:'Ana María',email:'ana@example.com'})).resolves.toEqual([{usuario_id:2}]);
  const {query,params} = UserModel.create.mock.calls[0][0];
  expect(query).toMatch(/ON CONFLICT \(email\) DO NOTHING/i);
  expect(query).toMatch(/RETURNING usuario_id/i);
  expect(params).toEqual(['Ana','María','ana@example.com']);
 });
 test('registerGoogle: duplicado devuelve array vacío', async () => {
  UserModel.create.mockResolvedValue([]);
  await expect(repo.registerGoogle({nombre:'Ana',email:'ana@example.com'})).resolves.toEqual([]);
 });
 test('error de DB no se oculta', async () => {
  UserModel.getCreated.mockRejectedValue(new Error('connection error'));
  await expect(repo.existsByEmail({email:'a@example.com'})).rejects.toThrow('connection error');
 });
});
