const ev = (path, method, qs) => ({
  rawPath: path,
  httpMethod: method,
  requestContext: {},
  queryStringParameters: qs,
});

describe('recipe.handler branches', () => {
  afterEach(() => {
    delete process.env.ENDPOINT_ROOT;
    delete process.env.RECIPE_MODULE;
    jest.resetModules();
    jest.clearAllMocks();
  });

  const build = (mockCtrl) => {
    jest.isolateModules(() => {
      jest.doMock('@recipe/controller/recipe', () => mockCtrl);
    });
    return require('../../handlers/recipe').handler;
  };

  test('sin stage, sin env root/mod, trailing slash, usa path', async () => {
    const handler = build({ getById: jest.fn().mockResolvedValue([{ ok: 1 }]) });

    const res = await handler(
      ev('/recipes/receta/', 'GET', {})
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 1 }]);
  });

  test('methodOf via httpMethod (sin requestContext.http)', async () => {
    const handler = build({ getById: jest.fn().mockResolvedValue([{ ok: 2 }]) });

    const res = await handler(ev('/recipes/receta', 'GET', {}));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 2 }]);
  });

  test('methodOf por default GET (sin httpMethod ni http.method)', async () => {
    const handler = build({ getById: jest.fn().mockResolvedValue([{ ok: 3 }]) });

    const res = await handler({ rawPath: '/recipes/receta' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 3 }]);
  });

  test('err con statusCode propio → fail usa ese código', async () => {
    const handler = build({
      getById: jest.fn().mockRejectedValue({ statusCode: 418, message: 'teapot' }),
    });

    const res = await handler(ev('/recipes/receta', 'GET', {}));
    expect(res.statusCode).toBe(418);
    expect(JSON.parse(res.body).message).toBe('teapot');
  });

  test('qs() con null → ok', async () => {
    const ctrl = { getById: jest.fn().mockResolvedValue([{ ok: 4 }]) };
    const handler = build(ctrl);

    const res = await handler({
      rawPath: '/recipes/receta',
      httpMethod: 'GET',
      queryStringParameters: null,
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 4 }]);
    expect(ctrl.getById).toHaveBeenCalledWith({});
  });

  test('env con slash y path sin slash inicial → 200', async () => {
    process.env.ENDPOINT_ROOT = '/local';
    process.env.RECIPE_MODULE = '/recipes';

    const handler = build({ getById: jest.fn().mockResolvedValue([{ ok: 5 }]) });

    const res = await handler(ev('receta', 'GET', {}));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 5 }]);
  });
});
