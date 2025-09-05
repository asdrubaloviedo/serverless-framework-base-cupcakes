describe('package.handler branches', () => {
  const ev = (path, method = 'GET', extra = {}) => ({
    path,
    httpMethod: method,
    requestContext: { stage: extra.stage ?? 'local', http: { method } },
    ...extra,
  });

  const load = ({ ctrl, env } = {}) => {
    jest.resetModules();
    process.env.ENDPOINT_ROOT = env?.root ?? '';
    // 🔧 fijar el módulo para que strip('/paquetes') funcione siempre
    process.env.PACKAGE_MODULE = env?.mod ?? 'paquetes';

    jest.doMock('@package/controller/package', () => ctrl || ({
      getAll: jest.fn().mockResolvedValue([{ ok: 1 }]),
    }));

    return require('@package/handlers/package').handler;
  };

  test('sin stage, sin env root/mod, trailing slash, usa path', async () => {
    const handler = load({
      env: { root: '', mod: 'paquetes' },
      ctrl: { getAll: jest.fn().mockResolvedValue([{ ok: 1 }]) },
    });
    const res = await handler(
      ev('/usuario-paquetes-faltantes/', 'GET', {
        requestContext: { stage: undefined, http: { method: 'GET' } },
      })
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 1 }]);
  });

  test('methodOf via httpMethod (sin requestContext.http)', async () => {
    const handler = load({
      ctrl: { getAll: jest.fn().mockResolvedValue([{ ok: 2 }]) },
    });
    const res = await handler({
      path: '/local/paquetes/usuario-paquetes-faltantes',
      httpMethod: 'GET',
      requestContext: { stage: 'local' },
      queryStringParameters: { email: 'a@b.com' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 2 }]);
  });

  test('methodOf por default GET (sin httpMethod ni http.method)', async () => {
    const handler = load({
      ctrl: { getAll: jest.fn().mockResolvedValue([{ ok: 3 }]) },
    });
    const res = await handler({
      path: '/local/paquetes/usuario-paquetes-faltantes',
      requestContext: { stage: 'local', http: {} },
      queryStringParameters: { email: 'a@b.com' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 3 }]);
  });

  test('err con statusCode propio → fail usa ese código', async () => {
    const handler = load({
      ctrl: { getAll: jest.fn().mockRejectedValue({ statusCode: 418, message: 'teapot' }) },
    });
    const res = await handler(
      ev('/local/paquetes/usuario-paquetes-faltantes', 'GET', {
        queryStringParameters: { email: 'a@b.com' },
      })
    );
    expect(res.statusCode).toBe(418);
    expect(JSON.parse(res.body).message).toBe('teapot');
  });

  test('qs() con null → ok', async () => {
    const ctrl = { getAll: jest.fn().mockResolvedValue([{ ok: 4 }]) };
    const handler = load({ ctrl, env: { root: '/cupcakeslife' } });
    const res = await handler({
      path: '/local/cupcakeslife/paquetes/usuario-paquetes-faltantes',
      requestContext: { stage: 'local', http: { method: 'GET' } },
      queryStringParameters: null,
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 4 }]);
    expect(ctrl.getAll).toHaveBeenCalledWith({});
  });

  test('env con slash y path sin slash inicial → 200', async () => {
    const handler = load({
      env: { root: '/cupcakeslife' },
      ctrl: { getAll: jest.fn().mockResolvedValue([{ ok: 5 }]) },
    });
    const res = await handler({
      path: '/local/cupcakeslife/paquetes/usuario-paquetes-faltantes',
      requestContext: { stage: 'local', http: { method: 'GET' } },
      queryStringParameters: { email: 'a@b.com' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 5 }]);
  });
});
