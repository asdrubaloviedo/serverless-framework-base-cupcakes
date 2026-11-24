const FirebaseAuthService = require('@user/services/user/FirebaseAuthService');
const { UserRepository } = require('@user/repositories');

class GoogleAuthUser {
    static async execute({ idToken, action, nombre }) {
        let decoded;
        try {
            decoded = await FirebaseAuthService.getAuth().verifyIdToken(idToken, true);
        } catch (_) {
            throw { statusCode: 401, message: 'Token de Firebase inválido o expirado' };
        }

        const provider = decoded.firebase && decoded.firebase.sign_in_provider;
        const email = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : '';
        if (provider !== 'google.com' || !decoded.email_verified || !email) {
            throw { statusCode: 403, message: 'Se requiere una cuenta de Google verificada' };
        }

        const repo = new UserRepository();
        if (action === 'login') {
            if (!await repo.existsByEmail({ email })) {
                throw { statusCode: 404, message: 'No existe una cuenta registrada con este correo' };
            }
            return { success: true, action, email };
        }

        // La identidad del correo se obtiene del token verificado, nunca del body.
        const displayName = (nombre || decoded.name || email.split('@')[0]).trim();
        const rows = await repo.registerGoogle({ nombre: displayName, email });
        if (!rows.length) {
            throw { statusCode: 409, message: 'Este correo ya se encuentra registrado' };
        }
        return { success: true, action, email };
    }
}

module.exports = GoogleAuthUser;
