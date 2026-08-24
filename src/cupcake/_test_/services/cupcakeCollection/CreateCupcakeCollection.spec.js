jest.mock('@cupcake/repositories/index', () => ({
  CupcakeCollectionRepository: jest.fn()
}));

const {
  CupcakeCollectionRepository
} = require('@cupcake/repositories/index');

const CreateCupcakeCollection =
  require('../../../services/cupcakeCollection/CreateCupcakeCollection');

describe('CreateCupcakeCollection', () => {

  let repositoryMock;

  beforeEach(() => {
    jest.clearAllMocks();

    repositoryMock = {
      create: jest.fn()
    };

    CupcakeCollectionRepository
      .mockImplementation(() => repositoryMock);
  });

  test('lanza error si no se envía email', async () => {

    await expect(
      CreateCupcakeCollection.execute({
        email: '',
        nombre: 'Cumpleaños'
      })
    ).rejects.toThrow(
      'El email es requerido'
    );
  });

  test('lanza error si nombre está vacío', async () => {

    await expect(
      CreateCupcakeCollection.execute({
        email: 'asdrubaloviedo2@gmail.com',
        nombre: ''
      })
    ).rejects.toThrow(
      'El nombre de la collection es requerido'
    );
  });

  test('lanza error si nombre solo contiene espacios', async () => {

    await expect(
      CreateCupcakeCollection.execute({
        email: 'asdrubaloviedo2@gmail.com',
        nombre: '   '
      })
    ).rejects.toThrow(
      'El nombre de la collection es requerido'
    );
  });

  test('lanza error si nombre supera 100 caracteres', async () => {

    const nombre =
      'A'.repeat(101);

    await expect(
      CreateCupcakeCollection.execute({
        email: 'asdrubaloviedo2@gmail.com',
        nombre
      })
    ).rejects.toThrow(
      'El nombre de la collection no puede superar los 100 caracteres'
    );
  });

  test('crea collection recortando espacios', async () => {

    const esperado = [
      {
        collection_id: 1,
        usuario_id: 6,
        nombre: 'Cumpleaños'
      }
    ];

    repositoryMock
      .create
      .mockResolvedValueOnce(
        esperado
      );

    const result =
      await CreateCupcakeCollection.execute({
        email: 'asdrubaloviedo2@gmail.com',
        nombre: '  Cumpleaños  '
      });

    expect(
      repositoryMock.create
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      nombre: 'Cumpleaños'
    });

    expect(result).toEqual(
      esperado
    );
  });

  test('devuelve array vacío si repository devuelve null', async () => {

    repositoryMock
      .create
      .mockResolvedValueOnce(
        null
      );

    const result =
      await CreateCupcakeCollection.execute({
        email: 'asdrubaloviedo2@gmail.com',
        nombre: 'Cumpleaños'
      });

    expect(result).toEqual([]);
  });

});