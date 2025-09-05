// Handler: happy/500
jest.mock('@user/controller/user', () => ({
  createOneUserMedalLeage: jest.fn(),
  patchOneUserMedalLeage: jest.fn(),
  createOneUserPackage: jest.fn(),
  createOneUser: jest.fn(),
}));

// Validators: por defecto validan OK y devuelven el mismo body
jest.mock('@user/schema/user', () => ({
  validateCreateUserMedalLeage: jest.fn((d) => ({ success: true, data: d })),
  validatePatchUserMedalLeage: jest.fn((d) => ({ success: true, data: d })),
  validateCreateUserPackage: jest.fn((d) => ({ success: true, data: d })),
  validateCreateUser: jest.fn((d) => ({ success: true, data: d })),
}));

const Ctrl = require('@user/controller/user');
const { handler } = require('../../handlers/user');

const ev = (p, method, bodyObj) => ({
  rawPath: p,
  path: p,
  httpMethod: method,
  requestContext: { stage: 'local' },
  body: bodyObj == null ? null : JSON.stringify(bodyObj),
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ENDPOINT_ROOT = '';
  process.env.USER_MODULE = 'usuarios';
});

describe('User handler', () => {
  test('POST /insertar-usuario-medalla -> 200', async () => {
    Ctrl.createOneUserMedalLeage.mockResolvedValue([{ ok: 1 }]);
    const res = await handler(ev('/usuarios/insertar-usuario-medalla', 'POST', { email: 'a@a.com', medalla: 'x' }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 1 }]);
    expect(Ctrl.createOneUserMedalLeage).toHaveBeenCalledWith({ email: 'a@a.com', medalla: 'x' });
  });

  test('PATCH /actualizar-usuario-medalla -> 200', async () => {
    Ctrl.patchOneUserMedalLeage.mockResolvedValue([{ ok: 2 }]);
    const body = { email: 'a@a.com', cupcake: 1, estado: true, valor: 5 };
    const res = await handler(ev('/usuarios/actualizar-usuario-medalla', 'PATCH', body));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 2 }]);
    expect(Ctrl.patchOneUserMedalLeage).toHaveBeenCalledWith(body);
  });

  test('POST /insertar-usuario-paquete -> 200', async () => {
    Ctrl.createOneUserPackage.mockResolvedValue([{ ok: 3 }]);
    const res = await handler(ev('/usuarios/insertar-usuario-paquete', 'POST', { email: 'a@a.com', paquete: 9 }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 3 }]);
    expect(Ctrl.createOneUserPackage).toHaveBeenCalledWith({ email: 'a@a.com', paquete: 9 });
  });

  test('POST /insertar-usuario-nuevo -> 200', async () => {
    Ctrl.createOneUser.mockResolvedValue([{ ok: 4 }]);
    const res = await handler(ev('/usuarios/insertar-usuario-nuevo', 'POST', { email: 'b@b.com' }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 4 }]);
    expect(Ctrl.createOneUser).toHaveBeenCalledWith({ email: 'b@b.com' });
  });

  test('error del controlador -> 500 (propaga message)', async () => {
    Ctrl.createOneUser.mockRejectedValue(new Error('boom'));
    const res = await handler(ev('/usuarios/insertar-usuario-nuevo', 'POST', { email: 'x@x.com' }));
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('boom');
  });
});
