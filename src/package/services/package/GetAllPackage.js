const { PackageRepository } = require("@package/repositories/index");

// GET Listado de paquetes que el usuario no a comprado junto con su habilitacion e imagen para un usuario por id.
class GetAllPackage {
    static async execute({ email, pais, moneda }) {
        const packageRepository = new PackageRepository();

        const lowerCaseEmail = email.toLowerCase();

        // API: '/usuario-paquetes-faltantes'
        const missingPackages = await packageRepository.getAll({ lowerCaseEmail, pais, moneda });        

        if (missingPackages.length === 0) return null;
        return missingPackages;
    }
}

module.exports = GetAllPackage;