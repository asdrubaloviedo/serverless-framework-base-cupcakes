describe('ingredient.handler branches', () => {
  const ev = (path, method = 'GET', extra = {}) => ({
    path,
    httpMethod: method,
    requestContext: { stage: extra.stage ?? 'local', http: { method } },
    ...extra,
  });

  const load = ({ ctrl, env } = {}) => {
    jest.resetModules();
    // Sentinel para evitar strip del módulo por el fallback 'ingredientes'
    process.env.ENDPOINT_ROOT = env?.root ?? '';
    process.env.INGREDIENT_MODULE = env?.mod ?? '___DISABLED___';
    jest.doMock('@ingredient/controller/ingredient', () => ctrl || ({
      getById: jest.fn().mockResolvedValue([{ ok: 1 }]),
    }));
    return require('@ingredient/handlers/ingredient').handler;
  };

  test('sin stage, sin env root/mod, trailing slash, usa path', async () => {
    const handler = load({
      env: { root: '', mod: '___DISABLED___' },
      ctrl: { getById: jest.fn().mockResolvedValue([{ ok: 1 }]) }
    });
    const res = await handler(
      ev('/ingredientes/', 'GET', { requestContext: { stage: undefined, http: { method: 'GET' } } })
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 1 }]);
  });

  test('methodOf via httpMethod (sin requestContext.http)', async () => {
    const handler = load({
      ctrl: { getById: jest.fn().mockResolvedValue([{ ok: 2 }]) }
    });
    const res = await handler({
      path: '/local/ingredientes',
      httpMethod: 'GET',
      requestContext: { stage: 'local' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 2 }]);
  });

  test('methodOf por default GET (sin httpMethod ni http.method)', async () => {
    const handler = load({
      ctrl: { getById: jest.fn().mockResolvedValue([{ ok: 3 }]) }
    });
    const res = await handler({
      path: '/local/ingredientes',
      requestContext: { stage: 'local', http: {} },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 3 }]);
  });

  test('err con statusCode propio → fail usa ese código', async () => {
    const handler = load({
      ctrl: { getById: jest.fn().mockRejectedValue({ statusCode: 418, message: 'teapot' }) }
    });
    const res = await handler(ev('/local/ingredientes', 'GET'));
    expect(res.statusCode).toBe(418);
    expect(JSON.parse(res.body).message).toBe('teapot');
  });

  test('qs() con null → ok', async () => {
    const ctrl = { getById: jest.fn().mockResolvedValue([{ ok: 4 }]) };
    const handler = load({ ctrl, env: { root: '/cupcakeslife', mod: '___DISABLED___' } });
    const res = await handler({
      path: '/local/cupcakeslife/ingredientes',
      requestContext: { stage: 'local', http: { method: 'GET' } },
      queryStringParameters: null,
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 4 }]);
    expect(ctrl.getById).toHaveBeenCalledWith({});
  });

  test('env con slash y path sin slash inicial → 200', async () => {
    const handler = load({
      env: { root: '/cupcakeslife', mod: '___DISABLED___' },
      ctrl: { getById: jest.fn().mockResolvedValue([{ ok: 5 }]) }
    });
    const res = await handler({
      path: '/local/cupcakeslife/ingredientes',
      requestContext: { stage: 'local', http: { method: 'GET' } }
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 5 }]);
  });
});
