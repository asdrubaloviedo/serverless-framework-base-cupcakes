const { UserPackageRepository } = require("@user/repositories/index");

// POST Adicion de paquetes para usuarios.
class CreateOneUserPackage {
    static async execute({ email, paquete, moneda, montoCentavos, paisCompra, paymentProvider, paymentProviderId  }) {
        const userPackageRepository = new UserPackageRepository();

        let inserted = false;

        // API: '/insertar-usuario-paquete'
        try {
            inserted = await userPackageRepository.create({ email, paquete, moneda, montoCentavos, paisCompra, paymentProvider, paymentProviderId });
        } catch (e) {
            // Error real de BD / conexión
            return {
                ok: false,
                code: 'USER_PACKAGE_CREATE_ERROR',
                httpStatus: 500,
                message: 'Error creating the user package'
            };
        }

        // Si no se insertó nada → ya existía
        if (!inserted) {
            return {
                ok: false,
                code: 'USER_PACKAGE_ALREADY_EXISTS',
                httpStatus: 409,
                message: 'El usuario ya tiene este paquete registrado.'
            };
        }

        // Si se creó → obtener registro
        const userPackage = await userPackageRepository.getCreated({ email, paquete });

        return {
            ok: true,
            code: 'USER_PACKAGE_CREATED',
            httpStatus: 201,
            data: userPackage
        };
    }
}

module.exports = CreateOneUserPackage;