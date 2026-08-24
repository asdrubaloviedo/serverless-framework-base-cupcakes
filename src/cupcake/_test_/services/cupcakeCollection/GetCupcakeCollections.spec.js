jest.mock('@cupcake/repositories/index', () => ({
  CupcakeCollectionRepository: jest.fn()
}));

const {
  CupcakeCollectionRepository
} = require('@cupcake/repositories/index');

const GetCupcakeCollections =
  require('../../../services/cupcakeCollection/GetCupcakeCollections');

describe('GetCupcakeCollections', () => {

  let repositoryMock;

  beforeEach(() => {
    jest.clearAllMocks();

    repositoryMock = {
      getByUserEmail: jest.fn()
    };

    CupcakeCollectionRepository
      .mockImplementation(() => repositoryMock);
  });

  test('lanza error si no se envía email', async () => {

    await expect(
      GetCupcakeCollections.execute({
        email: '',
        cupcake: 2
      })
    ).rejects.toThrow(
      'El email es requerido'
    );
  });

  test('lanza error si no se envía cupcake', async () => {

    await expect(
      GetCupcakeCollections.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: null
      })
    ).rejects.toThrow(
      'El cupcake es requerido'
    );
  });

  test('lanza error si cupcake no es un identificador válido', async () => {

    await expect(
        GetCupcakeCollections.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: -1
        })
    ).rejects.toThrow(
        'El cupcake debe ser un identificador válido'
    );
    });

  test('convierte cupcake string a número', async () => {

    repositoryMock
      .getByUserEmail
      .mockResolvedValueOnce([]);

    await GetCupcakeCollections.execute({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: '2'
    });

    expect(
      repositoryMock.getByUserEmail
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: 2
    });
  });

  test('devuelve las collections del usuario', async () => {

    const esperado = [
      {
        collection_id: 1,
        nombre: 'Cumpleaños',
        total_recetas: 1,
        seleccionada: true,
        imagen: 'https://example.com/cupcake.jpg'
      }
    ];

    repositoryMock
      .getByUserEmail
      .mockResolvedValueOnce(
        esperado
      );

    const result =
      await GetCupcakeCollections.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 2
      });

    expect(result).toEqual(
      esperado
    );
  });

  test('devuelve array vacío si repository devuelve null', async () => {

    repositoryMock
      .getByUserEmail
      .mockResolvedValueOnce(
        null
      );

    const result =
      await GetCupcakeCollections.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 2
      });

    expect(result).toEqual([]);
  });

});