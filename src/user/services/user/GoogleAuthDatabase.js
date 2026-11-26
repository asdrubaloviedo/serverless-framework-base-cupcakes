
const db = require('@db/db');

const { UserRepository } = require('@user/repositories');

const LegalAcceptanceService = require(
    '@user/services/user/LegalAcceptanceService'
);

class GoogleAuthDatabase {

    static async execute({
        action,
        email,
        firebaseUid,
        nombre,
        documentoLegalIds
    }) {

        const repo = new UserRepository();

        // Valida el UID recibido desde la Lambda
        // de autenticación con Google.
        if (
            typeof firebaseUid !== 'string' ||
            firebaseUid.trim().length === 0 ||
            firebaseUid.length > 128
        ) {
            throw {
                statusCode: 401,
                message: 'Identidad de usuario no válida'
            };
        }

        // Inicio de sesión mediante Google.
        if (action === 'login') {

            const exists = await repo.existsByFirebaseUid({
                firebaseUid
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

        // Registro de un nuevo usuario mediante Google.
        if (action === 'register') {

            return await db.tx(async (transaction) => {

                // Valida que el usuario haya aceptado
                // todos los documentos legales vigentes.
                await LegalAcceptanceService.validateRegistrationDocuments({
                    documentoLegalIds,
                    transaction
                });

                // Registra al usuario junto con su UID de Firebase.
                const rows = await repo.registerGoogle({
                    nombre,
                    email,
                    firebaseUid,
                    transaction
                });

                // El correo electrónico o el UID ya están registrados.
                if (!rows.length) {
                    throw {
                        statusCode: 409,
                        message: 'Este correo ya se encuentra registrado'
                    };
                }

                const usuarioId = rows[0].usuario_id;

                // Registra las aceptaciones legales iniciales.
                await LegalAcceptanceService.registerInitialAcceptances({
                    usuarioId,
                    documentoLegalIds,
                    metodoAceptacion: 'google',
                    transaction
                });

                return {
                    success: true,
                    action,
                    email
                };

            });
        }

        throw {
            statusCode: 400,
            message: 'Operación no válida'
        };
    }
}

module.exports = GoogleAuthDatabase;
