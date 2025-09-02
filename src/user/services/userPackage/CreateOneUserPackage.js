const { UserPackageRepository } = require("@user/repositories/index");

// POST Adicion de paquetes para usuarios.
class CreateOneUserPackage {
    static async execute({ email, paquete }) {
        const userPackageRepository = new UserPackageRepository();

        // API: '/insertar-usuario-paquete'
        try {
            await userPackageRepository.create({ email, paquete });
        } catch (e) {
            // No enviar el error al usuario
            throw new Error('Error creating the user package');
        }

        const userPackage = await userPackageRepository.getCreated({ email, paquete });
        return userPackage;
    }
}

module.exports = CreateOneUserPackage;