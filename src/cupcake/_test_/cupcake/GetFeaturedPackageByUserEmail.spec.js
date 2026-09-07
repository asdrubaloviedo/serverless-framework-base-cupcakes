jest.mock('@cupcake/repositories/index', () => {

  const repo = {
    getFeaturedPackageByUserEmail: jest.fn()
  };

  return {
    CupcakeRepository: jest.fn(() => repo)
  };
});

const {
  CupcakeRepository
} = require('@cupcake/repositories/index');

const GetFeaturedPackageByUserEmail =
  require('../../services/cupcake/GetFeaturedPackageByUserEmail');

describe('GetFeaturedPackageByUserEmail', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('devuelve [] cuando no se recibe email', async () => {

    const result =
      await GetFeaturedPackageByUserEmail.execute({});

    expect(result).toEqual([]);

    expect(
      CupcakeRepository
    ).not.toHaveBeenCalled();
  });


  test('convierte el email a minúsculas antes de consultar el repository', async () => {

    const repo =
      new CupcakeRepository();

    repo.getFeaturedPackageByUserEmail
      .mockResolvedValue([]);

    await GetFeaturedPackageByUserEmail.execute({
      email: 'USUARIO@GMAIL.COM'
    });

    expect(
      repo.getFeaturedPackageByUserEmail
    ).toHaveBeenCalledWith({
      lowerCaseEmail: 'usuario@gmail.com'
    });
  });


  test('devuelve [] cuando el repository no encuentra paquete destacado', async () => {

    const repo =
      new CupcakeRepository();

    repo.getFeaturedPackageByUserEmail
      .mockResolvedValue([]);

    const result =
      await GetFeaturedPackageByUserEmail.execute({
        email: 'usuario@gmail.com'
      });

    expect(result).toEqual([]);
  });


  test('devuelve [] cuando el repository devuelve null', async () => {

    const repo =
      new CupcakeRepository();

    repo.getFeaturedPackageByUserEmail
      .mockResolvedValue(null);

    const result =
      await GetFeaturedPackageByUserEmail.execute({
        email: 'usuario@gmail.com'
      });

    expect(result).toEqual([]);
  });


  test('construye correctamente el paquete destacado con precio y cupcakes', async () => {

    const repo =
      new CupcakeRepository();

    repo.getFeaturedPackageByUserEmail
      .mockResolvedValue([
        {
          paquete_id: 2,
          paquete: 'San Valentín basico',
          paquete_destacado: true,
          fecha_creacion: '2026-09-04T20:57:19.985Z',

          moneda: 'PEN',
          monto_centavos: 3499,

          total_cupcakes: '10',

          cupcake_id: 65,
          nombre: 'Cupcake Napolitano',
          codigo: 'https://storage.googleapis.com/cupcakeslife/test1.png',
          hecho: false,
          tiempo: 15,
          porciones: 9
        },
        {
          paquete_id: 2,
          paquete: 'San Valentín basico',
          paquete_destacado: true,
          fecha_creacion: '2026-09-04T20:57:19.985Z',

          moneda: 'PEN',
          monto_centavos: 3499,

          total_cupcakes: '10',

          cupcake_id: 66,
          nombre: 'Cupcakes Rosa Bouquet',
          codigo: 'https://storage.googleapis.com/cupcakeslife/test2.jpg',
          hecho: false,
          tiempo: 20,
          porciones: 9
        }
      ]);

    const result =
      await GetFeaturedPackageByUserEmail.execute({
        email: 'USUARIO@GMAIL.COM'
      });

    expect(
      repo.getFeaturedPackageByUserEmail
    ).toHaveBeenCalledWith({
      lowerCaseEmail: 'usuario@gmail.com'
    });

    expect(result).toEqual({
      paquete_id: 2,
      paquete: 'San Valentín basico',
      paquete_destacado: true,
      fecha_creacion: '2026-09-04T20:57:19.985Z',

      precio: {
        moneda: 'PEN',
        monto_centavos: 3499,
        monto: 34.99
      },

      total_cupcakes: 10,

      cupcakes: [
        {
          cupcake_id: 65,
          nombre: 'Cupcake Napolitano',
          codigo: 'https://storage.googleapis.com/cupcakeslife/test1.png',
          hecho: false,
          tiempo: 15,
          porciones: 9
        },
        {
          cupcake_id: 66,
          nombre: 'Cupcakes Rosa Bouquet',
          codigo: 'https://storage.googleapis.com/cupcakeslife/test2.jpg',
          hecho: false,
          tiempo: 20,
          porciones: 9
        }
      ]
    });
  });


  test('maneja correctamente un paquete sin precio', async () => {

    const repo =
      new CupcakeRepository();

    repo.getFeaturedPackageByUserEmail
      .mockResolvedValue([
        {
          paquete_id: 2,
          paquete: 'San Valentín basico',
          paquete_destacado: true,
          fecha_creacion: '2026-09-04T20:57:19.985Z',

          moneda: null,
          monto_centavos: null,

          total_cupcakes: 1,

          cupcake_id: 65,
          nombre: 'Cupcake Napolitano',
          codigo: 'https://storage.googleapis.com/cupcakeslife/test.png',
          hecho: false,
          tiempo: 15,
          porciones: 9
        }
      ]);

    const result =
      await GetFeaturedPackageByUserEmail.execute({
        email: 'usuario@gmail.com'
      });

    expect(result.precio).toEqual({
      moneda: null,
      monto_centavos: null,
      monto: null
    });
  });


  test('maneja monto_centavos undefined como precio nulo', async () => {

    const repo =
      new CupcakeRepository();

    repo.getFeaturedPackageByUserEmail
      .mockResolvedValue([
        {
          paquete_id: 2,
          paquete: 'San Valentín basico',
          paquete_destacado: true,
          fecha_creacion: '2026-09-04T20:57:19.985Z',

          moneda: undefined,
          monto_centavos: undefined,

          total_cupcakes: 1,

          cupcake_id: 65,
          nombre: 'Cupcake Napolitano',
          codigo: 'https://storage.googleapis.com/cupcakeslife/test.png',
          hecho: false,
          tiempo: 15,
          porciones: 9
        }
      ]);

    const result =
      await GetFeaturedPackageByUserEmail.execute({
        email: 'usuario@gmail.com'
      });

    expect(result.precio).toEqual({
      moneda: null,
      monto_centavos: null,
      monto: null
    });
  });
});