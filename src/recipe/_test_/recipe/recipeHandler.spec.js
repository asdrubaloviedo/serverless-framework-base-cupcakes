const ev = (path = '/recipes/receta', method = 'GET', qs) => ({
  rawPath: path,
  httpMethod: method,
  requestContext: {},
  queryStringParameters: qs,
});

describe('Recipe handler', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('GET con id -> 200', async () => {
    const mock = { getById: jest.fn().mockResolvedValue([{ id: 1 }]) };
    jest.isolateModules(() => {
      jest.doMock('@recipe/controller/recipe', () => mock);
    });
    const { handler } = require('../../handlers/recipe');

    const res = await handler(ev('/recipes/receta', 'GET', { id: '7' }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 1 }]);
    expect(mock.getById).toHaveBeenCalledWith({ id: '7' });
  });

  test('GET sin id -> 200 (controller decide qué devolver)', async () => {
    const mock = { getById: jest.fn().mockResolvedValue([{ id: 2 }]) };
    jest.isolateModules(() => {
      jest.doMock('@recipe/controller/recipe', () => mock);
    });
    const { handler } = require('../../handlers/recipe');

    const res = await handler(ev('/recipes/receta', 'GET'));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 2 }]);
    expect(mock.getById).toHaveBeenCalledWith({});
  });

  test('error del controlador -> 500 (propaga message)', async () => {
    const mock = { getById: jest.fn().mockRejectedValue(new Error('boom')) };
    jest.isolateModules(() => {
      jest.doMock('@recipe/controller/recipe', () => mock);
    });
    const { handler } = require('../../handlers/recipe');

    const res = await handler(ev('/recipes/receta', 'GET'));
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe('boom');
  });
});
