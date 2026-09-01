jest.mock('@user/services/user/FirebaseAuthService', () => ({
  getAuth: jest.fn(),
}));

const FirebaseAuthService = require(
  '@user/services/user/FirebaseAuthService'
);

const GeneratePasswordResetLink = require(
  '../../services/user/GeneratePasswordResetLink'
);

describe('GeneratePasswordResetLink Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('genera y devuelve el enlace de recuperación', async () => {
    const mockGeneratePasswordResetLink = jest
      .fn()
      .mockResolvedValue('https://example.com/reset-link');

    FirebaseAuthService.getAuth.mockReturnValue({
      generatePasswordResetLink: mockGeneratePasswordResetLink,
    });

    const res = await GeneratePasswordResetLink.execute({
      email: 'a@a.com',
    });

    expect(FirebaseAuthService.getAuth).toHaveBeenCalledTimes(1);

    expect(
      mockGeneratePasswordResetLink
    ).toHaveBeenCalledWith('a@a.com');

    expect(res).toBe(
      'https://example.com/reset-link'
    );
  });

  test('lanza error si no recibe email', async () => {
    await expect(
      GeneratePasswordResetLink.execute({})
    ).rejects.toThrow('User email is required.');

    expect(
      FirebaseAuthService.getAuth
    ).not.toHaveBeenCalled();
  });

  test('lanza error genérico si Firebase falla', async () => {
    const mockGeneratePasswordResetLink = jest
      .fn()
      .mockRejectedValue(new Error('firebase error'));

    FirebaseAuthService.getAuth.mockReturnValue({
      generatePasswordResetLink: mockGeneratePasswordResetLink,
    });

    await expect(
      GeneratePasswordResetLink.execute({
        email: 'a@a.com',
      })
    ).rejects.toThrow(
      'Error generating password reset link'
    );

    expect(
      mockGeneratePasswordResetLink
    ).toHaveBeenCalledWith('a@a.com');
  });
});