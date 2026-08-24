jest.mock('@cupcake/repositories/index', () => ({
  CupcakeCollectionRepository: jest.fn()
}));

const {
  CupcakeCollectionRepository
} = require('@cupcake/repositories/index');

const SaveCupcakeCollection =
  require('../../../services/cupcakeCollection/SaveCupcakeCollection');

describe('SaveCupcakeCollection', () => {

  let repositoryMock;

  beforeEach(() => {
    jest.clearAllMocks();

    repositoryMock = {
      saveCupcake: jest.fn()
    };

    CupcakeCollectionRepository
      .mockImplementation(() => repositoryMock);
  });

  test('lanza error si no se envía email', async () => {

    await expect(
      SaveCupcakeCollection.execute({
        email: '',
        collection: 1,
        cupcake: 2
      })
    ).rejects.toThrow(
      'El email es requerido'
    );
  });

  test('lanza error si no se envía collection', async () => {

    await expect(
      SaveCupcakeCollection.execute({
        email: 'asdrubaloviedo2@gmail.com',
        collection: null,
        cupcake: 2
      })
    ).rejects.toThrow(
      'La collection es requerida'
    );
  });

  test('lanza error si no se envía cupcake', async () => {

    await expect(
      SaveCupcakeCollection.execute({
        email: 'asdrubaloviedo2@gmail.com',
        collection: 1,
        cupcake: null
      })
    ).rejects.toThrow(
      'El cupcake es requerido'
    );
  });

  test('lanza error si collection no es válida', async () => {

        await expect(
            SaveCupcakeCollection.execute({
            email: 'asdrubaloviedo2@gmail.com',
            collection: -1,
            cupcake: 2
            })
        ).rejects.toThrow(
            'La collection debe ser un identificador válido'
        );
    });

    test('lanza error si cupcake no es válido', async () => {

        await expect(
            SaveCupcakeCollection.execute({
            email: 'asdrubaloviedo2@gmail.com',
            collection: 1,
            cupcake: -1
            })
        ).rejects.toThrow(
            'El cupcake debe ser un identificador válido'
        );
    });

  test('convierte ids string a número y guarda cupcake', async () => {

    const esperado = [
      {
        coleccion_cupcake_id: 1,
        collection_id: 1,
        cupcake_id: 2
      }
    ];

    repositoryMock
      .saveCupcake
      .mockResolvedValueOnce(
        esperado
      );

    const result =
      await SaveCupcakeCollection.execute({
        email: 'asdrubaloviedo2@gmail.com',
        collection: '1',
        cupcake: '2'
      });

    expect(
      repositoryMock.saveCupcake
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      collection: 1,
      cupcake: 2
    });

    expect(result).toEqual(
      esperado
    );
  });

  test('devuelve array vacío si repository devuelve null', async () => {

    repositoryMock
      .saveCupcake
      .mockResolvedValueOnce(
        null
      );

    const result =
      await SaveCupcakeCollection.execute({
        email: 'asdrubaloviedo2@gmail.com',
        collection: 1,
        cupcake: 2
      });

    expect(result).toEqual([]);
  });

});