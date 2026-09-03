/*
 * =========================================================
 * MOCKS
 * =========================================================
 *
 * El objetivo de este test es comprobar únicamente que los
 * getters lazy del index exportan el servicio correspondiente.
 *
 * No necesitamos cargar las implementaciones reales porque
 * algunas de ellas inicializan dependencias pesadas como:
 *
 * - Firebase Admin
 * - AWS SDK
 * - PostgreSQL
 *
 * Eso haría este test innecesariamente lento.
 */

jest.mock(
  '@user/services/user/CreateOneUser',
  () => class CreateOneUser {}
);

jest.mock(
  '@user/services/user/UpdateOneUser',
  () => class UpdateOneUser {}
);

jest.mock(
  '@user/services/user/GetUserPreferences',
  () => class GetUserPreferences {}
);

jest.mock(
  '@user/services/user/UpdateUserPreferences',
  () => class UpdateUserPreferences {}
);

jest.mock(
  '@user/services/user/GeneratePasswordResetLink',
  () => class GeneratePasswordResetLink {}
);

jest.mock(
  '@user/services/user/SendPasswordResetEmail',
  () => class SendPasswordResetEmail {}
);


/*
 * El index se requiere después de declarar todos los mocks.
 */
const services = require('@user/services/user');


describe('services/user/index', () => {

  test('exporta CreateOneUser', () => {

    expect(services).toHaveProperty(
      'CreateOneUser'
    );

    expect(
      typeof services.CreateOneUser
    ).toBe('function');
  });


  test('exporta UpdateOneUser', () => {

    expect(services).toHaveProperty(
      'UpdateOneUser'
    );

    expect(
      typeof services.UpdateOneUser
    ).toBe('function');
  });


  test('exporta GetUserPreferences', () => {

    expect(services).toHaveProperty(
      'GetUserPreferences'
    );

    expect(
      typeof services.GetUserPreferences
    ).toBe('function');
  });


  test('exporta UpdateUserPreferences', () => {

    expect(services).toHaveProperty(
      'UpdateUserPreferences'
    );

    expect(
      typeof services.UpdateUserPreferences
    ).toBe('function');
  });


  test('exporta GeneratePasswordResetLink', () => {

    expect(services).toHaveProperty(
      'GeneratePasswordResetLink'
    );

    expect(
      typeof services.GeneratePasswordResetLink
    ).toBe('function');
  });


  test('exporta SendPasswordResetEmail', () => {

    expect(services).toHaveProperty(
      'SendPasswordResetEmail'
    );

    expect(
      typeof services.SendPasswordResetEmail
    ).toBe('function');
  });
});