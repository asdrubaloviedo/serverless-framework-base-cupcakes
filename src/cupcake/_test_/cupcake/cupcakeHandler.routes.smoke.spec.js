jest.mock('@cupcake/controller/cupcake', () => ({
  getAllNameImage: jest.fn().mockResolvedValue([{ ok: 'ni' }]),
  getAllNameImageMovies: jest.fn().mockResolvedValue([{ ok: 'mov' }]),
  getAllRamdom: jest.fn().mockResolvedValue([{ ok: 'rnd' }]),
  getAllNameImageFiltros: jest.fn().mockResolvedValue([{ ok: 'flt' }]),
}));
const Ctrl = require('@cupcake/controller/cupcake');
const { handler } = require('../../handlers/cupcake');

describe('Cupcake handler rutas varias (smoke)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENDPOINT_ROOT = '';
    process.env.CUPCAKE_MODULE = 'cupcakes';
  });

  test('GET /name-image -> 200', async () => {
    const r = await handler({ httpMethod: 'GET', rawPath: '/cupcakes/name-image' });
    expect(r.statusCode).toBe(200);
    expect(Ctrl.getAllNameImage).toHaveBeenCalled();
  });

  test('GET /name-image-peliculas -> 200', async () => {
    const r = await handler({ httpMethod: 'GET', rawPath: '/cupcakes/name-image-peliculas' });
    expect(r.statusCode).toBe(200);
    expect(Ctrl.getAllNameImageMovies).toHaveBeenCalled();
  });

  test('GET /ramdom -> 200', async () => {
    const r = await handler({ httpMethod: 'GET', rawPath: '/cupcakes/ramdom' });
    expect(r.statusCode).toBe(200);
    expect(Ctrl.getAllRamdom).toHaveBeenCalled();
  });

  test('GET /name-image-filtros -> 200', async () => {
    const r = await handler({ httpMethod: 'GET', rawPath: '/cupcakes/name-image-filtros' });
    expect(r.statusCode).toBe(200);
    expect(Ctrl.getAllNameImageFiltros).toHaveBeenCalled();
  });
});
