jest.mock('@cupcake/controller/cupcake', () => ({
  doTest: jest.fn(),
  getAll: jest.fn(),
  getAllNameImage: jest.fn(),
  getAllNameImageMovies: jest.fn(),
  getById: jest.fn(),
  getByIdInfoImage: jest.fn(),
  getByIdCupcakeUserState: jest.fn(),
  createOneCupcakeUserState: jest.fn(),
  patchOneCupcakeUserState: jest.fn(),
  getAllRamdom: jest.fn(),
  getAllNameImageFiltros: jest.fn(),
}));
jest.mock('@cupcake/schema/cupcake', () => {
  // por defecto ambas validaciones son OK
  return {
    validateCupcakeUserState: jest.fn((d) => ({ success: true, data: d })),
    validatePartialCupcakeUserState: jest.fn((d) => ({ success: true, data: d })),
  };
});

const Ctrl = require('@cupcake/controller/cupcake');
const { handler } = require('../../handlers/cupcake');

describe('Cupcake handler', () => {
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

  test('GET / -> 200', async () => {
    Ctrl.getAll.mockResolvedValueOnce([{ id: 1 }]);
    const res = await handler(evt('GET', '/cupcakes/'));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 1 }]);
  });

  test('GET /cupcake -> 200', async () => {
    Ctrl.getById.mockResolvedValueOnce([{ id: 7 }]);
    const res = await handler(evt('GET', '/cupcakes/cupcake', { queryStringParameters: { id: 7 } }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 7 }]);
  });

  test('POST /insertar-cupcake-estados -> 200', async () => {
    Ctrl.createOneCupcakeUserState.mockResolvedValueOnce([{ ok: true }]);
    const res = await handler(evt('POST', '/cupcakes/insertar-cupcake-estados', {
      body: JSON.stringify({ email: 'a@a.com', cupcake: 1, estado: 2 })
    }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: true }]);
  });

  test('PATCH /actualizar-cupcake-estados -> 200', async () => {
    Ctrl.patchOneCupcakeUserState.mockResolvedValueOnce([{ ok: 'p' }]);
    const res = await handler(evt('PATCH', '/cupcakes/actualizar-cupcake-estados', {
      body: JSON.stringify({ email: 'a@a.com', cupcake: 1, estado: 2, valor: true })
    }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 'p' }]);
  });

  test('error del controlador -> 500 con message', async () => {
    Ctrl.getAll.mockRejectedValueOnce(new Error('boom'));
    const res = await handler(evt('GET', '/cupcakes/'));
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({ message: 'boom' });
  });
});
