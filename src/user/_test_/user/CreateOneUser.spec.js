jest.mock('@user/repositories/index', () => {
  const mockCreate = jest.fn();
  const mockGetCreated = jest.fn();

  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      create: mockCreate,
      getCreated: mockGetCreated,
    })),
    __mocks__: {
      mockCreate,
      mockGetCreated,
    },
  };
});

const { UserRepository, __mocks__ } = require('@user/repositories/index');
const CreateOneUser = require('../../services/user/CreateOneUser');

describe('CreateOneUser Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('crea y devuelve usuario', async () => {
    __mocks__.mockGetCreated.mockResolvedValue([{ id: 1 }]);

    const res = await CreateOneUser.execute({ email: 'a@a.com' });

    expect(__mocks__.mockCreate).toHaveBeenCalledWith({
      nombre: undefined,
      email: 'a@a.com',
      pais: 'PER',
    });

    expect(__mocks__.mockGetCreated).toHaveBeenCalledWith({
      email: 'a@a.com',
    });

    expect(res).toEqual([{ id: 1 }]);
  });

  test('retorna null si no encuentra usuario creado', async () => {
    __mocks__.mockGetCreated.mockResolvedValue([]);

    const res = await CreateOneUser.execute({
      nombre: 'Juan Perez',
      email: 'a@a.com',
      pais: 'PER',
    });

    expect(__mocks__.mockCreate).toHaveBeenCalledWith({
      nombre: 'Juan Perez',
      email: 'a@a.com',
      pais: 'PER',
    });

    expect(res).toBeNull();
  });

  test('lanza error si falla create', async () => {
    __mocks__.mockCreate.mockRejectedValue(new Error('db error'));

    await expect(
      CreateOneUser.execute({
        nombre: 'Juan Perez',
        email: 'a@a.com',
        pais: 'PER',
      })
    ).rejects.toThrow('Error creating the user');
  });
});