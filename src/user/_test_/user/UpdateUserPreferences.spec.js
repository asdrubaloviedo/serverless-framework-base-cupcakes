jest.mock('@user/repositories/index', () => {
  const mockUpdatePreferences = jest.fn();
  const mockGetPreferences = jest.fn();

  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      updatePreferences: mockUpdatePreferences,
      getPreferences: mockGetPreferences,
    })),
    __mocks__: {
      mockUpdatePreferences,
      mockGetPreferences,
    },
  };
});

const { __mocks__ } = require('@user/repositories/index');
const UpdateUserPreferences = require('../../services/user/UpdateUserPreferences');

describe('UpdateUserPreferences Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });


  test('actualiza y devuelve las preferencias guardadas', async () => {

    const preferences = [
      {
        usuario_id: 1,
        recordatorios: false,
        mensajes: true,
        promociones: false,
        musica: true,
        efectos_sonido: false,
        vibracion: false,
      }
    ];

    __mocks__.mockUpdatePreferences.mockResolvedValue();
    __mocks__.mockGetPreferences.mockResolvedValue(
      preferences
    );


    const result =
      await UpdateUserPreferences.execute({
        email: 'asdrubaloviedo@gmail.com',
        recordatorios: false,
        mensajes: true,
        promociones: false,
        musica: true,
        efectos_sonido: false,
        vibracion: false
      });


    expect(
      __mocks__.mockUpdatePreferences
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo@gmail.com',
      recordatorios: false,
      mensajes: true,
      promociones: false,
      musica: true,
      efectos_sonido: false,
      vibracion: false
    });


    expect(
      __mocks__.mockGetPreferences
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo@gmail.com'
    });


    expect(result).toEqual(preferences);
  });


  test('retorna null si luego de actualizar no existen preferencias', async () => {

    __mocks__.mockUpdatePreferences.mockResolvedValue();
    __mocks__.mockGetPreferences.mockResolvedValue([]);


    const result =
      await UpdateUserPreferences.execute({
        email: 'asdrubaloviedo@gmail.com',
        recordatorios: true,
        mensajes: false,
        promociones: true,
        musica: false,
        efectos_sonido: false,
        vibracion: true
      });


    expect(
      __mocks__.mockUpdatePreferences
    ).toHaveBeenCalledTimes(1);

    expect(
      __mocks__.mockGetPreferences
    ).toHaveBeenCalledTimes(1);

    expect(result).toBeNull();
  });


  test('retorna null si el repository devuelve null al consultar', async () => {

    __mocks__.mockUpdatePreferences.mockResolvedValue();
    __mocks__.mockGetPreferences.mockResolvedValue(null);


    const result =
      await UpdateUserPreferences.execute({
        email: 'asdrubaloviedo@gmail.com',
        recordatorios: true,
        mensajes: true,
        promociones: true,
        musica: true,
        efectos_sonido: true,
        vibracion: true
      });


    expect(result).toBeNull();
  });


  test('no consulta las preferencias si la actualización falla', async () => {

    const error = new Error('Database error');

    __mocks__.mockUpdatePreferences.mockRejectedValue(
      error
    );


    await expect(
      UpdateUserPreferences.execute({
        email: 'asdrubaloviedo@gmail.com',
        recordatorios: true,
        mensajes: false,
        promociones: true,
        musica: false,
        efectos_sonido: false,
        vibracion: true
      })
    ).rejects.toThrow('Database error');


    expect(
      __mocks__.mockGetPreferences
    ).not.toHaveBeenCalled();
  });
});