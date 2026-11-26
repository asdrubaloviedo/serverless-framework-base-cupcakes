
const db = require('@db/db');

const { UserRepository } = require("@user/repositories/index");

const LegalAcceptanceService = require(
    '@user/services/user/LegalAcceptanceService'
);

// POST Adicion de usuarios nuevos a la tabla usuarios.
class CreateOneUser {

    static async execute({
        nombre,
        email,
        firebaseUid,
        pais = 'PER',
        documentoLegalIds
    }) {

        const userRepository = new UserRepository();

        // El UID debe proceder de una identidad autenticada
        // previamente mediante Firebase Authentication.
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

        // API: '/insertar-usuario-nuevo'
        try {

            return await db.tx(async (transaction) => {

                // Valida que el usuario haya aceptado
                // todos los documentos legales vigentes.
                await LegalAcceptanceService.validateRegistrationDocuments({
                    documentoLegalIds,
                    transaction
                });

                // Registra al usuario junto con su UID de Firebase.
                const createdUser = await userRepository.create({
                    nombre,
                    email,
                    firebaseUid,
                    pais,
                    transaction
                });

                // El correo electrónico o el UID ya están registrados.
                if (createdUser.length === 0) {
                    throw {
                        statusCode: 409,
                        message: 'El correo ya se encuentra registrado'
                    };
                }

                const usuarioId = createdUser[0].usuario_id;

                // Registra las aceptaciones legales iniciales.
                await LegalAcceptanceService.registerInitialAcceptances({
                    usuarioId,
                    documentoLegalIds,
                    metodoAceptacion: 'tradicional',
                    transaction
                });

                // Recupera al usuario mediante su UID de Firebase,
                // incluyendo la información de su avatar.
                const newUser = await userRepository.getByFirebaseUid({
                    firebaseUid,
                    transaction
                });

                if (newUser.length === 0) {
                    throw new Error('Error retrieving the created user');
                }

                return newUser;

            });

        } catch (e) {

            // Conserva los errores funcionales controlados.
            if ([400, 401, 409, 503].includes(e?.statusCode)) {
                throw e;
            }

            // No enviar el error interno al usuario.
            throw new Error('Error creating the user');
        }
    }
}

module.exports = CreateOneUser;
