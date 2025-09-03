process.env.ENDPOINT_ROOT = 'cupcakeslife';
process.env.CATEGORY_MODULE = 'categorias';

const CategoryController = require('@category/controller/category');
jest.spyOn(CategoryController, 'getAllNameImageCount');

const { handler } = require('@category/handlers/category');

const ev = (rawPath, method = 'GET', qs = {}) => ({
  rawPath,
  requestContext: { stage: 'local', http: { method } },
  queryStringParameters: qs
});

describe('Category handler', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET sin email -> 200', async () => {
    CategoryController.getAllNameImageCount.mockResolvedValue([{ id: 1 }]);

    const res = await handler(ev('/local/cupcakeslife/categorias/categorias-imagen-cantidad', 'GET'));

    expect(CategoryController.getAllNameImageCount).toHaveBeenCalledWith({});
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 1 }]);
  });

  test('GET con email -> 200', async () => {
    CategoryController.getAllNameImageCount.mockResolvedValue([{ id: 2 }]);

    const res = await handler(ev('/local/cupcakeslife/categorias/categorias-imagen-cantidad/usuario', 'GET', { email: 'a@b.com' }));

    expect(CategoryController.getAllNameImageCount).toHaveBeenCalledWith({ email: 'a@b.com' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: 2 }]);
  });

  test('ruta inexistente -> 404', async () => {
    const res = await handler(ev('/local/cupcakeslife/categorias/otra', 'DELETE')); // método no registrado
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).message).toBe('Not Found');
  });

  test('error del controlador -> 500', async () => {
    CategoryController.getAllNameImageCount.mockRejectedValue(new Error('boom'));

    const res = await handler(ev('/local/cupcakeslife/categorias/categorias-imagen-cantidad', 'GET'));

    expect(res.statusCode).toBe(500);
    // el fail utiliza err.message
    expect(JSON.parse(res.body).message).toBe('boom');
  });
});
