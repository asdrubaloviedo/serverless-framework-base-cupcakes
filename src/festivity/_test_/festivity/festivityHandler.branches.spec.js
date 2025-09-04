// Handler: ramas y bordes (normalize, methodOf, fail, qs null)
describe('festivity.handler branches', () => {
  const ev = (path, method = 'GET', extra = {}) => ({
    path,
    httpMethod: method,
    requestContext: { stage: extra.stage ?? 'local', http: { method } },
    ...extra,
  });

  const load = ({ ctrl, env } = {}) => {
    jest.resetModules();
    process.env.ENDPOINT_ROOT = env?.root ?? '';
    process.env.FESTIVITY_MODULE = env?.mod ?? '';
    jest.doMock('@festivity/controller/festivity', () => ctrl || ({
      getAllNameImageCount: jest.fn().mockResolvedValue([{ ok: 1 }]),
    }));
    return require('@festivity/handlers/festivity').handler;
  };

  test('sin stage, sin env root/mod, trailing slash, usa path', async () => {
    const handler = load({
      env: { root: '', mod: '' },
      ctrl: { getAllNameImageCount: jest.fn().mockResolvedValue([{ ok: 1 }]) }
    });
    const res = await handler(
      ev('/festividades/festividades-imagen-cantidad/', 'GET', { requestContext: { stage: undefined, http: { method: 'GET' } } })
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 1 }]);
  });

  test('methodOf via httpMethod (sin requestContext.http)', async () => {
    const handler = load({
      ctrl: { getAllNameImageCount: jest.fn().mockResolvedValue([{ ok: 2 }]) }
    });
    const res = await handler({
      path: '/local/festividades/festividades-imagen-cantidad',
      httpMethod: 'GET',
      requestContext: { stage: 'local' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 2 }]);
  });

  test('methodOf por default GET (sin httpMethod ni http.method)', async () => {
    const handler = load({
      ctrl: { getAllNameImageCount: jest.fn().mockResolvedValue([{ ok: 3 }]) }
    });
    const res = await handler({
      path: '/local/festividades/festividades-imagen-cantidad',
      requestContext: { stage: 'local', http: {} },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 3 }]);
  });

  test('err con statusCode propio → fail usa ese código', async () => {
    const handler = load({
      ctrl: { getAllNameImageCount: jest.fn().mockRejectedValue({ statusCode: 418, message: 'teapot' }) }
    });
    const res = await handler(ev('/local/festividades/festividades-imagen-cantidad', 'GET'));
    expect(res.statusCode).toBe(418);
    expect(JSON.parse(res.body).message).toBe('teapot');
  });

  test('qs() con null → ok', async () => {
    const ctrl = { getAllNameImageCount: jest.fn().mockResolvedValue([{ ok: 4 }]) };
    const handler = load({ ctrl, env: { root: '/cupcakeslife', mod: '/festividades' } });
    const res = await handler({
      path: '/local/cupcakeslife/festividades/festividades-imagen-cantidad',
      requestContext: { stage: 'local', http: { method: 'GET' } },
      queryStringParameters: null,
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 4 }]);
  });

  // ⬇️ Ajuste: incluimos "/local/..." y el "/" inicial para que normalize pueda strippear stage/root/mod
  test('env con slash y path sin slash inicial → 200', async () => {
    const handler = load({
      env: { root: '/cupcakeslife', mod: '/festividades' },
      ctrl: { getAllNameImageCount: jest.fn().mockResolvedValue([{ ok: 5 }]) }
    });
    const res = await handler({
      path: '/local/cupcakeslife/festividades/festividades-imagen-cantidad',
      requestContext: { stage: 'local', http: { method: 'GET' } }
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ ok: 5 }]);
  });
});
