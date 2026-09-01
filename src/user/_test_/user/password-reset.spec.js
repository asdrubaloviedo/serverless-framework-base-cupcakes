/*
 * =========================================================
 * MOCK DE SERVICIOS
 * =========================================================
 *
 * No queremos llamar realmente a Firebase ni a SES.
 * Solo comprobamos que el handler coordine correctamente
 * ambos servicios.
 */
jest.mock('@user/services/user', () => ({
  GeneratePasswordResetLink: {
    execute: jest.fn(),
  },
  SendPasswordResetEmail: {
    execute: jest.fn(),
  },
}));

/*
 * =========================================================
 * MOCK DEL SCHEMA
 * =========================================================
 *
 * Simulamos las respuestas de validación para poder probar
 * tanto entradas válidas como inválidas.
 */
jest.mock('@user/schema/user', () => ({
  validateSendPasswordResetEmail: jest.fn(),
}));

const {
  GeneratePasswordResetLink,
  SendPasswordResetEmail,
} = require('@user/services/user');

const {
  validateSendPasswordResetEmail,
} = require('@user/schema/user');

const {
  handler,
} = require('../../handlers/password-reset');


describe('Password Reset Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  test('genera enlace, envía correo y retorna 200', async () => {
    validateSendPasswordResetEmail.mockReturnValue({
      success: true,
      data: {
        email: 'a@a.com',
      },
    });

    GeneratePasswordResetLink.execute.mockResolvedValue(
      'https://example.com/reset-link'
    );

    SendPasswordResetEmail.execute.mockResolvedValue();

    const event = {
      body: JSON.stringify({
        email: 'a@a.com',
      }),
    };

    const res = await handler(event);

    expect(
      validateSendPasswordResetEmail
    ).toHaveBeenCalledWith({
      email: 'a@a.com',
    });

    expect(
      GeneratePasswordResetLink.execute
    ).toHaveBeenCalledWith({
      email: 'a@a.com',
    });

    expect(
      SendPasswordResetEmail.execute
    ).toHaveBeenCalledWith({
      email: 'a@a.com',
      resetLink: 'https://example.com/reset-link',
    });

    expect(res.statusCode).toBe(200);

    expect(
      JSON.parse(res.body)
    ).toEqual({
      message: 'Password reset email sent.',
    });
  });


  test('acepta body ya convertido a objeto', async () => {
    validateSendPasswordResetEmail.mockReturnValue({
      success: true,
      data: {
        email: 'a@a.com',
      },
    });

    GeneratePasswordResetLink.execute.mockResolvedValue(
      'https://example.com/reset-link'
    );

    SendPasswordResetEmail.execute.mockResolvedValue();

    const event = {
      body: {
        email: 'a@a.com',
      },
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(200);

    expect(
      validateSendPasswordResetEmail
    ).toHaveBeenCalledWith({
      email: 'a@a.com',
    });
  });


  test('retorna 400 si el JSON es inválido', async () => {
    const event = {
      body: '{"email":',
    };

    const res = await handler(event);

    expect(res.statusCode).toBe(400);

    expect(
      JSON.parse(res.body)
    ).toEqual({
      message: 'JSON inválido',
    });

    expect(
      validateSendPasswordResetEmail
    ).not.toHaveBeenCalled();

    expect(
      GeneratePasswordResetLink.execute
    ).not.toHaveBeenCalled();

    expect(
      SendPasswordResetEmail.execute
    ).not.toHaveBeenCalled();
  });


  test('retorna error de email requerido cuando falta email', async () => {
    validateSendPasswordResetEmail.mockReturnValue({
      success: false,
      error: {
        issues: [
          {
            code: 'invalid_type',
            received: 'undefined',
            path: ['email'],
          },
        ],
      },
    });

    const res = await handler({
      body: JSON.stringify({}),
    });

    expect(res.statusCode).toBe(400);

    expect(
      JSON.parse(res.body)
    ).toEqual({
      message: 'User email is required.',
    });

    expect(
      GeneratePasswordResetLink.execute
    ).not.toHaveBeenCalled();

    expect(
      SendPasswordResetEmail.execute
    ).not.toHaveBeenCalled();
  });


  test('retorna mensaje del schema cuando la validación falla', async () => {
    validateSendPasswordResetEmail.mockReturnValue({
      success: false,
      error: {
        issues: [
          {
            code: 'invalid_string',
            path: ['email'],
            message: 'Invalid email',
          },
        ],
      },
    });

    const res = await handler({
      body: JSON.stringify({
        email: 'correo-invalido',
      }),
    });

    expect(res.statusCode).toBe(400);

    expect(
      JSON.parse(res.body)
    ).toEqual({
      message: 'Invalid email',
    });

    expect(
      GeneratePasswordResetLink.execute
    ).not.toHaveBeenCalled();
  });


  test('retorna 500 si falla la generación del enlace', async () => {
    validateSendPasswordResetEmail.mockReturnValue({
      success: true,
      data: {
        email: 'a@a.com',
      },
    });

    GeneratePasswordResetLink.execute.mockRejectedValue(
      new Error('firebase error')
    );

    const res = await handler({
      body: JSON.stringify({
        email: 'a@a.com',
      }),
    });

    expect(res.statusCode).toBe(500);

    expect(
      JSON.parse(res.body)
    ).toEqual({
      message: 'firebase error',
    });

    expect(
      SendPasswordResetEmail.execute
    ).not.toHaveBeenCalled();
  });


  test('retorna 500 si falla el envío del correo', async () => {
    validateSendPasswordResetEmail.mockReturnValue({
      success: true,
      data: {
        email: 'a@a.com',
      },
    });

    GeneratePasswordResetLink.execute.mockResolvedValue(
      'https://example.com/reset-link'
    );

    SendPasswordResetEmail.execute.mockRejectedValue(
      new Error('ses error')
    );

    const res = await handler({
      body: JSON.stringify({
        email: 'a@a.com',
      }),
    });

    expect(res.statusCode).toBe(500);

    expect(
      JSON.parse(res.body)
    ).toEqual({
      message: 'ses error',
    });
  });


  test('retorna mensaje genérico si el error no tiene message', async () => {
    validateSendPasswordResetEmail.mockReturnValue({
      success: true,
      data: {
        email: 'a@a.com',
      },
    });

    GeneratePasswordResetLink.execute.mockRejectedValue({});

    const res = await handler({
      body: JSON.stringify({
        email: 'a@a.com',
      }),
    });

    expect(res.statusCode).toBe(500);

    expect(
      JSON.parse(res.body)
    ).toEqual({
      message: 'Internal server error',
    });
  });
});