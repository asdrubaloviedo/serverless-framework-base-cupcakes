/*
 * =========================================================
 * GENERATE PASSWORD RESET LINK - TESTS
 * =========================================================
 *
 * Pruebas del servicio encargado de:
 *
 * 1. Verificar que el usuario exista en Firebase.
 * 2. Generar el enlace de recuperación.
 * 3. Diferenciar correctamente un correo no registrado.
 * 4. Ocultar errores internos de Firebase mediante un
 *    error genérico.
 */

const mockGetUserByEmail =
    jest.fn();

const mockGeneratePasswordResetLink =
    jest.fn();


/*
 * =========================================================
 * MOCK FIREBASE AUTH SERVICE
 * =========================================================
 */
jest.mock(
    '@user/services/user/FirebaseAuthService',
    () => ({
        getAuth: jest.fn(
            () => ({
                getUserByEmail:
                    mockGetUserByEmail,

                generatePasswordResetLink:
                    mockGeneratePasswordResetLink
            })
        )
    })
);


const GeneratePasswordResetLink =
    require(
        '@user/services/user/GeneratePasswordResetLink'
    );


describe(
    'GeneratePasswordResetLink Service',
    () => {

        /*
         * =====================================================
         * LIMPIEZA
         * =====================================================
         */
        beforeEach(
            () => {

                jest.clearAllMocks();


                /*
                 * Por defecto consideramos que Firebase
                 * encuentra al usuario.
                 */
                mockGetUserByEmail.mockResolvedValue({
                    uid: 'firebase-user-id',
                    email: 'a@a.com'
                });
            }
        );


        /*
         * =====================================================
         * GENERA EL ENLACE CORRECTAMENTE
         * =====================================================
         */
        test(
            'genera y devuelve el enlace de recuperación',
            async () => {

                const expectedLink =
                    'https://example.com/reset-password';


                mockGeneratePasswordResetLink
                    .mockResolvedValue(
                        expectedLink
                    );


                const result =
                    await GeneratePasswordResetLink.execute({
                        email: 'a@a.com'
                    });


                /*
                 * Primero debemos comprobar que el usuario
                 * exista.
                 */
                expect(
                    mockGetUserByEmail
                ).toHaveBeenCalledWith(
                    'a@a.com'
                );


                /*
                 * Después Firebase puede generar el enlace.
                 */
                expect(
                    mockGeneratePasswordResetLink
                ).toHaveBeenCalledWith(
                    'a@a.com'
                );


                expect(
                    result
                ).toBe(
                    expectedLink
                );
            }
        );


        /*
         * =====================================================
         * EMAIL REQUERIDO
         * =====================================================
         */
        test(
            'lanza error si no se proporciona email',
            async () => {

                await expect(
                    GeneratePasswordResetLink.execute({})
                ).rejects.toMatchObject({
                    message:
                        'User email is required.',
                    statusCode: 400
                });


                /*
                 * No debemos consultar Firebase si ni siquiera
                 * recibimos un correo.
                 */
                expect(
                    mockGetUserByEmail
                ).not.toHaveBeenCalled();


                expect(
                    mockGeneratePasswordResetLink
                ).not.toHaveBeenCalled();
            }
        );


        /*
         * =====================================================
         * USUARIO NO REGISTRADO
         * =====================================================
         */
        test(
            'lanza 404 si el correo no se encuentra registrado',
            async () => {

                const firebaseError =
                    new Error(
                        'There is no user record corresponding to the provided identifier.'
                    );


                firebaseError.code =
                    'auth/user-not-found';


                mockGetUserByEmail
                    .mockRejectedValue(
                        firebaseError
                    );


                await expect(
                    GeneratePasswordResetLink.execute({
                        email: 'noexiste@correo.com'
                    })
                ).rejects.toMatchObject({
                    message:
                        'Este correo no se encuentra registrado',
                    statusCode: 404
                });


                expect(
                    mockGetUserByEmail
                ).toHaveBeenCalledWith(
                    'noexiste@correo.com'
                );


                /*
                 * Si el usuario no existe, jamás debemos
                 * intentar generar el enlace.
                 */
                expect(
                    mockGeneratePasswordResetLink
                ).not.toHaveBeenCalled();
            }
        );


        /*
         * =====================================================
         * ERROR AL VERIFICAR EL USUARIO
         * =====================================================
         */
        test(
            'lanza error genérico si Firebase falla al verificar el usuario',
            async () => {

                mockGetUserByEmail
                    .mockRejectedValue(
                        new Error(
                            'Firebase unavailable'
                        )
                    );


                await expect(
                    GeneratePasswordResetLink.execute({
                        email: 'a@a.com'
                    })
                ).rejects.toMatchObject({
                    message:
                        'Error generating password reset link',
                    statusCode: 500
                });


                expect(
                    mockGetUserByEmail
                ).toHaveBeenCalledWith(
                    'a@a.com'
                );


                /*
                 * Al fallar la verificación no debemos continuar
                 * con la generación del enlace.
                 */
                expect(
                    mockGeneratePasswordResetLink
                ).not.toHaveBeenCalled();
            }
        );


        /*
         * =====================================================
         * ERROR AL GENERAR EL ENLACE
         * =====================================================
         */
        test(
            'lanza error genérico si Firebase falla al generar el enlace',
            async () => {

                /*
                 * El usuario sí existe.
                 */
                mockGetUserByEmail
                    .mockResolvedValue({
                        uid: 'firebase-user-id',
                        email: 'a@a.com'
                    });


                /*
                 * Pero Firebase falla posteriormente al generar
                 * el enlace.
                 */
                mockGeneratePasswordResetLink
                    .mockRejectedValue(
                        new Error(
                            'Firebase error'
                        )
                    );


                await expect(
                    GeneratePasswordResetLink.execute({
                        email: 'a@a.com'
                    })
                ).rejects.toMatchObject({
                    message:
                        'Error generating password reset link',
                    statusCode: 500
                });


                expect(
                    mockGetUserByEmail
                ).toHaveBeenCalledWith(
                    'a@a.com'
                );


                expect(
                    mockGeneratePasswordResetLink
                ).toHaveBeenCalledWith(
                    'a@a.com'
                );
            }
        );
    }
);