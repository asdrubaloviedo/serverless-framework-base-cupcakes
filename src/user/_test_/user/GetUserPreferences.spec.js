jest.mock('@user/repositories/index', () => {
  const mockGetPreferences = jest.fn();

  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      getPreferences: mockGetPreferences,
    })),
    __mocks__: {
      mockGetPreferences,
    },
  };
});

const { __mocks__ } = require('@user/repositories/index');
const GetUserPreferences = require('../../services/user/GetUserPreferences');

describe('GetUserPreferences Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


  test('obtiene y devuelve las preferencias del usuario', async () => {

    const preferences = [
      {
        usuario_id: 1,
        recordatorios: true,
        mensajes: false,
        promociones: true,
        musica: false,
        efectos_sonido: false,
        vibracion: true,
      }
    ];

    __mocks__.mockGetPreferences.mockResolvedValue(
      preferences
    );


    const result =
      await GetUserPreferences.execute({
        email: 'asdrubaloviedo@gmail.com'
      });


    expect(
      __mocks__.mockGetPreferences
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo@gmail.com'
    });


    expect(result).toEqual(preferences);
  });


  test('retorna null si el usuario no tiene preferencias', async () => {

    __mocks__.mockGetPreferences.mockResolvedValue([]);


    const result =
      await GetUserPreferences.execute({
        email: 'asdrubaloviedo@gmail.com'
      });


    expect(
      __mocks__.mockGetPreferences
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo@gmail.com'
    });


    expect(result).toBeNull();
  });


  test('retorna null si el repository devuelve null', async () => {

    __mocks__.mockGetPreferences.mockResolvedValue(null);


    const result =
      await GetUserPreferences.execute({
        email: 'asdrubaloviedo@gmail.com'
      });


    expect(result).toBeNull();
  });
});