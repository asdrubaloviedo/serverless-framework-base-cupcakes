const { UserRepository } = require('@user/repositories');

class GoogleAuthDatabase {

    static async execute({ action, email, nombre }) {

        const repo = new UserRepository();

        if (action === 'login') {

            const exists = await repo.existsByEmail({
                email
            });

            if (!exists) {
                throw {
                    statusCode: 404,
                    message: 'No existe una cuenta registrada con este correo'
                };
            }

            return {
                success: true,
                action,
                email
            };
        }

        if (action === 'register') {

            const rows = await repo.registerGoogle({
                nombre,
                email
            });

            if (!rows.length) {
                throw {
                    statusCode: 409,
                    message: 'Este correo ya se encuentra registrado'
                };
            }

            return {
                success: true,
                action,
                email
            };
        }

        throw {
            statusCode: 400,
            message: 'Operación no válida'
        };
    }
}

module.exports = GoogleAuthDatabase;