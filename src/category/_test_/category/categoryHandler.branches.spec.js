// Cobertura de ramas: normalize, methodOf, qs(null), error con statusCode,
// y caso extra: env con slash + path sin slash inicial que sí resuelve a 200.

const isolate = (factory) => {
  let out;
  jest.isolateModules(() => { out = factory(); });
  return out;
};

const runWith = (event, { root = 'cupcakeslife', mod = 'categorias', ctrl } = {}) =>
  isolate(() => {
    if (root == null) delete process.env.ENDPOINT_ROOT; else process.env.ENDPOINT_ROOT = root;
    if (mod == null) delete process.env.CATEGORY_MODULE; else process.env.CATEGORY_MODULE = mod;

    jest.doMock('@category/controller/category', () => ctrl, { virtual: true });
    const { handler } = require('@category/handlers/category');
    return handler(event);
  });

const ev = (over = {}) => ({
  rawPath: over.rawPath,
  path: over.path,
  httpMethod: over.httpMethod,
  requestContext: over.requestContext ?? { stage: 'local', http: { method: 'GET' } },
  queryStringParameters: over.queryStringParameters
});

beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

describe('category.handler branches', () => {
  test('sin stage, sin env root/mod, trailing slash, usa path', async () => {
    const res = await runWith(
      ev({
        path: '/categorias/categorias-imagen-cantidad/',
        requestContext: { /* sin stage */ http: { /* sin method */ } },
        queryStringParameters: undefined
      }),
      {
        root: null,
        mod: null,
        ctrl: { getAllNameImageCount: jest.fn().mockResolvedValue([{ ok: 1 }]) }
      }
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 1 }]);
  });

  test('methodOf via httpMethod (sin requestContext.http)', async () => {
    const res = await runWith(
      ev({
        rawPath: '/local/cupcakeslife/categorias/categorias-imagen-cantidad',
        httpMethod: 'GET',
        requestContext: { stage: 'local' }
      }),
      { ctrl: { getAllNameImageCount: jest.fn().mockResolvedValue([{ ok: 2 }]) } }
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 2 }]);
  });

  test('methodOf por default GET (sin httpMethod ni http.method)', async () => {
    const res = await runWith(
      ev({
        rawPath: '/local/cupcakeslife/categorias/categorias-imagen-cantidad',
        requestContext: { stage: 'local', http: {} }
      }),
      { ctrl: { getAllNameImageCount: jest.fn().mockResolvedValue([{ ok: 3 }]) } }
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 3 }]);
  });

  test('err con statusCode propio → fail usa ese código', async () => {
    const res = await runWith(
      ev({
        rawPath: '/local/cupcakeslife/categorias/categorias-imagen-cantidad',
        requestContext: { stage: 'local', http: { method: 'GET' } }
      }),
      { ctrl: { getAllNameImageCount: jest.fn().mockRejectedValue({ statusCode: 418, message: 'teapot' }) } }
    );
    expect(res.statusCode).toBe(418);
    expect(JSON.parse(res.body).message).toBe('teapot');
  });

  test('qs() con null → {}', async () => {
    const ctrl = { getAllNameImageCount: jest.fn().mockResolvedValue([{ ok: 4 }]) };
    const res = await runWith(
      ev({
        rawPath: '/local/cupcakeslife/categorias/categorias-imagen-cantidad',
        requestContext: { stage: 'local', http: { method: 'GET' } },
        queryStringParameters: null
      }),
      { ctrl }
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 4 }]);
    expect(ctrl.getAllNameImageCount).toHaveBeenCalledWith({});
  });

  // Ajuste: para que resuelva 200 con path sin slash inicial,
  // no incluyas root/mod en el path. ENV sí trae slash.
  test('env con slash y path sin slash inicial → 200', async () => {
    const res = await runWith(
      ev({
        // sin slash inicial
        path: 'categorias-imagen-cantidad',
        requestContext: { stage: 'local', http: { method: 'GET' } }
      }),
      {
        // env con slash
        root: '/cupcakeslife',
        mod: '/categorias',
        ctrl: { getAllNameImageCount: jest.fn().mockResolvedValue([{ ok: 5 }]) }
      }
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 5 }]);
  });
});
