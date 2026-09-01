/*
 * Mock de firebase-admin/app.
 *
 * No queremos inicializar Firebase realmente durante los tests.
 * Solo comprobamos que FirebaseAuthService use correctamente
 * las funciones del SDK.
 */
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(),
  cert: jest.fn(),
}));

/*
 * Mock de firebase-admin/auth.
 *
 * getAuth() debe devolver la instancia de Authentication que
 * FirebaseAuthService entrega al resto de la aplicación.
 */
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

const {
  initializeApp,
  getApps,
  cert,
} = require('firebase-admin/app');

const {
  getAuth,
} = require('firebase-admin/auth');

const FirebaseAuthService = require(
  '../../services/user/FirebaseAuthService'
);

describe('FirebaseAuthService', () => {
  /*
   * Guardamos las variables originales para no afectar
   * otros tests de Jest.
   */
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    /*
     * Creamos una copia independiente del entorno para cada test.
     */
    process.env = {
      ...originalEnv,
      FIREBASE_PROJECT_ID: 'cupcakeslife-test',
      FIREBASE_CLIENT_EMAIL: 'firebase@test.com',
      FIREBASE_PRIVATE_KEY:
        '-----BEGIN PRIVATE KEY-----\\nTEST_KEY\\n-----END PRIVATE KEY-----\\n',
    };

    /*
     * Por defecto simulamos que Firebase todavía no
     * ha sido inicializado.
     */
    getApps.mockReturnValue([]);

    /*
     * cert() devuelve normalmente una credencial.
     * Para el test basta con un objeto controlado.
     */
    cert.mockReturnValue({
      mockCredential: true,
    });

    /*
     * Simulamos la instancia devuelta por Firebase Auth.
     */
    getAuth.mockReturnValue({
      mockAuth: true,
    });
  });

  afterAll(() => {
    /*
     * Restauramos el entorno original al terminar
     * todos los tests de este archivo.
     */
    process.env = originalEnv;
  });

  test('inicializa Firebase y devuelve Auth si no existe una aplicación', () => {
    const res = FirebaseAuthService.getAuth();

    /*
     * Primero debe comprobar si ya existe una aplicación.
     */
    expect(getApps).toHaveBeenCalledTimes(1);

    /*
     * La clave almacenada contiene "\\n".
     * El servicio debe convertirlos en saltos de línea reales.
     */
    expect(cert).toHaveBeenCalledWith({
      projectId: 'cupcakeslife-test',
      clientEmail: 'firebase@test.com',
      privateKey:
        '-----BEGIN PRIVATE KEY-----\nTEST_KEY\n-----END PRIVATE KEY-----\n',
    });

    /*
     * Firebase debe inicializarse usando la credencial
     * producida por cert().
     */
    expect(initializeApp).toHaveBeenCalledWith({
      credential: {
        mockCredential: true,
      },
    });

    /*
     * Finalmente debe obtener y devolver Firebase Auth.
     */
    expect(getAuth).toHaveBeenCalledTimes(1);

    expect(res).toEqual({
      mockAuth: true,
    });
  });

  test('reutiliza Firebase si ya existe una aplicación inicializada', () => {
    /*
     * Simulamos una instancia de Firebase ya existente.
     */
    getApps.mockReturnValue([
      {
        name: '[DEFAULT]',
      },
    ]);

    const res = FirebaseAuthService.getAuth();

    expect(getApps).toHaveBeenCalledTimes(1);

    /*
     * Si Firebase ya existe, no debe volver a crear
     * credenciales ni inicializar otra aplicación.
     */
    expect(cert).not.toHaveBeenCalled();

    expect(initializeApp).not.toHaveBeenCalled();

    /*
     * Auth sí debe devolverse normalmente.
     */
    expect(getAuth).toHaveBeenCalledTimes(1);

    expect(res).toEqual({
      mockAuth: true,
    });
  });

  test('lanza error si falta FIREBASE_PROJECT_ID', () => {
    delete process.env.FIREBASE_PROJECT_ID;

    expect(() =>
      FirebaseAuthService.getAuth()
    ).toThrow(
      'Firebase Admin configuration is incomplete'
    );

    expect(cert).not.toHaveBeenCalled();
    expect(initializeApp).not.toHaveBeenCalled();
    expect(getAuth).not.toHaveBeenCalled();
  });

  test('lanza error si falta FIREBASE_CLIENT_EMAIL', () => {
    delete process.env.FIREBASE_CLIENT_EMAIL;

    expect(() =>
      FirebaseAuthService.getAuth()
    ).toThrow(
      'Firebase Admin configuration is incomplete'
    );

    expect(cert).not.toHaveBeenCalled();
    expect(initializeApp).not.toHaveBeenCalled();
    expect(getAuth).not.toHaveBeenCalled();
  });

  test('lanza error si falta FIREBASE_PRIVATE_KEY', () => {
    delete process.env.FIREBASE_PRIVATE_KEY;

    expect(() =>
      FirebaseAuthService.getAuth()
    ).toThrow(
      'Firebase Admin configuration is incomplete'
    );

    expect(cert).not.toHaveBeenCalled();
    expect(initializeApp).not.toHaveBeenCalled();
    expect(getAuth).not.toHaveBeenCalled();
  });
});