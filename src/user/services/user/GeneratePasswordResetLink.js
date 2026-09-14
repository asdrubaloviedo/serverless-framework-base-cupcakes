const FirebaseAuthService = require('@user/services/user/FirebaseAuthService');

/*
 * =========================================================
 * GENERATE PASSWORD RESET LINK
 * =========================================================
 *
 * Genera el enlace oficial de Firebase para que el usuario
 * pueda cambiar su contraseña.
 *
 * Antes de generar el enlace verificamos explícitamente que
 * el correo exista en Firebase Authentication.
 *
 * Esto nos permite informar al frontend cuando un correo no
 * se encuentra registrado.
 */
class GeneratePasswordResetLink {

    /*
     * =========================================================
     * EXECUTE
     * =========================================================
     */
    static async execute({ email }) {

        if (!email) {

            const error =
                new Error(
                    'User email is required.'
                );

            error.statusCode = 400;

            throw error;
        }


        const auth =
            FirebaseAuthService.getAuth();


        try {

            /*
             * =================================================
             * VERIFICAR QUE EL USUARIO EXISTA
             * =================================================
             *
             * No dependemos de generatePasswordResetLink()
             * para saber si el correo está registrado.
             *
             * Consultamos directamente Firebase Authentication.
             */
            await auth.getUserByEmail(
                email
            );


            /*
             * =================================================
             * GENERAR ENLACE
             * =================================================
             */
            return await auth.generatePasswordResetLink(
                email
            );

        } catch (error) {

            console.error(
                'Error generating Firebase password reset link:',
                error
            );


            /*
             * =================================================
             * CORREO NO REGISTRADO
             * =================================================
             *
             * getUserByEmail() devuelve auth/user-not-found
             * cuando Firebase no encuentra ningún usuario
             * asociado al correo.
             */
            if (
                error?.code === 'auth/user-not-found'
            ) {

                const userNotFoundError =
                    new Error(
                        'Este correo no se encuentra registrado'
                    );

                userNotFoundError.statusCode = 404;

                throw userNotFoundError;
            }


            /*
             * =================================================
             * OTROS ERRORES
             * =================================================
             */
            const internalError =
                new Error(
                    'Error generating password reset link'
                );

            internalError.statusCode = 500;

            throw internalError;
        }
    }
}

module.exports = GeneratePasswordResetLink;