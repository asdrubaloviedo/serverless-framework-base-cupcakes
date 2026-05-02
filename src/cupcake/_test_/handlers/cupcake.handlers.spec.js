jest.mock('@cupcake/controller/cupcake', () => ({
  getAllNameImageInfoByUserEmail: jest.fn(),
}));

const CupcakeController = require('@cupcake/controller/cupcake');
const handler = require('../../handlers/cupcake');

const buildEvent = (path, query = {}) => ({
  path,
  httpMethod: 'GET',
  queryStringParameters: query,
});

describe('cupcake handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /name-image-info/usuario', async () => {
    CupcakeController.getAllNameImageInfoByUserEmail.mockResolvedValue({
      ok: 1,
    });

    const event = buildEvent('/name-image-info/usuario', {
      email: 'test@test.com',
    });

    const res = await handler.handler(event);

    expect(CupcakeController.getAllNameImageInfoByUserEmail).toHaveBeenCalledWith({
      email: 'test@test.com',
    });

    expect(res).toBeDefined();
  });

  test('GET /name-image-info/paquetes/usuario agrega tipo paquetes', async () => {
    CupcakeController.getAllNameImageInfoByUserEmail.mockResolvedValue([
      { ok: 1 },
    ]);

    const event = buildEvent('/name-image-info/paquetes/usuario', {
      email: 'test@test.com',
    });

    const res = await handler.handler(event);

    expect(CupcakeController.getAllNameImageInfoByUserEmail).toHaveBeenCalledWith({
      email: 'test@test.com',
      tipo: 'paquetes',
    });

    expect(res).toBeDefined();
  });
});