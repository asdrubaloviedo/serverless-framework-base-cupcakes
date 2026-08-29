const admin = require('firebase-admin');

/*
 * =========================================================
 * FIREBASE AUTH SERVICE
 * =========================================================
 *
 * Centraliza la inicialización de Firebase Admin.
 *
 * Firebase Admin debe inicializarse una sola vez por proceso.
 * En AWS Lambda, una instancia puede reutilizarse entre varias
 * ejecuciones, por eso verificamos admin.apps antes de llamar
 * initializeApp().
 *
 * Este servicio se utilizará para generar enlaces seguros de
 * recuperación de contraseña sin cambiar la lógica de Firebase
 * que actualmente ya funciona en Android.
 */
class FirebaseAuthService {

    /*
     * =========================================================
     * INITIALIZE
     * =========================================================
     *
     * Devuelve una instancia de Firebase Auth.
     *
     * Las credenciales se obtendrán mediante las variables de
     * entorno del backend. No se deben guardar claves privadas
     * directamente dentro del código fuente.
     */
    static getAuth() {

        if (admin.apps.length === 0) {

            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;

            /*
             * Evitamos inicializar Firebase con una configuración
             * incompleta. Esto también facilita detectar errores de
             * configuración durante despliegues o pruebas locales.
             */
            if (!projectId || !clientEmail || !privateKey) {
                throw new Error(
                    'Firebase Admin configuration is incomplete'
                );
            }

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,

                    /*
                     * Las variables de entorno normalmente almacenan
                     * los saltos de línea de la clave privada como \n.
                     *
                     * Firebase necesita saltos de línea reales.
                     */
                    privateKey: privateKey.replace(/\\n/g, '\n')
                })
            });
        }

        return admin.auth();
    }
}

module.exports = FirebaseAuthService;