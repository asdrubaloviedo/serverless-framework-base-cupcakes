jest.mock('@user/services/user', () => ({ GoogleAuthUser: { execute: jest.fn() } }));
const { GoogleAuthUser } = require('@user/services/user');
const UserController = require('@user/controller/user');
test('controller delega los parámetros al servicio GoogleAuthUser', async () => {
 const input = {idToken:'valid-test-token-123456789',action:'login'};
 GoogleAuthUser.execute.mockResolvedValue({success:true,action:'login'});
 await expect(UserController.googleAuthUser(input)).resolves.toEqual({success:true,action:'login'});
 expect(GoogleAuthUser.execute).toHaveBeenCalledWith(input);
});
