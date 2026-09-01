/*
 * =========================================================
 * USER CONTROLLER
 * =========================================================
 *
 * Controlador del módulo de usuarios.
 *
 * IMPORTANTE:
 * Los servicios se cargan dentro de cada método en lugar de
 * cargarlos todos al inicializar este archivo.
 *
 * Esto evita que endpoints que no necesitan PostgreSQL
 * (por ejemplo, recuperación de contraseña) inicialicen
 * innecesariamente los modelos y la conexión a la base de
 * datos durante el cold start de Lambda.
 */
class UserController {

    /*
     * =====================================================
     * USER MEDAL
     * =====================================================
     */

    static async createOneUserMedalLeage(params = {}) {

        const {
            CreateOneUserMedalLeage
        } = require('@user/services/userMedalLeage');

        const {
            email,
            medalla
        } = params;

        return CreateOneUserMedalLeage.execute({
            email,
            medalla
        });
    }


    /*
     * Aún no se tienen los queries definitivos para esta
     * operación.
     */
    static async patchOneUserMedalLeage(params = {}) {

        const {
            UpdateUserMedalLeage
        } = require('@user/services/userMedalLeage');

        const {
            email,
            cupcake,
            estado,
            valor
        } = params;

        return UpdateUserMedalLeage.execute({
            email,
            cupcake,
            estado,
            valor
        });
    }


    /*
     * =====================================================
     * USER PACKAGE
     * =====================================================
     */

    static async createOneUserPackage(params = {}) {

        const {
            CreateOneUserPackage
        } = require('@user/services/userPackage');

        const {
            email,
            paquete,
            moneda,
            montoCentavos,
            paisCompra,
            paymentProvider,
            paymentProviderId
        } = params;

        return CreateOneUserPackage.execute({
            email,
            paquete,
            moneda,
            montoCentavos,
            paisCompra,
            paymentProvider,
            paymentProviderId
        });
    }


    /*
     * =====================================================
     * USER
     * =====================================================
     */

    static async createOneUser(params = {}) {

        const {
            CreateOneUser
        } = require('@user/services/user');

        const {
            nombre,
            email,
            pais = 'PER'
        } = params;

        return CreateOneUser.execute({
            nombre,
            email,
            pais
        });
    }


    /*
     * =====================================================
     * PASSWORD RESET
     * =====================================================
     *
     * Este flujo NO necesita PostgreSQL.
     *
     * 1. Firebase Admin genera el enlace seguro.
     * 2. Amazon SES envía nuestro correo personalizado.
     *
     * Los servicios se cargan únicamente cuando se invoca
     * este endpoint.
     */
    static async sendPasswordResetEmail(params = {}) {

        const {
            GeneratePasswordResetLink,
            SendPasswordResetEmail
        } = require('@user/services/user');

        const {
            email
        } = params;

        /*
         * Firebase crea el enlace oficial de recuperación.
         */
        const resetLink =
            await GeneratePasswordResetLink.execute({
                email
            });

        /*
         * SES envía el correo personalizado utilizando
         * el enlace generado por Firebase.
         */
        await SendPasswordResetEmail.execute({
            email,
            resetLink
        });

        /*
         * No devolvemos el resetLink al cliente.
         */
        return {
            message: 'Password reset email sent.'
        };
    }
}

module.exports = UserController;