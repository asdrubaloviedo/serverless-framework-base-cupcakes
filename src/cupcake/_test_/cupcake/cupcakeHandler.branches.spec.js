jest.mock('@cupcake/controller/cupcake', () => ({
  doTest: jest.fn(),
  getAll: jest.fn().mockResolvedValue([{ ok: 1 }]),
  getAllNameImage: jest.fn().mockResolvedValue([{ ok: 2 }]),
  getAllNameImageMovies: jest.fn().mockResolvedValue([{ ok: 3 }]),
  getById: jest.fn().mockResolvedValue([{ ok: 4 }]),
  getByIdInfoImage: jest.fn().mockResolvedValue([{ ok: 5 }]),
  getByIdCupcakeUserState: jest.fn().mockResolvedValue([{ ok: 6 }]),
  createOneCupcakeUserState: jest.fn().mockResolvedValue([{ ok: 7 }]),
  patchOneCupcakeUserState: jest.fn().mockResolvedValue([{ ok: 8 }]),
  getAllRamdom: jest.fn().mockResolvedValue([{ ok: 9 }]),
  getAllNameImageFiltros: jest.fn().mockResolvedValue([{ ok: 10 }]),
}));
jest.mock('@cupcake/schema/cupcake', () => {
  const mod = {
    validateCupcakeUserState: jest.fn((d) => ({ success: true, data: d })),
    validatePartialCupcakeUserState: jest.fn((d) => ({ success: true, data: d })),
  };
  return mod;
});

const schema = require('@cupcake/schema/cupcake');
const { handler } = require('../../handlers/cupcake');

describe('cupcake.handler branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENDPOINT_ROOT = '';
    process.env.CUPCAKE_MODULE = 'cupcakes';
  });

  const evt = (method, path, extras={}) => ({
    httpMethod: method,
    rawPath: path,
    requestContext: {},
    ...extras
  });

  test('sin stage, trailing slash -> 200', async () => {
    const res = await handler(evt('GET', '/cupcakes/'));
    expect(res.statusCode).toBe(200);
  });

  test('methodOf via requestContext.http.method', async () => {
    const res = await handler({
      rawPath: '/cupcakes/',
      requestContext: { http: { method: 'get' } }
    });
    expect(res.statusCode).toBe(200);
  });

  test('JSON inválido -> 400', async () => {
    const res = await handler({
      httpMethod: 'POST',
      rawPath: '/cupcakes/insertar-cupcake-estados',
      body: '{bad'
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('JSON inválido');
  });

  test('validación email requerido -> 400 (mensaje fijo)', async () => {
    schema.validateCupcakeUserState.mockImplementationOnce(() => ({
      success: false,
      error: { issues: [{ code: 'invalid_type', received: 'undefined', path: ['email'] }] }
    }));
    const res = await handler({
      httpMethod: 'POST',
      rawPath: '/cupcakes/insertar-cupcake-estados',
      body: JSON.stringify({})
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('User email is required.');
  });

  test('env con slash y path sin slash inicial → 200 (usamos rawPath con /)', async () => {
    process.env.ENDPOINT_ROOT = '/api';
    process.env.CUPCAKE_MODULE = '/cupcakes';
    const res = await handler({
      httpMethod: 'POST',
      rawPath: '/api/cupcakes/insertar-cupcake-estados',
      body: JSON.stringify({ email: 'a@a.com', cupcake: 1, estado: 2 })
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 7 }]);
  });

  test('con stage en path → 200', async () => {
    const res = await handler({
      httpMethod: 'GET',
      rawPath: '/dev/cupcakes/',
      requestContext: { stage: 'dev' }
    });
    expect(res.statusCode).toBe(200);
  });
});
