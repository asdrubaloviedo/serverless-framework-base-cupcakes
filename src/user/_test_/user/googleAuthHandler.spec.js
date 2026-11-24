jest.mock('@user/controller/user', () => ({ googleAuthUser: jest.fn() }));
const UserController = require('@user/controller/user');
const { handler } = require('@user/handlers/user');
const event = (body) => ({httpMethod:'POST',path:'/cupcakeslife/usuarios/google-auth',body:JSON.stringify(body)});
const token='valid-test-token-123456789';
beforeEach(() => {jest.clearAllMocks();process.env.ENDPOINT_ROOT='cupcakeslife';process.env.USER_MODULE='usuarios';});
describe('handler POST /google-auth', () => {
 test('login válido: responde 200', async () => {
  UserController.googleAuthUser.mockResolvedValue({success:true,action:'login',email:'a@example.com'});
  const result = await handler(event({idToken:token,action:'login'}));
  expect(result.statusCode).toBe(200);
  expect(JSON.parse(result.body)).toMatchObject({success:true,action:'login'});
  expect(UserController.googleAuthUser).toHaveBeenCalledWith({idToken:token,action:'login'});
 });
 test.each([[404,'No existe una cuenta registrada con este correo'],[409,'Este correo ya se encuentra registrado'],[401,'Token inválido']])('error de negocio %s', async (code,message) => {
  UserController.googleAuthUser.mockRejectedValue({statusCode:code,message});
  const result=await handler(event({idToken:token,action:'login'}));
  expect(result.statusCode).toBe(code);
  expect(JSON.parse(result.body).message).toBe(message);
 });
 test('solicitud sin token no llega al controller', async () => {
  const result=await handler(event({action:'login'}));
  expect(result.statusCode).toBeGreaterThanOrEqual(400);
  expect(UserController.googleAuthUser).not.toHaveBeenCalled();
 });
});
