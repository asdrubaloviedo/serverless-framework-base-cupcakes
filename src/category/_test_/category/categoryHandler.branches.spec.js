process.env.ENDPOINT_ROOT = 'cupcakeslife';
process.env.CATEGORY_MODULE = 'categorias';

const CategoryController = require('@category/controller/category');

jest.spyOn(CategoryController, 'getAllNameImageCount').mockResolvedValue([{ ok: 1 }]);

// silencia console.error de withHandler en tests que provocan error
beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

const freshHandler = () => {
  // aísla el módulo por si algún test dejó estado previo
  jest.resetModules();
  process.env.ENDPOINT_ROOT = process.env.ENDPOINT_ROOT || 'cupcakeslife';
  process.env.CATEGORY_MODULE = process.env.CATEGORY_MODULE || 'categorias';
  return require('@category/handlers/category').handler;
};

const ev = (over = {}) => ({
  rawPath: over.rawPath,
  path: over.path,
  requestContext: over.requestContext ?? { stage: 'local', http: { method: 'GET' } },
  queryStringParameters: over.queryStringParameters
});

describe('category.handler branches', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sin stage, sin env root/mod, trailing slash, usa path', async () => {
    const oldRoot = process.env.ENDPOINT_ROOT;
    const oldMod  = process.env.CATEGORY_MODULE;
    delete process.env.ENDPOINT_ROOT;
    delete process.env.CATEGORY_MODULE;

    const handler = freshHandler();

    const res = await handler(ev({
      // sin rawPath → usa path
      path: 'categorias-imagen-cantidad/', // sin slash inicial + trailing slash
      requestContext: { /* sin stage */ http: { /* sin method */ } },
      queryStringParameters: undefined
    }));

    process.env.ENDPOINT_ROOT = oldRoot;
    process.env.CATEGORY_MODULE = oldMod;

    expect(res.statusCode).toBe(200);
    expect(CategoryController.getAllNameImageCount).toHaveBeenCalledWith({});
  });

  test('strip case p===pref con "/local/cupcakeslife" → 404', async () => {
    const handler = freshHandler();

    const res = await handler(ev({
      rawPath: '/local/cupcakeslife', // tras strip stage queda "/cupcakeslife" y luego "/" al strip root
      requestContext: { stage: 'local', http: { method: 'DELETE' } } // método no mapeado
    }));

    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.message).toBe('Not Found');
    // opcional: verifica qué ruta intentó
    expect(body.pathTried).toBe('DELETE /');
  });

  test('methodOf via httpMethod (sin requestContext.http)', async () => {
    const handler = freshHandler();

    const res = await handler(ev({
      rawPath: '/local/cupcakeslife/categorias/categorias-imagen-cantidad',
      httpMethod: 'GET',
      requestContext: { stage: 'local' }
    }));
    expect(res.statusCode).toBe(200);
  });

  test('methodOf por default GET (sin httpMethod ni http.method)', async () => {
    const handler = freshHandler();

    const res = await handler(ev({
      rawPath: '/local/cupcakeslife/categorias/categorias-imagen-cantidad',
      requestContext: { stage: 'local', http: {} }
    }));
    expect(res.statusCode).toBe(200);
  });

  test('err con statusCode propio → fail usa ese código', async () => {
    const handler = freshHandler();
    CategoryController.getAllNameImageCount.mockRejectedValueOnce({ statusCode: 418, message: 'teapot' });

    const res = await handler(ev({
      rawPath: '/local/cupcakeslife/categorias/categorias-imagen-cantidad',
      requestContext: { stage: 'local', http: { method: 'GET' } }
    }));

    expect(res.statusCode).toBe(418);
    expect(JSON.parse(res.body).message).toBe('teapot');
  });

  test('qs() con null → {}', async () => {
    const handler = freshHandler();
    const res = await handler(ev({
        rawPath: '/local/cupcakeslife/categorias/categorias-imagen-cantidad',
        requestContext: { stage: 'local', http: { method: 'GET' } },
        queryStringParameters: null
    }));
    expect(res.statusCode).toBe(200);
    expect(CategoryController.getAllNameImageCount).toHaveBeenCalledWith({});
  });

});
