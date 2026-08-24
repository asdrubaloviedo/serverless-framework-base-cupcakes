jest.mock('@cupcake/models/cupcake', () => ({
  CupcakeCollectionModel: {
    getByUserEmail: jest.fn(),
    create: jest.fn(),
    saveCupcake: jest.fn(),
  }
}));

const {
  CupcakeCollectionModel
} = require('@cupcake/models/cupcake');

const CupcakeCollectionRepository =
  require('../../repositories/CupcakeCollectionRepository');

describe('CupcakeCollectionRepository', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


  test('getByUserEmail -> obtiene collections del usuario para un cupcake', async () => {

    const esperado = [
      {
        collection_id: 1,
        nombre: 'Cumpleaños',
        total_recetas: 1,
        seleccionada: true,
        imagen: 'https://example.com/cupcake.jpg'
      }
    ];

    CupcakeCollectionModel
      .getByUserEmail
      .mockResolvedValueOnce(esperado);

    const repository =
      new CupcakeCollectionRepository();

    const result =
      await repository.getByUserEmail({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 2
      });

    expect(
      CupcakeCollectionModel.getByUserEmail
    ).toHaveBeenCalledTimes(1);

    const {
      query,
      params
    } =
      CupcakeCollectionModel
        .getByUserEmail
        .mock.calls[0][0];

    expect(params).toEqual([
      'asdrubaloviedo2@gmail.com',
      2
    ]);

    expect(query).toMatch(
      /FROM colecciones/
    );

    expect(query).toMatch(
      /coleccion_cupcakes/
    );

    expect(query).toMatch(
      /imagenes_cupcakes/
    );

    expect(query).toMatch(
      /ic\.main = 1/
    );

    expect(result).toEqual(
      esperado
    );
  });


  test('create -> crea una collection para el usuario', async () => {

    const esperado = [
      {
        collection_id: 1,
        usuario_id: 6,
        nombre: 'Cumpleaños'
      }
    ];

    CupcakeCollectionModel
      .create
      .mockResolvedValueOnce(
        esperado
      );

    const repository =
      new CupcakeCollectionRepository();

    const result =
      await repository.create({
        email: 'asdrubaloviedo2@gmail.com',
        nombre: 'Cumpleaños'
      });

    expect(
      CupcakeCollectionModel.create
    ).toHaveBeenCalledTimes(1);

    const {
      query,
      params
    } =
      CupcakeCollectionModel
        .create
        .mock.calls[0][0];

    expect(params).toEqual([
      'asdrubaloviedo2@gmail.com',
      'Cumpleaños'
    ]);

    expect(query).toMatch(
      /INSERT INTO colecciones/
    );

    expect(query).toMatch(
      /RETURNING/
    );

    expect(result).toEqual(
      esperado
    );
  });


  test('saveCupcake -> guarda cupcake dentro de una collection', async () => {

    const esperado = [
      {
        coleccion_cupcake_id: 1,
        collection_id: 1,
        cupcake_id: 2
      }
    ];

    CupcakeCollectionModel
      .saveCupcake
      .mockResolvedValueOnce(
        esperado
      );

    const repository =
      new CupcakeCollectionRepository();

    const result =
      await repository.saveCupcake({
        email: 'asdrubaloviedo2@gmail.com',
        collection: 1,
        cupcake: 2
      });

    expect(
      CupcakeCollectionModel.saveCupcake
    ).toHaveBeenCalledTimes(1);

    const {
      query,
      params
    } =
      CupcakeCollectionModel
        .saveCupcake
        .mock.calls[0][0];

    expect(params).toEqual([
      'asdrubaloviedo2@gmail.com',
      1,
      2
    ]);

    expect(query).toMatch(
      /INSERT INTO coleccion_cupcakes/
    );

    expect(query).toMatch(
      /ON CONFLICT/
    );

    expect(query).toMatch(
      /DO NOTHING/
    );

    expect(result).toEqual(
      esperado
    );
  });

});