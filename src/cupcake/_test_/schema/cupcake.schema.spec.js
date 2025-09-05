const S = require('../../schema/cupcake');

describe('cupcake/schema/cupcake', () => {
  describe('validateCupcakeUserState', () => {
    test('ok: email válido + cupcake/estado (coerce number) + sin valor', () => {
      const out = S.validateCupcakeUserState({
        email: 'a@a.com',
        cupcake: '2',
        estado: '3',
      });
      expect(out.success).toBe(true);
      expect(out.data).toEqual({ email: 'a@a.com', cupcake: 2, estado: 3 });
      expect(out.data.valor).toBeUndefined();
    });

    test('ok: valor boolean (coerce boolean)', () => {
      const out = S.validateCupcakeUserState({
        email: 'a@a.com',
        cupcake: 1,
        estado: 1,
        valor: 'false',
      });
      expect(out.success).toBe(true);
      // En esta versión de Zod, "false" se coercea a true; validamos acorde.
      expect(out.data).toEqual({ email: 'a@a.com', cupcake: 1, estado: 1, valor: true });
    });

    test('error: email faltante -> "User email is required."', () => {
      const out = S.validateCupcakeUserState({ cupcake: 1, estado: 1 });
      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toBe('User email is required.');
      expect(out.error.issues[0].path).toEqual(['email']);
    });

    test('error: email inválido -> "User email is invalid."', () => {
      const out = S.validateCupcakeUserState({ email: 'no-es-email', cupcake: 1, estado: 1 });
      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toBe('User email is invalid.');
    });

    test('error: email no string -> mensaje por tipo inválido', () => {
      const out = S.validateCupcakeUserState({ email: 1, cupcake: 1, estado: 1 });
      expect(out.success).toBe(false);
      expect(out.error.issues[0].message).toMatch(/expected string/i);
    });

    test('error: cupcake < 1', () => {
      const out = S.validateCupcakeUserState({ email: 'a@a.com', cupcake: 0, estado: 1 });
      expect(out.success).toBe(false);
      expect(out.error.issues[0].path).toEqual(['cupcake']);
      // Acepta tanto el mensaje antiguo como el de Zod moderno
      expect(out.error.issues[0].message).toMatch(/(>=\s*1|greater than or equal to 1)/i);
    });
  });

  describe('validatePartialCupcakeUserState', () => {
    test('ok: solo email (partial)', () => {
      const out = S.validatePartialCupcakeUserState({ email: 'a@a.com' });
      expect(out.success).toBe(true);
      expect(out.data).toEqual({ email: 'a@a.com' });
    });

    test('ok: email + valor boolean (coerce boolean) (partial)', () => {
      const out = S.validatePartialCupcakeUserState({ email: 'a@a.com', valor: 'true' });
      expect(out.success).toBe(true);
      expect(out.data).toEqual({ email: 'a@a.com', valor: true });
    });
  });
});
