const FirebaseAuthService = require('@user/services/user/FirebaseAuthService');

/*
 * =========================================================
 * GENERATE PASSWORD RESET LINK
 * =========================================================
 *
 * Genera el enlace oficial de Firebase para que el usuario
 * pueda cambiar su contraseña.
 *
 * Este servicio NO cambia la contraseña y tampoco envía
 * correos. Firebase sigue siendo responsable de validar el
 * enlace y realizar el cambio de contraseña de forma segura.
 */
class GeneratePasswordResetLink {

    /*
     * =========================================================
     * EXECUTE
     * =========================================================
     *
     * Recibe el correo del usuario y devuelve el enlace de
     * recuperación generado por Firebase Authentication.
     */
    static async execute({ email }) {

        if (!email) {
            throw new Error('User email is required.');
        }

        try {

            const auth = FirebaseAuthService.getAuth();

            /*
             * Firebase genera un enlace de un solo uso asociado
             * al usuario y al proyecto de Firebase.
             *
             * El enlace seguirá llevando al flujo seguro de
             * Firebase para establecer la nueva contraseña.
             */
            return await auth.generatePasswordResetLink(email);

        } catch (error) {

            /*
             * No exponemos al cliente errores internos de Firebase,
             * IDs de proyecto ni información sensible.
             *
             * También evitamos utilizar aquí mensajes diferentes
             * para "usuario encontrado" y "usuario inexistente",
             * porque posteriormente el endpoint responderá de forma
             * neutra para reducir enumeración de cuentas.
             */
            console.error(
                'Error generating Firebase password reset link:',
                error
            );

            throw new Error(
                'Error generating password reset link'
            );
        }
    }
}

module.exports = GeneratePasswordResetLink;