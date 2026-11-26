
const FirebaseAuthService = require(
    '@user/services/user/FirebaseAuthService'
);

class LegalAuthService {

    // Extrae el token de autenticación de las cabeceras HTTP.
    static getBearerToken(headers = {}) {

        const authorizationKey = Object.keys(
            headers || {}
        ).find(
            (key) => key.toLowerCase() === 'authorization'
        );

        const authorization = authorizationKey
            ? headers[authorizationKey]
            : null;

        if (typeof authorization !== 'string') {
            throw {
                statusCode: 401,
                message: 'Token de autenticación requerido'
            };
        }

        const match = authorization.match(
            /^Bearer\s+(\S+)$/i
        );

        if (!match) {
            throw {
                statusCode: 401,
                message: 'Token de autenticación requerido'
            };
        }

        return match[1];
    }

    // Valida el token y obtiene la identidad autenticada.
    static async execute({ idToken } = {}) {

        if (
            typeof idToken !== 'string' ||
            !idToken.trim()
        ) {
            throw {
                statusCode: 401,
                message: 'Token de autenticación requerido'
            };
        }

        let decoded;

        try {

            const auth = FirebaseAuthService.getAuth();

            // El segundo parámetro permite comprobar
            // si el token ha sido revocado.
            decoded = await auth.verifyIdToken(
                idToken,
                true
            );

        } catch (error) {

            console.error(
                '[LegalAuth] Error de autenticación Firebase',
                {
                    code: error?.code
                }
            );

            const invalidTokenCodes = [
                'auth/argument-error',
                'auth/invalid-argument',
                'auth/invalid-id-token',
                'auth/id-token-expired',
                'auth/id-token-revoked',
                'auth/user-disabled',
                'auth/user-not-found'
            ];

            if (
                invalidTokenCodes.includes(error?.code)
            ) {
                throw {
                    statusCode: 401,
                    message: 'Token de Firebase inválido o expirado'
                };
            }

            throw {
                statusCode: 503,
                message: 'Servicio de autenticación no disponible'
            };
        }

        // El UID se obtiene exclusivamente del token validado.
        const uid =
            typeof decoded.uid === 'string'
                ? decoded.uid
                : '';

        const email =
            typeof decoded.email === 'string'
                ? decoded.email.trim().toLowerCase()
                : '';

        const provider =
            decoded.firebase?.sign_in_provider;

        // Proveedores de autenticación soportados.
        const allowedProviders = [
            'password',
            'google.com'
        ];

        // Valida la identidad sin modificar el UID.
        if (
            !uid.trim() ||
            uid.length > 128 ||
            !email ||
            !allowedProviders.includes(provider)
        ) {
            throw {
                statusCode: 403,
                message: 'Identidad de usuario no válida'
            };
        }

        // La verificación del correo es obligatoria
        // exclusivamente para el proveedor Google.
        //
        // Los usuarios tradicionales pueden autenticarse
        // mediante su UID aunque todavía no hayan
        // verificado su correo electrónico.
        if (
            provider === 'google.com' &&
            decoded.email_verified !== true
        ) {
            throw {
                statusCode: 403,
                message: 'Debe verificar su correo electrónico'
            };
        }

        // Devuelve exclusivamente los datos de identidad
        // necesarios para las operaciones internas.
        return {
            uid,
            email,
            provider
        };
    }

    // Autentica una solicitud HTTP mediante Bearer Token.
    static async authenticate(headers = {}) {

        const idToken =
            this.getBearerToken(headers);

        return this.execute({
            idToken
        });
    }
}

module.exports = LegalAuthService;
