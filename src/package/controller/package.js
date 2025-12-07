const { GetAllPackage } = require('@package/services/package');

class PackageController {

  static async getAll(params = {}) {
    const { email, pais, moneda } = params;
    return GetAllPackage.execute({ email, pais, moneda });
  };
}

module.exports = PackageController;
