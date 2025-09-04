// Handler: casos básicos y error controlado
describe('Festivity handler', () => {
  const ev = (path, method = 'GET', qs) => ({
    path,
    httpMethod: method,
    requestContext: { stage: 'local', http: { method } },
    queryStringParameters: qs || undefined,
  });

  const load = ({ ctrl, env } = {}) => {
    jest.resetModules();
    process.env.ENDPOINT_ROOT = env?.root ?? '/cupcakeslife';
    process.env.FESTIVITY_MODULE = env?.mod ?? '/festividades';
    jest.doMock('@festivity/controller/festivity', () => ctrl || ({
      getAllNameImageCount: jest.fn().mockResolvedValue([{ id: 1 }]),
    }));
    return require('@festivity/handlers/festivity').handler;
  };

  test('GET sin email -> 200', async () => {
    const handler = load({
      ctrl: { getAllNameImageCount: jest.fn().mockResolvedValue([{ id: 1 }]) },
    });

    const res = await handler(ev('/local/cupcakeslife/festividades/festividades-imagen-cantidad', 'GET'));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 1 }]);
  });

  test('GET con email -> 200', async () => {
    const handler = load({
      ctrl: { getAllNameImageCount: jest.fn().mockResolvedValue([{ id: 2 }]) },
    });

    const res = await handler(ev('/local/cupcakeslife/festividades/festividades-imagen-cantidad/usuario', 'GET', { email: 'a@b.com' }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 2 }]);
  });

  test('error del controlador -> 500 (propaga message)', async () => {
    const handler = load({
      ctrl: { getAllNameImageCount: jest.fn().mockRejectedValue(new Error('boom')) },
    });

    const res = await handler(ev('/local/cupcakeslife/festividades/festividades-imagen-cantidad', 'GET'));
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('boom');
  });
});
