// src/user/_test_/schema/user.schema.spec.js
describe('user/schema/user', () => {
  const S = require('@user/schema/user');

  describe('validateCreateUserMedalLeage', () => {
    test('ok: email válido y medalla (coerce number)', () => {
      const out = S.validateCreateUserMedalLeage({ email: 'a@a.com', medalla: '5' });
      expect(out.success).toBe(true);
      expect(out.data).toEqual({ email: 'a@a.com', medalla: 5 });
    });

    test('error: email faltante -> "User email is required."', () => {
      const out = S.validateCreateUserMedalLeage({ medalla: 1 });
      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toBe('User email is required.');
    });

    test('error: email inválido -> "User email is invalid."', () => {
      const out = S.validateCreateUserMedalLeage({ email: 'bad', medalla: 1 });
      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toBe('User email is invalid.');
    });

    test('error: email no string -> mensaje de tipo', () => {
      const out = S.validateCreateUserMedalLeage({ email: 1, medalla: 1 });
      expect(out.success).toBe(false);
      // No depender del texto exacto de Zod entre versiones:
      const msg = out.error.issues[0].message;
      expect(msg).toMatch(/(must be a string|expected string)/i);
    });

    test('error: medalla < 1 -> "medalla must be >= 1."', () => {
      const out = S.validateCreateUserMedalLeage({ email: 'a@a.com', medalla: 0 });
      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toBe('medalla must be >= 1.');
    });
  });

  describe('validatePatchUserMedalLeage', () => {
    test('ok: email + cupcake (coerce number)', () => {
      const out = S.validatePatchUserMedalLeage({ email: 'a@a.com', cupcake: '2' });
      expect(out.success).toBe(true);
      expect(out.data).toEqual({ email: 'a@a.com', cupcake: 2 });
    });

    test('ok: email + valor boolean (coerce boolean)', () => {
      // z.coerce.boolean() usa truthiness: 'false' (string no vacío) -> true
      const out = S.validatePatchUserMedalLeage({ email: 'a@a.com', valor: 'false' });
      expect(out.success).toBe(true);
      expect(out.data).toEqual({ email: 'a@a.com', valor: true });
    });

    test('error: solo email -> refine "At least one field to update is required."', () => {
      const out = S.validatePatchUserMedalLeage({ email: 'a@a.com' });
      expect(out.success).toBe(false);
      const issue = out.error.issues.find(i => i.path.join('.') === 'update');
      expect(issue?.message).toBe('At least one field to update is required.');
    });

    test('error: email faltante', () => {
      const out = S.validatePatchUserMedalLeage({ cupcake: 1 });
      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toBe('User email is required.');
    });

    test('error: estado < 1 -> "estado must be >= 1."', () => {
      const out = S.validatePatchUserMedalLeage({ email: 'a@a.com', estado: 0 });
      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toBe('estado must be >= 1.');
    });
  });

  describe('validateCreateUserPackage', () => {
    test('ok: email + paquete (coerce number)', () => {
      const out = S.validateCreateUserPackage({
        email: 'a@a.com',
        paquete: '10',
        moneda: 'pen',
        montoCentavos: '1500',
      });

      expect(out.success).toBe(true);
      expect(out.data).toEqual({
        email: 'a@a.com',
        paquete: 10,
        moneda: 'PEN',
        montoCentavos: 1500,
        paisCompra: undefined,
        paymentProvider: undefined,
        paymentProviderId: undefined,
      });
    });

    test('error: paquete < 1', () => {
      const out = S.validateCreateUserPackage({ email: 'a@a.com', paquete: 0 });
      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toBe('paquete must be >= 1.');
    });

    test('error: email inválido', () => {
      const out = S.validateCreateUserPackage({ email: 'bad', paquete: 1 });
      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toBe('User email is invalid.');
    });
  });

  describe('validateCreateUser', () => {
    test('ok: nombre y email válidos', () => {
      const out = S.validateCreateUser({
        nombre: 'Juan Perez',
        email: 'A@A.COM',
      });

      expect(out.success).toBe(true);
      expect(out.data).toEqual({
        nombre: 'Juan Perez',
        email: 'a@a.com',
        pais: 'PER',
      });
    });

    test('error: nombre faltante', () => {
      const out = S.validateCreateUser({ email: 'a@a.com' });

      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toBe(
        'User nombre must have at least 2 characters.'
      );
    });

    test('error: email faltante', () => {
      const out = S.validateCreateUser({ nombre: 'Juan Perez' });

      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toBe('User email is required.');
    });

    test('createUserSchema asigna PER cuando pais no viene', () => {
      const { validateCreateUser } = require('../../schema/user');

      const result = validateCreateUser({
        nombre: 'Juan Perez',
        email: 'test@test.com',
      });

      expect(result.success).toBe(true);
      expect(result.data.pais).toBe('PER');
    });

    test('createUserSchema asigna PER cuando pais viene vacío', () => {
      const { validateCreateUser } = require('../../schema/user');

      const result = validateCreateUser({
        nombre: 'Juan Perez',
        email: 'test@test.com',
        pais: '',
      });

      expect(result.success).toBe(true);
      expect(result.data.pais).toBe('PER');
    });
  });
});
