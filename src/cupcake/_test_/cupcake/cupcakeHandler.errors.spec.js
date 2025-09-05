// Mocks
jest.mock('@cupcake/controller/cupcake', () => ({
  doTest: jest.fn(),
  getAll: jest.fn(),
  getAllNameImage: jest.fn(),
  getAllNameImageMovies: jest.fn(),
  getById: jest.fn(),
  getByIdInfoImage: jest.fn(),
  getByIdCupcakeUserState: jest.fn(),
  createOneCupcakeUserState: jest.fn(),
  patchOneCupcakeUserState: jest.fn(),
  getAllRamdom: jest.fn(),
  getAllNameImageFiltros: jest.fn(),
}));

jest.mock('@cupcake/schema/cupcake', () => ({
  validateCupcakeUserState: jest.fn(),
  validatePartialCupcakeUserState: jest.fn(),
}));

const schema = require('@cupcake/schema/cupcake');
const { handler } = require('../../handlers/cupcake');

// Helpers
const mkEvent = ({ method, path, body }) => ({
  httpMethod: method,
  path,
  body,
  requestContext: {},
});

describe('cupcake.handler errores y validaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ENDPOINT_ROOT;
    delete process.env.CUPCAKE_MODULE;
  });

  test('JSON inválido -> 400', async () => {
    const res = await handler(
      mkEvent({ method: 'POST', path: '/insertar-cupcake-estados', body: '{bad' })
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('JSON inválido');
  });

  test('validBody: invalid_type undefined en email -> 400 "User email is required."', async () => {
    schema.validateCupcakeUserState.mockReturnValueOnce({
      success: false,
      error: { issues: [{ code: 'invalid_type', received: 'undefined', path: ['email'] }] },
    });

    const res = await handler(
      mkEvent({ method: 'POST', path: '/insertar-cupcake-estados', body: '{}' })
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('User email is required.');
  });

  test('validBody: mensaje genérico del schema -> 400 con ese mensaje', async () => {
    schema.validatePartialCupcakeUserState.mockReturnValueOnce({
      success: false,
      error: { issues: [{ message: 'Field is required.', path: ['valor'] }] },
    });

    const res = await handler(
      mkEvent({ method: 'PATCH', path: '/actualizar-cupcake-estados', body: '{}' })
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe('Field is required.');
  });
});
