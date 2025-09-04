describe('Ingredient handler', () => {
  const ev = (path, method = 'GET', extra = {}) => ({
    path,
    httpMethod: method,
    requestContext: { stage: 'local', http: { method } },
    ...extra,
  });

  const load = ({ ctrl, env } = {}) => {
    jest.resetModules();
    // Importante: usar sentinel para no hacer strip del módulo
    process.env.ENDPOINT_ROOT = env?.root ?? '/cupcakeslife';
    process.env.INGREDIENT_MODULE = env?.mod ?? '___DISABLED___';
    jest.doMock('@ingredient/controller/ingredient', () => ctrl || ({
      getById: jest.fn().mockResolvedValue([{ id: 1 }]),
    }));
    return require('@ingredient/handlers/ingredient').handler;
  };

  test('GET con id -> 200', async () => {
    const mock = { getById: jest.fn().mockResolvedValue([{ id: 1 }]) };
    const handler = load({ ctrl: mock });

    const res = await handler(
      ev('/local/cupcakeslife/ingredientes', 'GET', { queryStringParameters: { id: '7' } })
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 1 }]);
    expect(mock.getById).toHaveBeenCalledWith({ id: '7' });
  });

  test('GET sin id -> 200 (controller decide qué devolver)', async () => {
    const mock = { getById: jest.fn().mockResolvedValue([{ id: 2 }]) };
    const handler = load({ ctrl: mock });

    const res = await handler(
      ev('/local/cupcakeslife/ingredientes', 'GET', { queryStringParameters: {} })
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 2 }]);
    expect(mock.getById).toHaveBeenCalledWith({});
  });

  test('error del controlador -> 500 (propaga message)', async () => {
    const mock = { getById: jest.fn().mockRejectedValue(new Error('boom')) };
    const handler = load({ ctrl: mock });

    const res = await handler(
      ev('/local/cupcakeslife/ingredientes', 'GET', { queryStringParameters: { id: '1' } })
    );

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('boom');
  });
});
