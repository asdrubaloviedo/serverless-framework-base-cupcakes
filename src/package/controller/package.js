const { GetAllPackage } = require('@package/services/package');

class PackageController {

  static async getAll(params = {}) {
    const { email } = params;
    return GetAllPackage.execute({ email });
  };
}

module.exports = PackageController;
