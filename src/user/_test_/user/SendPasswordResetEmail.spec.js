/*
 * =========================================================
 * MOCK DE AWS SDK
 * =========================================================
 *
 * No enviamos correos reales durante los tests.
 *
 * Simulamos:
 *
 * new AWS.SES()
 *      .sendEmail(params)
 *      .promise()
 */
const mockPromise = jest.fn();
const mockSendEmail = jest.fn();

jest.mock('aws-sdk', () => ({
  SES: jest.fn().mockImplementation(() => ({
    sendEmail: mockSendEmail,
  })),
}));

const AWS = require('aws-sdk');

const SendPasswordResetEmail = require(
  '../../services/user/SendPasswordResetEmail'
);

describe('SendPasswordResetEmail Service', () => {
  /*
   * Conservamos las variables de entorno originales para
   * restaurarlas cuando terminen estos tests.
   */
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env = {
      ...originalEnv,
      SES_FROM_EMAIL: 'no-reply@thecupcakelife.com',
    };

    /*
     * sendEmail() devuelve un objeto que contiene promise().
     * Por defecto simulamos un envío exitoso.
     */
    mockPromise.mockResolvedValue({
      MessageId: 'test-message-id',
    });

    mockSendEmail.mockReturnValue({
      promise: mockPromise,
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('envía el correo de recuperación mediante SES', async () => {
    const email = 'a@a.com';
    const resetLink = 'https://example.com/reset-link';

    await SendPasswordResetEmail.execute({
      email,
      resetLink,
    });

    /*
     * Debe crear una instancia de Amazon SES.
     */
    expect(AWS.SES).toHaveBeenCalledTimes(1);

    /*
     * El servicio debe enviar exactamente un correo.
     */
    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    /*
     * Obtenemos los parámetros enviados a SES para comprobar
     * las partes importantes sin copiar todo el HTML aquí.
     */
    const params = mockSendEmail.mock.calls[0][0];

    expect(params.Source).toBe(
      'no-reply@thecupcakelife.com'
    );

    expect(params.Destination).toEqual({
      ToAddresses: [email],
    });

    expect(params.Message.Subject).toEqual({
      Charset: 'UTF-8',
      Data: 'Recupera tu contraseña | CupcakesLife',
    });

    /*
     * Comprobamos que existe tanto la versión HTML como
     * la versión de texto plano.
     */
    expect(params.Message.Body.Html.Charset).toBe(
      'UTF-8'
    );

    expect(params.Message.Body.Text.Charset).toBe(
      'UTF-8'
    );

    /*
     * El enlace generado por Firebase debe aparecer dentro
     * de ambas versiones del correo.
     */
    expect(
      params.Message.Body.Html.Data
    ).toContain(resetLink);

    expect(
      params.Message.Body.Text.Data
    ).toContain(resetLink);

    /*
     * También verificamos contenido representativo de la
     * plantilla para detectar cambios accidentales.
     */
    expect(
      params.Message.Body.Html.Data
    ).toContain('CupcakesLife');

    expect(
      params.Message.Body.Html.Data
    ).toContain('Cambiar contraseña');

    /*
     * Finalmente debe ejecutar la Promise del SDK.
     */
    expect(mockPromise).toHaveBeenCalledTimes(1);
  });

  test('lanza error si no recibe email', async () => {
    await expect(
      SendPasswordResetEmail.execute({
        resetLink: 'https://example.com/reset-link',
      })
    ).rejects.toThrow(
      'User email is required.'
    );

    /*
     * La validación ocurre antes de crear SES.
     */
    expect(AWS.SES).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test('lanza error si no recibe resetLink', async () => {
    await expect(
      SendPasswordResetEmail.execute({
        email: 'a@a.com',
      })
    ).rejects.toThrow(
      'Password reset link is required.'
    );

    expect(AWS.SES).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test('lanza error si SES_FROM_EMAIL no está configurado', async () => {
    delete process.env.SES_FROM_EMAIL;

    await expect(
      SendPasswordResetEmail.execute({
        email: 'a@a.com',
        resetLink: 'https://example.com/reset-link',
      })
    ).rejects.toThrow(
      'SES_FROM_EMAIL environment variable is required.'
    );

    /*
     * Si falta el remitente, SES ni siquiera debe
     * inicializarse.
     */
    expect(AWS.SES).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test('lanza error genérico si SES falla al enviar el correo', async () => {
    /*
     * Simulamos un error real producido durante el envío.
     */
    mockPromise.mockRejectedValue(
      new Error('ses error')
    );

    await expect(
      SendPasswordResetEmail.execute({
        email: 'a@a.com',
        resetLink: 'https://example.com/reset-link',
      })
    ).rejects.toThrow(
      'Error sending password reset email'
    );

    expect(AWS.SES).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockPromise).toHaveBeenCalledTimes(1);
  });
});