jest.mock('@cupcake/controller/cupcake', () => ({
  doTest: jest.fn().mockResolvedValue('ok'),

  getAll: jest.fn().mockResolvedValue([{ ok: 'all' }]),

  getAllNameImage: jest.fn().mockResolvedValue([{ ok: 'ni' }]),

  getAllNameImageMovies: jest.fn().mockResolvedValue([{ ok: 'mov' }]),

  getAllNameImageInfoByUserEmail:
    jest.fn().mockResolvedValue([{ ok: 'info' }]),

  getById: jest.fn().mockResolvedValue([{ ok: 'id' }]),

  getByIdInfoImage:
    jest.fn().mockResolvedValue([{ ok: 'img' }]),

  getByIdCupcakeUserState:
    jest.fn().mockResolvedValue([{ ok: 'state' }]),

  createOneCupcakeUserState:
    jest.fn().mockResolvedValue([{ ok: 'create-state' }]),

  patchOneCupcakeUserState:
    jest.fn().mockResolvedValue([{ ok: 'patch-state' }]),

  getCupcakeRating:
    jest.fn().mockResolvedValue([{ ok: 'rating' }]),

  saveCupcakeRating:
    jest.fn().mockResolvedValue([{ ok: 'save-rating' }]),

  getAllRamdom:
    jest.fn().mockResolvedValue([{ ok: 'rnd' }]),

  getAllNameImageFiltros:
    jest.fn().mockResolvedValue([{ ok: 'flt' }]),
}));

jest.mock('@cupcake/schema/cupcake', () => ({

  validateCupcakeUserState:
    jest.fn((data) => ({
      success: true,
      data,
    })),

  validatePartialCupcakeUserState:
    jest.fn((data) => ({
      success: true,
      data,
    })),

  validateCupcakeRating:
    jest.fn((data) => ({
      success: true,
      data,
    })),
}));

const Ctrl =
  require('@cupcake/controller/cupcake');

const {
  handler
} = require('../../handlers/cupcake');

describe('Cupcake handler rutas varias (smoke)', () => {

  beforeEach(() => {

    jest.clearAllMocks();

    process.env.ENDPOINT_ROOT = '';

    process.env.CUPCAKE_MODULE =
      'cupcakes';
  });


  test('GET /test -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath: '/cupcakes/test',
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.doTest
    ).toHaveBeenCalled();
  });


  test('GET /usuario -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath: '/cupcakes/usuario',
        queryStringParameters: {
          email: 'test@test.com',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAll
    ).toHaveBeenCalledWith({
      email: 'test@test.com',
    });
  });


  test('GET /busqueda -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath: '/cupcakes/busqueda',
        queryStringParameters: {
          tiempo: '30',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAll
    ).toHaveBeenCalledWith({
      tiempo: '30',
    });
  });


  test('GET /name-image -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath: '/cupcakes/name-image',
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAllNameImage
    ).toHaveBeenCalled();
  });


  test('GET /name-image-categoria -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/name-image-categoria',
        queryStringParameters: {
          categoria: '2',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAllNameImage
    ).toHaveBeenCalledWith({
      categoria: '2',
    });
  });


  test('GET /name-image-categoria/usuario -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/name-image-categoria/usuario',
        queryStringParameters: {
          email: 'test@test.com',
          categoria: '2',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAllNameImage
    ).toHaveBeenCalledWith({
      email: 'test@test.com',
      categoria: '2',
    });
  });


  test('GET /name-image-estado -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/name-image-estado',
        queryStringParameters: {
          email: 'test@test.com',
          estado: '2',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAllNameImage
    ).toHaveBeenCalledWith({
      email: 'test@test.com',
      estado: '2',
    });
  });


  test('GET /name-image/usuario -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/name-image/usuario',
        queryStringParameters: {
          email: 'test@test.com',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAllNameImage
    ).toHaveBeenCalledWith({
      email: 'test@test.com',
    });
  });


  test('GET /name-image-festividad -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/name-image-festividad',
        queryStringParameters: {
          festividad: '4',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAllNameImage
    ).toHaveBeenCalledWith({
      festividad: '4',
    });
  });


  test('GET /name-image-festividad/usuario -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/name-image-festividad/usuario',
        queryStringParameters: {
          email: 'test@test.com',
          festividad: '4',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAllNameImage
    ).toHaveBeenCalledWith({
      email: 'test@test.com',
      festividad: '4',
    });
  });


  test('GET /name-image-peliculas -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/name-image-peliculas',
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAllNameImageMovies
    ).toHaveBeenCalled();
  });


  test('GET /name-image-peliculas/usuario -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/name-image-peliculas/usuario',
        queryStringParameters: {
          email: 'test@test.com',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAllNameImageMovies
    ).toHaveBeenCalledWith({
      email: 'test@test.com',
    });
  });


  test('GET /cupcake -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath: '/cupcakes/cupcake',
        queryStringParameters: {
          id: '1',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getById
    ).toHaveBeenCalledWith({
      id: '1',
    });
  });


  test('GET /busqueda/usuario -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/busqueda/usuario',
        queryStringParameters: {
          email: 'test@test.com',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getById
    ).toHaveBeenCalledWith({
      email: 'test@test.com',
    });
  });


  test('GET /ramdom/usuario -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/ramdom/usuario',
        queryStringParameters: {
          email: 'test@test.com',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getById
    ).toHaveBeenCalledWith({
      email: 'test@test.com',
    });
  });


  test('GET /all-image -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/all-image',
        queryStringParameters: {
          id: '1',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getByIdInfoImage
    ).toHaveBeenCalledWith({
      id: '1',
    });
  });


  test('GET /estados -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/estados',
        queryStringParameters: {
          email: 'test@test.com',
          id: '1',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getByIdCupcakeUserState
    ).toHaveBeenCalledWith({
      email: 'test@test.com',
      id: '1',
    });
  });


  test('GET /logros -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/logros',
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getByIdCupcakeUserState
    ).toHaveBeenCalled();
  });


  /*
   * =========================================================
   * CALIFICACIONES
   * =========================================================
   */

  test('GET /calificacion -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/calificacion',
        queryStringParameters: {
          email:
            'asdrubaloviedo2@gmail.com',
          id: '1',
        },
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getCupcakeRating
    ).toHaveBeenCalledWith({
      email:
        'asdrubaloviedo2@gmail.com',
      id: '1',
    });
  });


  test('POST /calificacion -> 200', async () => {

    const body = {
      email:
        'asdrubaloviedo2@gmail.com',
      cupcake: 1,
      calificacion: 5,
      comentario: 'Muy bueno',
    };

    const r =
      await handler({
        httpMethod: 'POST',
        rawPath:
          '/cupcakes/calificacion',
        body:
          JSON.stringify(body),
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.saveCupcakeRating
    ).toHaveBeenCalledWith(
      body
    );
  });


  test('GET /ramdom -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/ramdom',
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAllRamdom
    ).toHaveBeenCalled();
  });


  test('GET /name-image-filtros -> 200', async () => {

    const r =
      await handler({
        httpMethod: 'GET',
        rawPath:
          '/cupcakes/name-image-filtros',
      });

    expect(r.statusCode).toBe(200);

    expect(
      Ctrl.getAllNameImageFiltros
    ).toHaveBeenCalled();
  });

});