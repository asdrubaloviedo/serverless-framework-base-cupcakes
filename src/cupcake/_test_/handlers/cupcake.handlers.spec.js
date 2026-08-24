jest.mock('@cupcake/controller/cupcake', () => ({
  getAllNameImageInfoByUserEmail: jest.fn(),

  getCupcakeCollections: jest.fn(),

  createCupcakeCollection: jest.fn(),

  saveCupcakeCollection: jest.fn(),
}));

const CupcakeController =
  require('@cupcake/controller/cupcake');

const handler =
  require('../../handlers/cupcake');

const buildEvent = (
  path,
  query = {}
) => ({
  path,
  httpMethod: 'GET',
  queryStringParameters: query,
});

const buildPostEvent = (
  path,
  body = {}
) => ({
  path,
  httpMethod: 'POST',
  body: JSON.stringify(body),
});

describe('cupcake handler', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /name-image-info/usuario', async () => {

    CupcakeController
      .getAllNameImageInfoByUserEmail
      .mockResolvedValue({
        ok: 1,
      });

    const event =
      buildEvent(
        '/name-image-info/usuario',
        {
          email: 'test@test.com',
        }
      );

    const res =
      await handler.handler(event);

    expect(
      CupcakeController
        .getAllNameImageInfoByUserEmail
    ).toHaveBeenCalledWith({
      email: 'test@test.com',
    });

    expect(res).toBeDefined();
  });

  test(
    'GET /name-image-info/paquetes/usuario agrega tipo paquetes',
    async () => {

      CupcakeController
        .getAllNameImageInfoByUserEmail
        .mockResolvedValue([
          {
            ok: 1,
          },
        ]);

      const event =
        buildEvent(
          '/name-image-info/paquetes/usuario',
          {
            email: 'test@test.com',
          }
        );

      const res =
        await handler.handler(event);

      expect(
        CupcakeController
          .getAllNameImageInfoByUserEmail
      ).toHaveBeenCalledWith({
        email: 'test@test.com',
        tipo: 'paquetes',
      });

      expect(res).toBeDefined();
    }
  );

  test(
    'GET /name-image-info/paquetes-faltantes/usuario agrega tipo paquetes-faltantes',
    async () => {

      CupcakeController
        .getAllNameImageInfoByUserEmail
        .mockResolvedValue([
          {
            ok: 1,
          },
        ]);

      const event =
        buildEvent(
          '/name-image-info/paquetes-faltantes/usuario',
          {
            email: 'test@test.com',
          }
        );

      const res =
        await handler.handler(event);

      expect(
        CupcakeController
          .getAllNameImageInfoByUserEmail
      ).toHaveBeenCalledWith({
        email: 'test@test.com',
        tipo: 'paquetes-faltantes',
      });

      expect(res).toBeDefined();
    }
  );

  test(
    'GET /name-image-info/publico/usuario agrega tipo publico',
    async () => {

      CupcakeController
        .getAllNameImageInfoByUserEmail
        .mockResolvedValueOnce([]);

      const event =
        buildEvent(
          '/name-image-info/publico/usuario',
          {
            email: 'user@mail.com',
          }
        );

      await handler.handler(event);

      expect(
        CupcakeController
          .getAllNameImageInfoByUserEmail
      ).toHaveBeenCalledWith({
        email: 'user@mail.com',
        tipo: 'publico',
      });
    }
  );

  /*
   * =========================================================
   * COLLECTIONS
   * =========================================================
   */

  test(
    'GET /collections obtiene collections del usuario para cupcake',
    async () => {

      const esperado = [
        {
          collection_id: 1,
          nombre: 'Cumpleaños',
          total_recetas: 1,
          seleccionada: true,
          imagen: 'https://example.com/cupcake.jpg',
        },
      ];

      CupcakeController
        .getCupcakeCollections
        .mockResolvedValueOnce(
          esperado
        );

      const event =
        buildEvent(
          '/collections',
          {
            email:
              'asdrubaloviedo2@gmail.com',
            cupcake: '2',
          }
        );

      const res =
        await handler.handler(event);

      expect(
        CupcakeController
          .getCupcakeCollections
      ).toHaveBeenCalledTimes(1);

      expect(
        CupcakeController
          .getCupcakeCollections
      ).toHaveBeenCalledWith({
        email:
          'asdrubaloviedo2@gmail.com',
        cupcake: '2',
      });

      expect(
        res.statusCode
      ).toBe(200);

      expect(
        JSON.parse(res.body)
      ).toEqual(
        esperado
      );
    }
  );

  test(
    'POST /collections crea una collection',
    async () => {

      const body = {
        email:
          'asdrubaloviedo2@gmail.com',
        nombre:
          'Cumpleaños',
      };

      const esperado = [
        {
          collection_id: 1,
          usuario_id: 6,
          nombre: 'Cumpleaños',
        },
      ];

      CupcakeController
        .createCupcakeCollection
        .mockResolvedValueOnce(
          esperado
        );

      const event =
        buildPostEvent(
          '/collections',
          body
        );

      const res =
        await handler.handler(event);

      expect(
        CupcakeController
          .createCupcakeCollection
      ).toHaveBeenCalledTimes(1);

      expect(
        CupcakeController
          .createCupcakeCollection
      ).toHaveBeenCalledWith(
        body
      );

      expect(
        res.statusCode
      ).toBe(200);

      expect(
        JSON.parse(res.body)
      ).toEqual(
        esperado
      );
    }
  );

  test(
    'POST /collections/cupcake guarda cupcake dentro de una collection',
    async () => {

      const body = {
        email:
          'asdrubaloviedo2@gmail.com',
        collection: 1,
        cupcake: 2,
      };

      const esperado = [
        {
          coleccion_cupcake_id: 1,
          collection_id: 1,
          cupcake_id: 2,
        },
      ];

      CupcakeController
        .saveCupcakeCollection
        .mockResolvedValueOnce(
          esperado
        );

      const event =
        buildPostEvent(
          '/collections/cupcake',
          body
        );

      const res =
        await handler.handler(event);

      expect(
        CupcakeController
          .saveCupcakeCollection
      ).toHaveBeenCalledTimes(1);

      expect(
        CupcakeController
          .saveCupcakeCollection
      ).toHaveBeenCalledWith(
        body
      );

      expect(
        res.statusCode
      ).toBe(200);

      expect(
        JSON.parse(res.body)
      ).toEqual(
        esperado
      );
    }
  );

});