jest.mock('@user/repositories/index', () => {
  const mockUpdate = jest.fn();
  const mockGetCreated = jest.fn();

  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      update: mockUpdate,
      getCreated: mockGetCreated,
    })),
    __mocks__: {
      mockUpdate,
      mockGetCreated,
    },
  };
});

const {
  __mocks__
} = require('@user/repositories/index');

const UpdateOneUser =
  require('../../services/user/UpdateOneUser');


describe('UpdateOneUser Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


  test('actualiza y devuelve el usuario con su avatar', async () => {

    __mocks__.mockGetCreated.mockResolvedValue([
      {
        usuario_id: 1,
        email: 'asdrubaloviedo@gmail.com',
        avatar_id: 5,
        avatar_nombre: 'avatar_gato',
        avatar_url:
          'https://storage.googleapis.com/cupcakeslife/avatars/avatar_gato.png'
      }
    ]);

    const result = await UpdateOneUser.execute({
      nombre: 'asdrubal david',
      email: 'asdrubaloviedo@gmail.com',
      avatarId: 5
    });

    expect(__mocks__.mockUpdate).toHaveBeenCalledWith({
      nombre: 'asdrubal david',
      email: 'asdrubaloviedo@gmail.com',
      avatarId: 5
    });

    expect(__mocks__.mockGetCreated).toHaveBeenCalledWith({
      email: 'asdrubaloviedo@gmail.com'
    });

    expect(result).toEqual([
      {
        usuario_id: 1,
        email: 'asdrubaloviedo@gmail.com',
        avatar_id: 5,
        avatar_nombre: 'avatar_gato',
        avatar_url:
          'https://storage.googleapis.com/cupcakeslife/avatars/avatar_gato.png'
      }
    ]);
  });


  test('retorna null si el usuario no existe', async () => {

    __mocks__.mockGetCreated.mockResolvedValue([]);

    const result = await UpdateOneUser.execute({
      nombre: 'asdrubal david',
      email: 'asdrubaloviedo@gmail.com',
      avatarId: 5
    });

    expect(__mocks__.mockUpdate).toHaveBeenCalledWith({
      nombre: 'asdrubal david',
      email: 'asdrubaloviedo@gmail.com',
      avatarId: 5
    });

    expect(result).toBeNull();
  });


  test('lanza error controlado si falla la actualización', async () => {

    __mocks__.mockUpdate.mockRejectedValue(
      new Error('db error')
    );

    await expect(
      UpdateOneUser.execute({
        nombre: 'asdrubal david',
        email: 'asdrubaloviedo@gmail.com',
        avatarId: 5
      })
    ).rejects.toThrow(
      'Error updating the user'
    );

    expect(__mocks__.mockGetCreated)
      .not
      .toHaveBeenCalled();
  });
});