const { CreateOneUserMedalLeage, UpdateUserMedalLeage } = require('@user/services/userMedalLeage');
const { CreateOneUserPackage } = require('@user/services/userPackage');
const { CreateOneUser } = require('@user/services/user');

class UserController {

  static async createOneUserMedalLeage(params = {}) {
    const { email, medalla } = params;
    return CreateOneUserMedalLeage.execute({ email, medalla });
  };
  
  // Aun no se tienen los querys
  static async patchOneUserMedalLeage(params = {}) {
    const { email, cupcake, estado, valor } = params; // Input de ejemplo, aun no se sabe
    return UpdateUserMedalLeage.execute({ email, cupcake, estado, valor });
  };

  static async createOneUserPackage(params = {}) {
    const { email, paquete, moneda, montoCentavos, paisCompra, paymentProvider, paymentProviderId } = params;
    return CreateOneUserPackage.execute({ email, paquete, moneda, montoCentavos, paisCompra, paymentProvider, paymentProviderId });
  };
  
  static async createOneUser(params = {}) {
    const { nombre, email } = params;
    return CreateOneUser.execute({ nombre, email });
  };
}

module.exports = UserController;
