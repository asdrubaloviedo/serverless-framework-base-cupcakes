
const {
  validateGoogleAuthUser
} = require('@user/schema/user');

const token = 'valid-test-token-123456789';

describe('Esquema google-auth', () => {

  describe('Validaciones existentes', () => {

    test.each([
      {
        idToken: token,
        action: 'login'
      },
      {
        idToken: token,
        action: 'register',
        documentoLegalIds: [1, 2]
      }
    ])('acepta acción $action', body => {
      expect(
        validateGoogleAuthUser(body).success
      ).toBe(true);
    });

    test.each([
      [{ action: 'login' }],

      [{ idToken: token }],

      [{
        idToken: 'short',
        action: 'login'
      }],

      [{
        idToken: token,
        action: 'delete'
      }],

      [{
        idToken: token,
        action: 'login',
        email: 'forged@example.com'
      }],

      [{
        idToken: token,
        action: 'register',
        nombre: 'a'.repeat(51),
        documentoLegalIds: [1, 2]
      }]
    ])('rechaza body inválido %#', body => {
      expect(
        validateGoogleAuthUser(body).success
      ).toBe(false);
    });
  });

  describe('Inicio de sesión Google', () => {

    const loginBody = {
      idToken: token,
      action: 'login'
    };

    test('conserva el contrato anterior de login', () => {
      const result = validateGoogleAuthUser(
        loginBody
      );

      expect(result.success).toBe(true);

      expect(result.data).toEqual(loginBody);
    });

    test('permite enviar el nombre opcional', () => {
      const result = validateGoogleAuthUser({
        ...loginBody,
        nombre: '  Ana María  '
      });

      expect(result.success).toBe(true);

      expect(result.data.nombre).toBe(
        'Ana María'
      );
    });

    test.each([
      ['documentoLegalIds', [1, 2]],
      ['firebaseUid', 'FirebaseUidTest123'],
      ['firebase_uid', 'FirebaseUidTest123'],
      ['usuarioId', 10],
      ['metodoAceptacion', 'google']
    ])('rechaza el campo no autorizado %s', (
      field,
      value
    ) => {
      const result = validateGoogleAuthUser({
        ...loginBody,
        [field]: value
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Registro Google', () => {

    const registerBody = {
      idToken: token,
      action: 'register',
      documentoLegalIds: [1, 2]
    };

    test('acepta los dos documentos legales obligatorios', () => {
      const result = validateGoogleAuthUser(
        registerBody
      );

      expect(result.success).toBe(true);

      expect(result.data).toEqual(registerBody);
    });

    test('acepta identificadores de futuras versiones legales', () => {
      const result = validateGoogleAuthUser({
        ...registerBody,
        documentoLegalIds: [12, 35]
      });

      expect(result.success).toBe(true);

      expect(result.data.documentoLegalIds)
        .toEqual([12, 35]);
    });

    test('acepta los identificadores en diferente orden', () => {
      const result = validateGoogleAuthUser({
        ...registerBody,
        documentoLegalIds: [2, 1]
      });

      expect(result.success).toBe(true);

      expect(result.data.documentoLegalIds)
        .toEqual([2, 1]);
    });

    test('permite registrar sin nombre', () => {
      const result = validateGoogleAuthUser(
        registerBody
      );

      expect(result.success).toBe(true);

      expect(result.data.nombre)
        .toBeUndefined();
    });

    test('elimina los espacios externos del nombre', () => {
      const result = validateGoogleAuthUser({
        ...registerBody,
        nombre: '  Ana María  '
      });

      expect(result.success).toBe(true);

      expect(result.data.nombre)
        .toBe('Ana María');
    });

    test('acepta un nombre de 50 caracteres', () => {
      const nombre = 'a'.repeat(50);

      const result = validateGoogleAuthUser({
        ...registerBody,
        nombre
      });

      expect(result.success).toBe(true);

      expect(result.data.nombre).toBe(nombre);
    });

    test('rechaza el registro sin documentos legales', () => {
      const result = validateGoogleAuthUser({
        idToken: token,
        action: 'register'
      });

      expect(result.success).toBe(false);
    });

    test.each([
      ['valor null', null],
      ['array vacío', []],
      ['un solo documento', [1]],
      ['tres documentos', [1, 2, 3]],
      ['documentos duplicados', [1, 1]],
      ['identificador cero', [0, 2]],
      ['identificador negativo', [-1, 2]],
      ['identificador decimal', [1.5, 2]],
      ['identificador string', ['1', 2]],
      ['identificador booleano', [true, 2]],
      ['identificador null', [null, 2]],
      ['valor sin array', 1],
      ['string sin array', '1,2'],
      ['objeto sin array', { primero: 1, segundo: 2 }]
    ])('rechaza documentos legales inválidos: %s', (
      description,
      documentoLegalIds
    ) => {
      const result = validateGoogleAuthUser({
        ...registerBody,
        documentoLegalIds
      });

      expect(result.success).toBe(false);
    });

    test.each([
      ['email', 'forged@example.com'],
      ['firebaseUid', 'FirebaseUidTest123'],
      ['firebase_uid', 'FirebaseUidTest123'],
      ['usuarioId', 10],
      ['usuario_id', 10],
      ['metodoAceptacion', 'google'],
      ['fechaAceptacion', '2026-11-24T21:32:35Z']
    ])('rechaza el campo no autorizado %s', (
      field,
      value
    ) => {
      const result = validateGoogleAuthUser({
        ...registerBody,
        [field]: value
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Validación del token', () => {

    test.each([
      'login',
      'register'
    ])('acepta un token de 20 caracteres para %s', action => {
      const body = {
        idToken: 'a'.repeat(20),
        action
      };

      if (action === 'register') {
        body.documentoLegalIds = [1, 2];
      }

      expect(
        validateGoogleAuthUser(body).success
      ).toBe(true);
    });

    test.each([
      'login',
      'register'
    ])('rechaza un token de 19 caracteres para %s', action => {
      const body = {
        idToken: 'a'.repeat(19),
        action
      };

      if (action === 'register') {
        body.documentoLegalIds = [1, 2];
      }

      expect(
        validateGoogleAuthUser(body).success
      ).toBe(false);
    });
  });
});
