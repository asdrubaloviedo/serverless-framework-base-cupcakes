// Casos felices + 404 + error controlado, cada test aísla el handler

const run = (event, controllerMock, opts = {}) => {
  let out;
  jest.isolateModules(() => {
    process.env.ENDPOINT_ROOT = opts.root ?? 'cupcakeslife';
    process.env.CATEGORY_MODULE = opts.mod ?? 'categorias';
    jest.doMock('@category/controller/category', () => controllerMock, { virtual: true });
    const { handler } = require('@category/handlers/category');
    out = handler(event);
  });
  return out;
};

const ev = (rawPath, method = 'GET', qs = {}) => ({
  rawPath,
  requestContext: { stage: 'local', http: { method } },
  queryStringParameters: qs
});

// Silenciar errores esperados
beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

describe('Category handler', () => {
  test('GET sin email -> 200', async () => {
    const res = await run(
      ev('/local/cupcakeslife/categorias/categorias-imagen-cantidad', 'GET'),
      { getAllNameImageCount: jest.fn().mockResolvedValue([{ id: 1 }]) }
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 1 }]);
  });

  test('GET con email -> 200', async () => {
    const res = await run(
      ev('/local/cupcakeslife/categorias/categorias-imagen-cantidad/usuario', 'GET', { email: 'a@b.com' }),
      { getAllNameImageCount: jest.fn().mockResolvedValue([{ id: 2 }]) }
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 2 }]);
  });

  test('error del controlador -> 500 (propaga message)', async () => {
    const res = await run(
      ev('/local/cupcakeslife/categorias/categorias-imagen-cantidad', 'GET'),
      { getAllNameImageCount: jest.fn().mockRejectedValue(new Error('boom')) }
    );

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('boom');
  });
});
