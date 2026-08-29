const {
  CreateOneUserMedalLeage,
  UpdateUserMedalLeage
} = require('@user/services/userMedalLeage');

const {
  CreateOneUserPackage
} = require('@user/services/userPackage');

const {
  CreateOneUser,
  GeneratePasswordResetLink,
  SendPasswordResetEmail
} = require('@user/services/user');


class UserController {

  /*
   * =========================================================
   * CREATE USER MEDAL LEAGE
   * =========================================================
   */
  static async createOneUserMedalLeage(params = {}) {
    const { email, medalla } = params;

    return CreateOneUserMedalLeage.execute({
      email,
      medalla
    });
  };


  /*
   * =========================================================
   * PATCH USER MEDAL LEAGE
   * =========================================================
   */

  // Aun no se tienen los querys
  static async patchOneUserMedalLeage(params = {}) {

    const {
      email,
      cupcake,
      estado,
      valor
    } = params; // Input de ejemplo, aun no se sabe

    return UpdateUserMedalLeage.execute({
      email,
      cupcake,
      estado,
      valor
    });
  };


  /*
   * =========================================================
   * CREATE USER PACKAGE
   * =========================================================
   */
  static async createOneUserPackage(params = {}) {

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
  };


  /*
   * =========================================================
   * CREATE USER
   * =========================================================
   */
  static async createOneUser(params = {}) {

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
  };


  /*
   * =========================================================
   * SEND PASSWORD RESET EMAIL
   * =========================================================
   *
   * Coordina el flujo de recuperación de contraseña.
   *
   * 1. Firebase genera el enlace seguro de recuperación.
   * 2. El enlace se entrega al servicio encargado de construir
   *    y enviar nuestro correo personalizado.
   *
   * El controlador no conoce los detalles internos de Firebase
   * ni de Amazon SES. Únicamente coordina ambos servicios.
   */
  static async sendPasswordResetEmail(params = {}) {

    const {
      email
    } = params;


    /*
     * Generamos primero el enlace oficial de recuperación
     * utilizando Firebase Authentication.
     */
    const resetLink = await GeneratePasswordResetLink.execute({
      email
    });


    /*
     * Una vez generado el enlace, enviamos nuestro correo
     * personalizado al usuario.
     */
    await SendPasswordResetEmail.execute({
      email,
      resetLink
    });


    /*
     * No devolvemos el resetLink al cliente.
     *
     * El enlace de recuperación solo debe llegar al usuario
     * mediante el correo electrónico.
     */
    return {
      message: 'Password reset email sent.'
    };
  };
}


module.exports = UserController;