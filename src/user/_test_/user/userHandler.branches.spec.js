// src/user/_test_/user/userHandler.branches.spec.js
jest.mock('@user/schema/user', () => ({
  validateCreateUserMedalLeage: jest.fn((d) => ({ success: true, data: d })),
  validatePatchUserMedalLeage: jest.fn((d) => ({ success: true, data: d })),
  validateCreateUserPackage: jest.fn((d) => ({ success: true, data: d })),
  validateCreateUser: jest.fn((d) => ({ success: true, data: d })),
}));

const schema = require('@user/schema/user');
const Ctrl = require('@user/controller/user');
const { handler } = require('../../handlers/user');

function ev({ p = '/', method = 'POST', body, env = {}, http } = {}) {
  Object.assign(process.env, env);
  const e = {
    path: p,
    rawPath: p,
    queryStringParameters: {},
    requestContext: {},
  };
  if (method !== undefined) e.httpMethod = method;
  if (http?.stage) e.requestContext.stage = http.stage;
  if (http?.method && method === undefined) e.requestContext.http = { method: http.method };
  if (body !== undefined) e.body = typeof body === 'string' ? body : JSON.stringify(body);
  return e;
}

const ORIG_ENV = { ...process.env };

beforeAll(() => {
  Ctrl.createOneUserMedalLeage = jest.fn();
  Ctrl.patchOneUserMedalLeage = jest.fn();
  Ctrl.createOneUserPackage = jest.fn();
  Ctrl.createOneUser = jest.fn();
});

beforeEach(() => {
  process.env = { ...ORIG_ENV, USER_MODULE: 'usuarios' };
  jest.clearAllMocks();

  // valores por defecto de los controladores para estas pruebas de "branches"
  Ctrl.createOneUserMedalLeage.mockResolvedValue([{ ok: 1 }]);
  Ctrl.patchOneUserMedalLeage.mockResolvedValue([{ ok: 2 }]);
  Ctrl.createOneUserPackage.mockResolvedValue([{ ok: 3 }]);
  Ctrl.createOneUser.mockResolvedValue([{ ok: 4 }]);

  // validaciones OK por defecto
  schema.validateCreateUserMedalLeage.mockImplementation((d) => ({ success: true, data: d }));
  schema.validatePatchUserMedalLeage.mockImplementation((d) => ({ success: true, data: d }));
  schema.validateCreateUserPackage.mockImplementation((d) => ({ success: true, data: d }));
  schema.validateCreateUser.mockImplementation((d) => ({ success: true, data: d }));
});

describe('user.handler branches', () => {
  test('sin stage, trailing slash', async () => {
    const res = await handler(
      ev({ p: '/insertar-usuario-medalla/', method: 'POST', body: { email: 'a@a.com', medalla: 'oro' } })
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 1 }]);
    expect(Ctrl.createOneUserMedalLeage).toHaveBeenCalledWith({ email: 'a@a.com', medalla: 'oro' });
  });

  test('methodOf via httpMethod', async () => {
    const res = await handler(
      ev({ p: '/actualizar-usuario-medalla', method: 'PATCH', body: { email: 'a@a.com', cupcake: 1, estado: true, valor: 5 } })
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 2 }]);
    expect(Ctrl.patchOneUserMedalLeage).toHaveBeenCalled();
  });

  test('methodOf via requestContext.http.method', async () => {
    const res = await handler(
      ev({
        p: '/insertar-usuario-paquete',
        method: undefined,
        http: { method: 'POST' },
        body: { email: 'a@a.com', paquete: 9 },
      })
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 3 }]);
    expect(Ctrl.createOneUserPackage).toHaveBeenCalledWith({ email: 'a@a.com', paquete: 9 });
  });

  test('err con statusCode propio → 418', async () => {
    Ctrl.createOneUserPackage.mockRejectedValueOnce({ statusCode: 418, message: 'teapot' });
    const res = await handler(
      ev({ p: '/insertar-usuario-paquete', method: 'POST', body: { email: 'x@x.com', paquete: 1 } })
    );
    expect(res.statusCode).toBe(418);
    expect(JSON.parse(res.body).message).toBe('teapot');
  });

  test('JSON inválido → 400', async () => {
    const res = await handler(ev({ p: '/insertar-usuario-paquete', method: 'POST', body: '{bad json' }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('JSON inválido');
  });

  test('validación email requerido → 400', async () => {
    schema.validateCreateUser.mockReturnValueOnce({
      success: false,
      error: { issues: [{ code: 'invalid_type', received: 'undefined', path: ['email'] }] },
    });
    const res = await handler(ev({ p: '/insertar-usuario-nuevo', method: 'POST', body: {} }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('User email is required.');
  });

  test('validación otro field requerido → 400', async () => {
    schema.validatePatchUserMedalLeage.mockReturnValueOnce({
      success: false,
      error: { issues: [{ code: 'invalid_type', received: 'undefined', path: ['valor'] }] },
    });
    const res = await handler(ev({ p: '/actualizar-usuario-medalla', method: 'PATCH', body: {} }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Field is required.');
  });

  test('env con slash y path sin slash inicial → 200', async () => {
    Ctrl.createOneUserPackage.mockResolvedValueOnce([{ ok: 5 }]);
    const res = await handler(
      ev({
        p: '/usuarios/insertar-usuario-paquete', // <-- cambio: con slash inicial para que se quite el módulo
        method: 'POST',
        body: { email: 'b@b.com', paquete: 9 },
        env: { ENDPOINT_ROOT: '/cupcakeslife', USER_MODULE: '/usuarios' },
      })
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 5 }]);
  });
});
