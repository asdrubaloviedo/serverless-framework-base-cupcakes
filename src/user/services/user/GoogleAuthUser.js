const FirebaseAuthService = require(
    '@user/services/user/FirebaseAuthService'
);

const GoogleAuthLambdaService = require(
    '@user/services/user/GoogleAuthLambdaService'
);

class GoogleAuthUser {

    static async execute({ idToken, action, nombre }) {

        console.log(
            '[GoogleAuth] 01 - Inicio de ejecución',
            { action }
        );

        let decoded;

        try {

            console.log(
                '[GoogleAuth] 02 - Inicializando Firebase Admin'
            );

            const auth = FirebaseAuthService.getAuth();

            console.log(
                '[GoogleAuth] 03 - Firebase Admin inicializado'
            );

            console.log(
                '[GoogleAuth] 04 - Verificando token'
            );

            decoded = await auth.verifyIdToken(
                idToken,
                true
            );

            console.log(
                '[GoogleAuth] 05 - Token verificado correctamente'
            );

        } catch (error) {

            console.error(
                '[GoogleAuth] Error de validación Firebase',
                {
                    code: error.code,
                    message: error.message
                }
            );

            throw {
                statusCode: 401,
                message: 'Token de Firebase inválido o expirado'
            };
        }

        const provider =
            decoded.firebase?.sign_in_provider;

        const email =
            typeof decoded.email === 'string'
                ? decoded.email.trim().toLowerCase()
                : '';

        if (
            provider !== 'google.com' ||
            !decoded.email_verified ||
            !email
        ) {

            console.warn(
                '[GoogleAuth] Identidad de Google no válida'
            );

            throw {
                statusCode: 403,
                message: 'Se requiere una cuenta de Google verificada'
            };
        }

        console.log(
            '[GoogleAuth] 06 - Identidad validada correctamente'
        );

        const params = {
            action,
            email
        };

        if (action === 'register') {

            params.nombre = (
                nombre ||
                decoded.name ||
                email.split('@')[0]
            ).trim();
        }

        console.log(
            '[GoogleAuth] 07 - Solicitando operación de base de datos'
        );

        const result =
            await GoogleAuthLambdaService.execute(params);

        console.log(
            '[GoogleAuth] 08 - Operación completada correctamente',
            { action }
        );

        return result;
    }
}

module.exports = GoogleAuthUser;