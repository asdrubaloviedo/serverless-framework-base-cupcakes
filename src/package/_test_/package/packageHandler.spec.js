describe('Package handler', () => {
  const ev = (path, method = 'GET', extra = {}) => ({
    path,
    httpMethod: method,
    requestContext: { stage: 'local', http: { method } },
    ...extra,
  });

  const load = ({ ctrl, env } = {}) => {
    jest.resetModules();
    process.env.ENDPOINT_ROOT = env?.root ?? '/cupcakeslife';
    // 🔧 clave: fijar explícitamente el módulo para que normalize lo stripee
    process.env.PACKAGE_MODULE = env?.mod ?? 'paquetes';

    jest.doMock('@package/controller/package', () => ctrl || ({
      getAll: jest.fn().mockResolvedValue([{ id: 1 }]),
    }));

    return require('@package/handlers/package').handler;
  };

  test('GET con email -> 200', async () => {
    const mock = { getAll: jest.fn().mockResolvedValue([{ id: 1 }]) };
    const handler = load({ ctrl: mock });

    const res = await handler(
      ev('/local/cupcakeslife/paquetes/usuario-paquetes-faltantes', 'GET', {
        queryStringParameters: { email: 'User@Mail.com' },
      })
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 1 }]);
    expect(mock.getAll).toHaveBeenCalledWith({ email: 'User@Mail.com' });
  });

  test('GET sin email (controller decide qué devolver) -> 200', async () => {
    const mock = { getAll: jest.fn().mockResolvedValue([{ id: 2 }]) };
    const handler = load({ ctrl: mock });

    const res = await handler(
      ev('/local/cupcakeslife/paquetes/usuario-paquetes-faltantes', 'GET', {
        queryStringParameters: {},
      })
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 2 }]);
    expect(mock.getAll).toHaveBeenCalledWith({});
  });

  test('error del controlador -> 500 (propaga message)', async () => {
    const mock = { getAll: jest.fn().mockRejectedValue(new Error('boom')) };
    const handler = load({ ctrl: mock });

    const res = await handler(
      ev('/local/cupcakeslife/paquetes/usuario-paquetes-faltantes', 'GET', {
        queryStringParameters: { email: 'a@b.com' },
      })
    );

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('boom');
  });
});
