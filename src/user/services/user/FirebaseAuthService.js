const {
    initializeApp,
    getApps,
    cert
} = require('firebase-admin/app');

const {
    getAuth
} = require('firebase-admin/auth');

/*
 * =========================================================
 * FIREBASE AUTH SERVICE
 * =========================================================
 *
 * Centraliza la inicialización de Firebase Admin SDK.
 *
 * La aplicación Firebase se inicializa una sola vez por
 * instancia de Lambda. En invocaciones posteriores reutilizamos
 * la aplicación existente.
 *
 * Las credenciales se reciben mediante variables de entorno.
 * En AWS dev esas variables provienen de Parameter Store.
 */
class FirebaseAuthService {

    static getAuth() {

        /*
         * Firebase Admin puede reutilizar una instancia de Lambda.
         *
         * Por eso verificamos primero si ya existe una aplicación
         * inicializada. Esto evita intentar inicializar Firebase
         * dos veces dentro del mismo proceso.
         */
        if (getApps().length === 0) {

            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;

            /*
             * Fallamos inmediatamente si falta alguna credencial.
             *
             * Esto ayuda a distinguir un problema de configuración
             * de otros posibles errores de Firebase Authentication.
             */
            if (!projectId || !clientEmail || !privateKey) {
                throw new Error(
                    'Firebase Admin configuration is incomplete'
                );
            }

            /*
             * La clave privada se almacenó en SSM manteniendo los
             * caracteres "\n" del JSON original.
             *
             * Firebase necesita saltos de línea reales, por eso los
             * convertimos justo antes de crear la credencial.
             */
            initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n')
                })
            });
        }

        /*
         * Devuelve Firebase Authentication asociado a la aplicación
         * predeterminada ya inicializada.
         */
        return getAuth();
    }
}

module.exports = FirebaseAuthService;