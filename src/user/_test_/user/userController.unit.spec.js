jest.mock('@user/services/userMedalLeage', () => ({
  CreateOneUserMedalLeage: { execute: jest.fn() },
  UpdateUserMedalLeage: { execute: jest.fn() },
}));

jest.mock('@user/services/userPackage', () => ({
  CreateOneUserPackage: { execute: jest.fn() },
}));

jest.mock('@user/services/user', () => ({
  CreateOneUser: { execute: jest.fn() },
  GetUserProfile: { execute: jest.fn() },
  GoogleAuthUser: { execute: jest.fn() },
  UpdateOneUser: { execute: jest.fn() },
  GetUserPreferences: { execute: jest.fn() },
  UpdateUserPreferences: { execute: jest.fn() },
  GetActiveLegalDocuments: { execute: jest.fn() },
  GetPendingLegalAcceptances: { execute: jest.fn() },
  RegisterLegalAcceptances: { execute: jest.fn() },
  GeneratePasswordResetLink: { execute: jest.fn() },
  SendPasswordResetEmail: { execute: jest.fn() },
}));

const {
  CreateOneUserMedalLeage,
  UpdateUserMedalLeage,
} = require('@user/services/userMedalLeage');

const {
  CreateOneUserPackage,
} = require('@user/services/userPackage');

const {
  CreateOneUser,
  GetUserProfile,
  GoogleAuthUser,
  UpdateOneUser,
  GetUserPreferences,
  UpdateUserPreferences,
  GetActiveLegalDocuments,
  GetPendingLegalAcceptances,
  RegisterLegalAcceptances,
  GeneratePasswordResetLink,
  SendPasswordResetEmail,
} = require('@user/services/user');

const UserController = require('../../controller/user');

const email = 'user@example.com';

const firebaseUid = 'AbCdEf123FirebaseUID';

const documentoLegalIds = [12, 35];

const idToken = 'firebase-id-token';

const resetLink =
  'https://example.com/reset-password?oobCode=test-code';

const registerParams = {
  nombre: 'Juan Perez',
  email,
  firebaseUid,
  pais: 'PER',
  documentoLegalIds,
};

const preferenceParams = {
  email,
  recordatorios: true,
  mensajes: false,
  promociones: false,
  musica: true,
  efectos_sonido: false,
  vibracion: true,
  tema: 'dark',
};

const packageParams = {
  email,
  paquete: 1,
  moneda: 'PEN',
  montoCentavos: 3499,
  paisCompra: 'PER',
  paymentProvider: 'stripe',
  paymentProviderId: 'pay_123',
};

const googleRegisterParams = {
  idToken,
  nombre: 'Juan Perez',
  documentoLegalIds,
};

const googleLoginParams = {
  idToken,
};

const pendingParams = {
  firebaseUid,
};

const acceptanceParams = {
  firebaseUid,
  documentoLegalIds,
};

const delegatedOperations = [
  {
    method: 'createOneUserMedalLeage',
    service: CreateOneUserMedalLeage,
    params: {
      email,
      medalla: 1,
    },
  },
  {
    method: 'patchOneUserMedalLeage',
    service: UpdateUserMedalLeage,
    params: {
      email,
      cupcake: 1,
      estado: 2,
      valor: true,
    },
  },
  {
    method: 'createOneUserPackage',
    service: CreateOneUserPackage,
    params: packageParams,
  },
  {
    method: 'createOneUser',
    service: CreateOneUser,
    params: registerParams,
  },
  {
    method: 'getUserProfile',
    service: GetUserProfile,
    params: { firebaseUid },
  },
  {
    method: 'googleAuthUser',
    service: GoogleAuthUser,
    params: googleLoginParams,
  },
  {
    method: 'updateOneUser',
    service: UpdateOneUser,
    params: {
      nombre: 'Juan Perez',
      email,
      avatarId: 3,
    },
  },
  {
    method: 'getUserPreferences',
    service: GetUserPreferences,
    params: { email },
  },
  {
    method: 'updateUserPreferences',
    service: UpdateUserPreferences,
    params: preferenceParams,
  },
  {
    method: 'getActiveLegalDocuments',
    service: GetActiveLegalDocuments,
    params: undefined,
  },
  {
    method: 'getPendingLegalAcceptances',
    service: GetPendingLegalAcceptances,
    params: pendingParams,
  },
  {
    method: 'registerLegalAcceptances',
    service: RegisterLegalAcceptances,
    params: acceptanceParams,
  },
];

const allServices = [
  CreateOneUserMedalLeage,
  UpdateUserMedalLeage,
  CreateOneUserPackage,
  CreateOneUser,
  GetUserProfile,
  GoogleAuthUser,
  UpdateOneUser,
  GetUserPreferences,
  UpdateUserPreferences,
  GetActiveLegalDocuments,
  GetPendingLegalAcceptances,
  RegisterLegalAcceptances,
  GeneratePasswordResetLink,
  SendPasswordResetEmail,
];

const expectOnlyServicesCalled = selectedServices => {

  allServices.forEach(service => {

    if (selectedServices.includes(service)) {

      expect(service.execute)
        .toHaveBeenCalledTimes(1);

    } else {

      expect(service.execute)
        .not.toHaveBeenCalled();
    }
  });
};

describe('UserController', () => {

  beforeEach(() => {

    jest.resetAllMocks();
  });


  /*
   * =======================================================
   * CASOS ORIGINALES
   * =======================================================
   */

  describe('Casos originales conservados y readaptados', () => {

    test('createOneUserMedalLeage pasa params', async () => {

      CreateOneUserMedalLeage.execute
        .mockResolvedValue([{ ok: 1 }]);

      const r =
        await UserController.createOneUserMedalLeage({
          email: 'a@a.com',
          medalla: 1,
        });

      expect(
        CreateOneUserMedalLeage.execute
      ).toHaveBeenCalledWith({
        email: 'a@a.com',
        medalla: 1,
      });

      expect(r).toEqual([{ ok: 1 }]);
    });


    test('patchOneUserMedalLeage pasa params', async () => {

      UpdateUserMedalLeage.execute
        .mockResolvedValue([{ ok: 2 }]);

      const r =
        await UserController.patchOneUserMedalLeage({
          email: 'a@a.com',
          cupcake: 1,
          estado: 2,
          valor: true,
        });

      expect(
        UpdateUserMedalLeage.execute
      ).toHaveBeenCalledWith({
        email: 'a@a.com',
        cupcake: 1,
        estado: 2,
        valor: true,
      });

      expect(r).toEqual([{ ok: 2 }]);
    });


    test('createOneUserPackage pasa params', async () => {

      CreateOneUserPackage.execute
        .mockResolvedValue([{ ok: 3 }]);

      const r =
        await UserController.createOneUserPackage({
          email: 'a@a.com',
          paquete: 1,
          moneda: 'PEN',
          montoCentavos: 3499,
          paisCompra: 'PER',
          paymentProvider: 'stripe',
          paymentProviderId: 'pay_123',
        });

      expect(
        CreateOneUserPackage.execute
      ).toHaveBeenCalledWith({
        email: 'a@a.com',
        paquete: 1,
        moneda: 'PEN',
        montoCentavos: 3499,
        paisCompra: 'PER',
        paymentProvider: 'stripe',
        paymentProviderId: 'pay_123',
      });

      expect(r).toEqual([{ ok: 3 }]);
    });


    test('createOneUser pasa params con pais por defecto', async () => {

      CreateOneUser.execute
        .mockResolvedValue([{ ok: 4 }]);

      const r =
        await UserController.createOneUser({
          nombre: 'Juan Perez',
          email: 'b@b.com',
          firebaseUid,
          documentoLegalIds,
        });

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith({
        nombre: 'Juan Perez',
        email: 'b@b.com',
        firebaseUid,
        pais: 'PER',
        documentoLegalIds,
      });

      expect(r).toEqual([{ ok: 4 }]);
    });


    test('createOneUser pasa pais personalizado', async () => {

      CreateOneUser.execute
        .mockResolvedValue([{ ok: 5 }]);

      const r =
        await UserController.createOneUser({
          nombre: 'Juan Perez',
          email: 'b@b.com',
          firebaseUid,
          pais: 'FRA',
          documentoLegalIds,
        });

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith({
        nombre: 'Juan Perez',
        email: 'b@b.com',
        firebaseUid,
        pais: 'FRA',
        documentoLegalIds,
      });

      expect(r).toEqual([{ ok: 5 }]);
    });
  });


  /*
   * =======================================================
   * USER MEDAL
   * =======================================================
   */

  describe('Gestión de medallas de usuario', () => {

    test('createOneUserMedalLeage transmite únicamente los campos correspondientes', async () => {

      const response = [{ ok: 1 }];

      CreateOneUserMedalLeage.execute
        .mockResolvedValue(response);

      await expect(
        UserController.createOneUserMedalLeage({
          email,
          medalla: 1,
          usuarioId: 99,
          firebaseUid,
          idToken,
          documentoLegalIds,
        })
      ).resolves.toBe(response);

      expect(
        CreateOneUserMedalLeage.execute
      ).toHaveBeenCalledWith({
        email,
        medalla: 1,
      });

      expectOnlyServicesCalled([
        CreateOneUserMedalLeage,
      ]);
    });


    test('createOneUserMedalLeage delega los parámetros ausentes', async () => {

      await UserController
        .createOneUserMedalLeage();

      expect(
        CreateOneUserMedalLeage.execute
      ).toHaveBeenCalledWith({
        email: undefined,
        medalla: undefined,
      });
    });


    test.each([
      true,
      false,
    ])('patchOneUserMedalLeage conserva el valor booleano %p', async valor => {

      await UserController.patchOneUserMedalLeage({
        email,
        cupcake: 1,
        estado: 2,
        valor,
        usuarioId: 99,
        idToken,
      });

      expect(
        UpdateUserMedalLeage.execute
      ).toHaveBeenCalledWith({
        email,
        cupcake: 1,
        estado: 2,
        valor,
      });

      expectOnlyServicesCalled([
        UpdateUserMedalLeage,
      ]);
    });


    test('patchOneUserMedalLeage delega los parámetros ausentes', async () => {

      await UserController
        .patchOneUserMedalLeage();

      expect(
        UpdateUserMedalLeage.execute
      ).toHaveBeenCalledWith({
        email: undefined,
        cupcake: undefined,
        estado: undefined,
        valor: undefined,
      });
    });
  });


  /*
   * =======================================================
   * USER PACKAGE
   * =======================================================
   */

  describe('Gestión de paquetes de usuario', () => {

    test('createOneUserPackage transmite únicamente los campos correspondientes', async () => {

      const response = [{ ok: 1 }];

      CreateOneUserPackage.execute
        .mockResolvedValue(response);

      await expect(
        UserController.createOneUserPackage({
          ...packageParams,
          usuarioId: 99,
          firebaseUid,
          idToken,
          password: 'test-password',
        })
      ).resolves.toBe(response);

      expect(
        CreateOneUserPackage.execute
      ).toHaveBeenCalledWith(packageParams);

      expectOnlyServicesCalled([
        CreateOneUserPackage,
      ]);
    });


    test('createOneUserPackage conserva el monto expresado en centavos', async () => {

      await UserController.createOneUserPackage({
        ...packageParams,
        montoCentavos: 1999,
      });

      expect(
        CreateOneUserPackage.execute
      ).toHaveBeenCalledWith({
        ...packageParams,
        montoCentavos: 1999,
      });
    });


    test('createOneUserPackage conserva los datos del proveedor de pago', async () => {

      await UserController.createOneUserPackage({
        ...packageParams,
        paymentProvider: 'test-provider',
        paymentProviderId: 'payment-456',
      });

      expect(
        CreateOneUserPackage.execute
      ).toHaveBeenCalledWith({
        ...packageParams,
        paymentProvider: 'test-provider',
        paymentProviderId: 'payment-456',
      });
    });


    test('createOneUserPackage delega los parámetros ausentes', async () => {

      await UserController
        .createOneUserPackage();

      expect(
        CreateOneUserPackage.execute
      ).toHaveBeenCalledWith({
        email: undefined,
        paquete: undefined,
        moneda: undefined,
        montoCentavos: undefined,
        paisCompra: undefined,
        paymentProvider: undefined,
        paymentProviderId: undefined,
      });
    });
  });


  /*
   * =======================================================
   * REGISTRO TRADICIONAL
   * =======================================================
   */

  describe('Registro tradicional de usuarios', () => {

    test('transmite la identidad Firebase y los documentos legales', async () => {

      const response = {
        id: 25,
        nombre: 'Juan Perez',
        email,
      };

      CreateOneUser.execute
        .mockResolvedValue(response);

      await expect(
        UserController.createOneUser(
          registerParams
        )
      ).resolves.toBe(response);

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith(registerParams);

      expectOnlyServicesCalled([
        CreateOneUser,
      ]);
    });


    test.each([
      'A',
      'AbCdEf123XyZ',
      'A'.repeat(128),
    ])('conserva el Firebase UID %s', async originalUid => {

      await UserController.createOneUser({
        ...registerParams,
        firebaseUid: originalUid,
      });

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith({
        ...registerParams,
        firebaseUid: originalUid,
      });
    });


    test('utiliza PER cuando pais es undefined', async () => {

      await UserController.createOneUser({
        ...registerParams,
        pais: undefined,
      });

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith(registerParams);
    });


    test('transmite los identificadores de futuras versiones legales', async () => {

      const updatedDocumentIds = [48, 52];

      await UserController.createOneUser({
        ...registerParams,
        documentoLegalIds: updatedDocumentIds,
      });

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith({
        ...registerParams,
        documentoLegalIds: updatedDocumentIds,
      });
    });


    test('conserva el orden y referencia de los documentos legales', async () => {

      const documentIds = [52, 48];

      await UserController.createOneUser({
        ...registerParams,
        documentoLegalIds: documentIds,
      });

      const payload =
        CreateOneUser.execute.mock.calls[0][0];

      expect(payload.documentoLegalIds)
        .toBe(documentIds);

      expect(payload.documentoLegalIds)
        .toEqual([52, 48]);
    });


    test('conserva los caracteres Unicode del nombre', async () => {

      const nombre = 'María José Muñoz';

      await UserController.createOneUser({
        ...registerParams,
        nombre,
      });

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith({
        ...registerParams,
        nombre,
      });
    });


    test('no transmite credenciales ni propiedades adicionales', async () => {

      await UserController.createOneUser({
        ...registerParams,
        idToken,
        token: 'another-token',
        password: 'test-password',
        uid: 'ForgedUID',
        firebase_uid: 'AnotherUID',
        usuarioId: 99,
        metodoAceptacion: 'manual',
        fechaAceptacion: '2026-11-24T21:32:35Z',
      });

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith(registerParams);
    });


    test('no sustituye un Firebase UID ausente por identificadores alternativos', async () => {

      await UserController.createOneUser({
        ...registerParams,
        firebaseUid: undefined,
        uid: 'AlternativeUID',
        firebase_uid: 'AnotherUID',
        usuarioId: 99,
      });

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith({
        ...registerParams,
        firebaseUid: undefined,
      });
    });


    test('delega la ausencia de documentos legales al servicio', async () => {

      const error = {
        statusCode: 400,
        message: 'Documentos legales requeridos',
      };

      CreateOneUser.execute
        .mockRejectedValue(error);

      await expect(
        UserController.createOneUser({
          ...registerParams,
          documentoLegalIds: undefined,
        })
      ).rejects.toBe(error);

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith({
        ...registerParams,
        documentoLegalIds: undefined,
      });
    });


    test('delega los parámetros ausentes conservando el país predeterminado', async () => {

      await UserController.createOneUser();

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith({
        nombre: undefined,
        email: undefined,
        firebaseUid: undefined,
        pais: 'PER',
        documentoLegalIds: undefined,
      });
    });


    test('no modifica los parámetros originales del registro', async () => {

      const immutableParams = Object.freeze({
        ...registerParams,
        documentoLegalIds: Object.freeze([
          ...documentoLegalIds,
        ]),
      });

      await UserController.createOneUser(
        immutableParams
      );

      expect(immutableParams)
        .toEqual(registerParams);

      expect(
        CreateOneUser.execute
      ).toHaveBeenCalledWith(registerParams);
    });
  });


  /*
   * =======================================================
   * GOOGLE AUTH
   * =======================================================
   */

  describe('Autenticación mediante Google', () => {

    test('delega el inicio de sesión mediante Google', async () => {

      const response = {
        success: true,
        usuario: { id: 25 },
      };

      GoogleAuthUser.execute
        .mockResolvedValue(response);

      await expect(
        UserController.googleAuthUser(
          googleLoginParams
        )
      ).resolves.toBe(response);

      expect(
        GoogleAuthUser.execute
      ).toHaveBeenCalledWith(
        googleLoginParams
      );

      expectOnlyServicesCalled([
        GoogleAuthUser,
      ]);
    });


    test('delega el registro mediante Google y los documentos legales', async () => {

      const response = {
        success: true,
        usuario: { id: 26 },
      };

      GoogleAuthUser.execute
        .mockResolvedValue(response);

      await expect(
        UserController.googleAuthUser(
          googleRegisterParams
        )
      ).resolves.toBe(response);

      expect(
        GoogleAuthUser.execute
      ).toHaveBeenCalledWith(
        googleRegisterParams
      );

      expectOnlyServicesCalled([
        GoogleAuthUser,
      ]);
    });


    test('conserva la referencia original de los parámetros Google', async () => {

      await UserController.googleAuthUser(
        googleRegisterParams
      );

      expect(
        GoogleAuthUser.execute.mock.calls[0][0]
      ).toBe(googleRegisterParams);
    });


    test('transmite futuras versiones de documentos legales', async () => {

      const params = {
        ...googleRegisterParams,
        documentoLegalIds: [48, 52],
      };

      await UserController.googleAuthUser(
        params
      );

      expect(
        GoogleAuthUser.execute
      ).toHaveBeenCalledWith(params);
    });


    test('delega la validación del token al servicio Google', async () => {

      const error = {
        statusCode: 401,
        message: 'Token inválido',
      };

      GoogleAuthUser.execute
        .mockRejectedValue(error);

      await expect(
        UserController.googleAuthUser({
          idToken: '',
        })
      ).rejects.toBe(error);

      expect(
        GoogleAuthUser.execute
      ).toHaveBeenCalledWith({
        idToken: '',
      });
    });


    test('delega un objeto vacío cuando no recibe parámetros', async () => {

      await UserController.googleAuthUser();

      expect(
        GoogleAuthUser.execute
      ).toHaveBeenCalledWith({});
    });


    test('no modifica los parámetros originales de autenticación Google', async () => {

      const immutableParams = Object.freeze({
        ...googleRegisterParams,
        documentoLegalIds: Object.freeze([
          ...documentoLegalIds,
        ]),
      });

      await UserController.googleAuthUser(
        immutableParams
      );

      expect(
        GoogleAuthUser.execute.mock.calls[0][0]
      ).toBe(immutableParams);

      expect(immutableParams)
        .toEqual(googleRegisterParams);
    });
  });


  /*
   * =======================================================
   * USER PROFILE
   * =======================================================
   */

  describe('Actualización del perfil de usuario', () => {

    test('transmite los datos del perfil al servicio correspondiente', async () => {

      const params = {
        nombre: 'María José',
        email,
        avatarId: 3,
      };

      const response = {
        success: true,
      };

      UpdateOneUser.execute
        .mockResolvedValue(response);

      await expect(
        UserController.updateOneUser(params)
      ).resolves.toBe(response);

      expect(
        UpdateOneUser.execute
      ).toHaveBeenCalledWith(params);

      expectOnlyServicesCalled([
        UpdateOneUser,
      ]);
    });


    test('no transmite campos ajenos a la actualización del perfil', async () => {

      await UserController.updateOneUser({
        nombre: 'Juan Perez',
        email,
        avatarId: 3,
        firebaseUid,
        documentoLegalIds,
        password: 'test-password',
        pais: 'COL',
        usuarioId: 99,
        idToken,
      });

      expect(
        UpdateOneUser.execute
      ).toHaveBeenCalledWith({
        nombre: 'Juan Perez',
        email,
        avatarId: 3,
      });
    });


    test('conserva el identificador de avatar recibido', async () => {

      await UserController.updateOneUser({
        nombre: 'Juan Perez',
        email,
        avatarId: 8,
      });

      expect(
        UpdateOneUser.execute
      ).toHaveBeenCalledWith({
        nombre: 'Juan Perez',
        email,
        avatarId: 8,
      });
    });


    test('delega los parámetros ausentes', async () => {

      await UserController.updateOneUser();

      expect(
        UpdateOneUser.execute
      ).toHaveBeenCalledWith({
        nombre: undefined,
        email: undefined,
        avatarId: undefined,
      });
    });
  });


  /*
   * =======================================================
   * USER PREFERENCES
   * =======================================================
   */

  describe('Consulta de preferencias del usuario', () => {

    test('consulta las preferencias utilizando el correo recibido', async () => {

      const response = {
        musica: true,
        tema: 'dark',
      };

      GetUserPreferences.execute
        .mockResolvedValue(response);

      await expect(
        UserController.getUserPreferences({
          email,
        })
      ).resolves.toBe(response);

      expect(
        GetUserPreferences.execute
      ).toHaveBeenCalledWith({
        email,
      });

      expectOnlyServicesCalled([
        GetUserPreferences,
      ]);
    });


    test('no transmite parámetros ajenos a la consulta', async () => {

      await UserController.getUserPreferences({
        email,
        firebaseUid,
        usuarioId: 99,
        tema: 'dark',
        idToken,
      });

      expect(
        GetUserPreferences.execute
      ).toHaveBeenCalledWith({
        email,
      });
    });


    test('delega la ausencia del correo al servicio', async () => {

      await UserController.getUserPreferences();

      expect(
        GetUserPreferences.execute
      ).toHaveBeenCalledWith({
        email: undefined,
      });
    });
  });


  describe('Actualización de preferencias del usuario', () => {

    test('transmite todas las preferencias recibidas', async () => {

      const response = {
        success: true,
      };

      UpdateUserPreferences.execute
        .mockResolvedValue(response);

      await expect(
        UserController.updateUserPreferences(
          preferenceParams
        )
      ).resolves.toBe(response);

      expect(
        UpdateUserPreferences.execute
      ).toHaveBeenCalledWith(
        preferenceParams
      );

      expectOnlyServicesCalled([
        UpdateUserPreferences,
      ]);
    });


    const booleanPreferences = [
      'recordatorios',
      'mensajes',
      'promociones',
      'musica',
      'efectos_sonido',
      'vibracion',
    ];


    describe.each(booleanPreferences)(
      'preferencia %s',
      preferenceName => {

        test.each([
          true,
          false,
        ])('conserva el valor booleano %p', async value => {

          const params = {
            ...preferenceParams,
            [preferenceName]: value,
          };

          await UserController
            .updateUserPreferences(params);

          expect(
            UpdateUserPreferences.execute
          ).toHaveBeenCalledWith(params);

          const payload =
            UpdateUserPreferences.execute
              .mock.calls[0][0];

          expect(payload[preferenceName])
            .toBe(value);
        });
      }
    );


    test.each([
      'light',
      'dark',
    ])('transmite el tema recibido: %s', async tema => {

      await UserController.updateUserPreferences({
        ...preferenceParams,
        tema,
      });

      expect(
        UpdateUserPreferences.execute
      ).toHaveBeenCalledWith({
        ...preferenceParams,
        tema,
      });
    });


    test('conserva las propiedades ausentes durante una actualización parcial', async () => {

      await UserController.updateUserPreferences({
        email,
        musica: false,
      });

      expect(
        UpdateUserPreferences.execute
      ).toHaveBeenCalledWith({
        email,
        recordatorios: undefined,
        mensajes: undefined,
        promociones: undefined,
        musica: false,
        efectos_sonido: undefined,
        vibracion: undefined,
        tema: undefined,
      });
    });


    test('no transmite campos ajenos a las preferencias', async () => {

      await UserController.updateUserPreferences({
        ...preferenceParams,
        nombre: 'Juan Perez',
        avatarId: 3,
        firebaseUid,
        documentoLegalIds,
        usuarioId: 99,
        idToken,
      });

      expect(
        UpdateUserPreferences.execute
      ).toHaveBeenCalledWith(
        preferenceParams
      );
    });


    test('delega los parámetros ausentes', async () => {

      await UserController
        .updateUserPreferences();

      expect(
        UpdateUserPreferences.execute
      ).toHaveBeenCalledWith({
        email: undefined,
        recordatorios: undefined,
        mensajes: undefined,
        promociones: undefined,
        musica: undefined,
        efectos_sonido: undefined,
        vibracion: undefined,
        tema: undefined,
      });
    });


    test('no modifica las preferencias originales', async () => {

      const immutableParams = Object.freeze({
        ...preferenceParams,
      });

      await UserController
        .updateUserPreferences(
          immutableParams
        );

      expect(immutableParams)
        .toEqual(preferenceParams);

      expect(
        UpdateUserPreferences.execute
      ).toHaveBeenCalledWith(
        preferenceParams
      );
    });
  });


  /*
   * =======================================================
   * ACTIVE LEGAL DOCUMENTS
   * =======================================================
   */

  describe('Consulta de documentos legales vigentes', () => {

    test('delega la consulta de documentos legales sin parámetros', async () => {

      const response = {
        success: true,
        documentos: [
          { id: 12 },
          { id: 35 },
        ],
      };

      GetActiveLegalDocuments.execute
        .mockResolvedValue(response);

      await expect(
        UserController.getActiveLegalDocuments()
      ).resolves.toBe(response);

      expect(
        GetActiveLegalDocuments.execute
      ).toHaveBeenCalledWith();

      expectOnlyServicesCalled([
        GetActiveLegalDocuments,
      ]);
    });


    test('no transmite parámetros adicionales al servicio de documentos vigentes', async () => {

      await UserController.getActiveLegalDocuments({
        email,
        firebaseUid,
        idToken,
        documentoLegalIds,
      });

      expect(
        GetActiveLegalDocuments.execute
      ).toHaveBeenCalledWith();
    });


    test('conserva una respuesta sin documentos vigentes', async () => {

      const response = {
        success: true,
        documentos: [],
      };

      GetActiveLegalDocuments.execute
        .mockResolvedValue(response);

      await expect(
        UserController.getActiveLegalDocuments()
      ).resolves.toBe(response);
    });


    test('conserva la respuesta de futuras versiones legales', async () => {

      const response = {
        success: true,
        documentos: [
          { id: 48 },
          { id: 52 },
        ],
      };

      GetActiveLegalDocuments.execute
        .mockResolvedValue(response);

      await expect(
        UserController.getActiveLegalDocuments()
      ).resolves.toBe(response);
    });
  });


  /*
   * =======================================================
   * PENDING LEGAL ACCEPTANCES
   * =======================================================
   */

  describe('Consulta de aceptaciones legales pendientes', () => {

    test('consulta las aceptaciones pendientes mediante Firebase UID', async () => {

      const response = {
        success: true,
        documentos: [
          { id: 12 },
          { id: 35 },
        ],
      };

      GetPendingLegalAcceptances.execute
        .mockResolvedValue(response);

      await expect(
        UserController.getPendingLegalAcceptances(
          pendingParams
        )
      ).resolves.toBe(response);

      expect(
        GetPendingLegalAcceptances.execute
      ).toHaveBeenCalledWith({
        firebaseUid,
      });

      expectOnlyServicesCalled([
        GetPendingLegalAcceptances,
      ]);
    });


    test.each([
      'A',
      'AbCdEf123XyZ',
      'A'.repeat(128),
    ])('conserva el Firebase UID %s', async originalUid => {

      await UserController
        .getPendingLegalAcceptances({
          firebaseUid: originalUid,
        });

      expect(
        GetPendingLegalAcceptances.execute
      ).toHaveBeenCalledWith({
        firebaseUid: originalUid,
      });
    });


    test('ignora el correo y otros identificadores alternativos', async () => {

      await UserController
        .getPendingLegalAcceptances({
          firebaseUid,
          email: 'other@example.com',
          uid: 'ForgedUID',
          firebase_uid: 'AnotherUID',
          usuarioId: 99,
          idToken,
          documentoLegalIds,
        });

      expect(
        GetPendingLegalAcceptances.execute
      ).toHaveBeenCalledWith({
        firebaseUid,
      });
    });


    test('no sustituye el Firebase UID ausente por otro identificador', async () => {

      await UserController
        .getPendingLegalAcceptances({
          uid: 'AlternativeUID',
          usuarioId: 99,
          email,
        });

      expect(
        GetPendingLegalAcceptances.execute
      ).toHaveBeenCalledWith({
        firebaseUid: undefined,
      });
    });


    test('delega los parámetros ausentes', async () => {

      await UserController
        .getPendingLegalAcceptances();

      expect(
        GetPendingLegalAcceptances.execute
      ).toHaveBeenCalledWith({
        firebaseUid: undefined,
      });
    });


    test('conserva una respuesta sin aceptaciones pendientes', async () => {

      const response = {
        success: true,
        documentos: [],
      };

      GetPendingLegalAcceptances.execute
        .mockResolvedValue(response);

      await expect(
        UserController.getPendingLegalAcceptances(
          pendingParams
        )
      ).resolves.toBe(response);
    });


    test('no modifica los parámetros originales', async () => {

      const immutableParams = Object.freeze({
        ...pendingParams,
      });

      await UserController
        .getPendingLegalAcceptances(
          immutableParams
        );

      expect(immutableParams)
        .toEqual(pendingParams);
    });
  });


  /*
   * =======================================================
   * REGISTER LEGAL ACCEPTANCES
   * =======================================================
   */

  describe('Registro de aceptaciones legales posteriores', () => {

    test('registra las aceptaciones mediante Firebase UID y documentos legales', async () => {

      const response = {
        success: true,
      };

      RegisterLegalAcceptances.execute
        .mockResolvedValue(response);

      await expect(
        UserController.registerLegalAcceptances(
          acceptanceParams
        )
      ).resolves.toBe(response);

      expect(
        RegisterLegalAcceptances.execute
      ).toHaveBeenCalledWith({
        firebaseUid,
        documentoLegalIds,
      });

      expectOnlyServicesCalled([
        RegisterLegalAcceptances,
      ]);
    });


    test.each([
      'A',
      'AbCdEf123XyZ',
      'A'.repeat(128),
    ])('conserva el Firebase UID %s', async originalUid => {

      await UserController
        .registerLegalAcceptances({
          firebaseUid: originalUid,
          documentoLegalIds,
        });

      expect(
        RegisterLegalAcceptances.execute
      ).toHaveBeenCalledWith({
        firebaseUid: originalUid,
        documentoLegalIds,
      });
    });


    test('transmite futuras versiones de documentos legales', async () => {

      const updatedDocumentIds = [48, 52];

      await UserController
        .registerLegalAcceptances({
          firebaseUid,
          documentoLegalIds: updatedDocumentIds,
        });

      expect(
        RegisterLegalAcceptances.execute
      ).toHaveBeenCalledWith({
        firebaseUid,
        documentoLegalIds: updatedDocumentIds,
      });
    });


    test('conserva el orden y referencia de los documentos legales', async () => {

      const documentIds = [52, 48];

      await UserController
        .registerLegalAcceptances({
          firebaseUid,
          documentoLegalIds: documentIds,
        });

      const payload =
        RegisterLegalAcceptances.execute
          .mock.calls[0][0];

      expect(payload.documentoLegalIds)
        .toBe(documentIds);

      expect(payload.documentoLegalIds)
        .toEqual([52, 48]);
    });


    test('no transmite credenciales ni datos de aceptación ajenos al contrato', async () => {

      await UserController
        .registerLegalAcceptances({
          ...acceptanceParams,
          email: 'other@example.com',
          uid: 'ForgedUID',
          firebase_uid: 'AnotherUID',
          usuarioId: 99,
          idToken,
          token: 'another-token',
          metodoAceptacion: 'manual',
          fechaAceptacion: '2026-11-24T21:32:35Z',
          version: '1.0',
        });

      expect(
        RegisterLegalAcceptances.execute
      ).toHaveBeenCalledWith(
        acceptanceParams
      );
    });


    test('no sustituye un Firebase UID ausente por identificadores alternativos', async () => {

      await UserController
        .registerLegalAcceptances({
          documentoLegalIds,
          uid: 'AlternativeUID',
          usuarioId: 99,
          email,
        });

      expect(
        RegisterLegalAcceptances.execute
      ).toHaveBeenCalledWith({
        firebaseUid: undefined,
        documentoLegalIds,
      });
    });


    test('delega los parámetros ausentes', async () => {

      await UserController
        .registerLegalAcceptances();

      expect(
        RegisterLegalAcceptances.execute
      ).toHaveBeenCalledWith({
        firebaseUid: undefined,
        documentoLegalIds: undefined,
      });
    });


    test('no modifica los parámetros originales de aceptación', async () => {

      const immutableParams = Object.freeze({
        ...acceptanceParams,
        documentoLegalIds: Object.freeze([
          ...documentoLegalIds,
        ]),
      });

      await UserController
        .registerLegalAcceptances(
          immutableParams
        );

      expect(immutableParams)
        .toEqual(acceptanceParams);

      expect(
        RegisterLegalAcceptances.execute
      ).toHaveBeenCalledWith(
        acceptanceParams
      );
    });
  });


  /*
   * =======================================================
   * DELEGACIÓN DE VALIDACIONES LEGALES
   * =======================================================
   */

  describe('Delegación de validaciones de documentos legales', () => {

    const legalOperations = [
      {
        method: 'createOneUser',
        service: CreateOneUser,
        params: registerParams,
      },
      {
        method: 'registerLegalAcceptances',
        service: RegisterLegalAcceptances,
        params: acceptanceParams,
      },
    ];

    const invalidDocumentIds = [
      ['undefined', undefined],
      ['null', null],
      ['arreglo vacío', []],
      ['cadena', '12,35'],
      ['número', 12],
      ['objeto', {}],
      ['identificador negativo', [-1, 35]],
      ['identificador cero', [0, 35]],
      ['identificador decimal', [1.5, 35]],
      ['identificadores duplicados', [12, 12]],
      ['identificador como cadena', ['12', 35]],
    ];


    describe.each(legalOperations)(
      'método $method',
      ({
        method,
        service,
        params,
      }) => {

        test.each(invalidDocumentIds)(
          'delega y propaga el rechazo de documentos inválidos: %s',
          async (
            description,
            documentIds
          ) => {

            const error = {
              statusCode: 400,
              message: 'Documentos legales inválidos',
            };

            service.execute
              .mockRejectedValue(error);

            await expect(
              UserController[method]({
                ...params,
                documentoLegalIds: documentIds,
              })
            ).rejects.toBe(error);

            expect(
              service.execute
            ).toHaveBeenCalledWith({
              ...params,
              documentoLegalIds: documentIds,
            });

            expectOnlyServicesCalled([
              service,
            ]);
          }
        );
      }
    );
  });


  /*
   * =======================================================
   * PASSWORD RESET
   * =======================================================
   */

  describe('Recuperación de contraseña', () => {

    beforeEach(() => {

      GeneratePasswordResetLink.execute
        .mockResolvedValue(resetLink);

      SendPasswordResetEmail.execute
        .mockResolvedValue({
          success: true,
        });
    });


    test('genera el enlace y envía el correo de recuperación', async () => {

      await expect(
        UserController.sendPasswordResetEmail({
          email,
        })
      ).resolves.toEqual({
        message: 'Password reset email sent.',
      });

      expect(
        GeneratePasswordResetLink.execute
      ).toHaveBeenCalledWith({
        email,
      });

      expect(
        SendPasswordResetEmail.execute
      ).toHaveBeenCalledWith({
        email,
        resetLink,
      });

      expectOnlyServicesCalled([
        GeneratePasswordResetLink,
        SendPasswordResetEmail,
      ]);
    });


    test('genera el enlace antes de enviar el correo', async () => {

      await UserController
        .sendPasswordResetEmail({
          email,
        });

      const generateOrder =
        GeneratePasswordResetLink.execute
          .mock.invocationCallOrder[0];

      const sendOrder =
        SendPasswordResetEmail.execute
          .mock.invocationCallOrder[0];

      expect(generateOrder)
        .toBeLessThan(sendOrder);
    });


    test('espera la generación del enlace antes de enviar el correo', async () => {

      let resolveResetLink;

      GeneratePasswordResetLink.execute
        .mockImplementation(
          () => new Promise(resolve => {

            resolveResetLink = resolve;
          })
        );

      const operation =
        UserController.sendPasswordResetEmail({
          email,
        });

      expect(
        GeneratePasswordResetLink.execute
      ).toHaveBeenCalledTimes(1);

      expect(
        SendPasswordResetEmail.execute
      ).not.toHaveBeenCalled();

      resolveResetLink(resetLink);

      await expect(operation)
        .resolves.toEqual({
          message: 'Password reset email sent.',
        });

      expect(
        SendPasswordResetEmail.execute
      ).toHaveBeenCalledWith({
        email,
        resetLink,
      });
    });


    test('espera el envío del correo antes de devolver la respuesta', async () => {

      let resolveEmail;

      let notifyEmailStarted;

      const emailStarted = new Promise(
        resolve => {

          notifyEmailStarted = resolve;
        }
      );

      SendPasswordResetEmail.execute
        .mockImplementation(
          () => new Promise(resolve => {

            resolveEmail = resolve;

            notifyEmailStarted();
          })
        );

      let completed = false;

      const operation =
        UserController
          .sendPasswordResetEmail({
            email,
          })
          .then(result => {

            completed = true;

            return result;
          });

      await emailStarted;

      expect(completed).toBe(false);

      resolveEmail({
        success: true,
      });

      await expect(operation)
        .resolves.toEqual({
          message: 'Password reset email sent.',
        });

      expect(completed).toBe(true);
    });


    test('no devuelve el enlace de recuperación al cliente', async () => {

      const response =
        await UserController
          .sendPasswordResetEmail({
            email,
          });

      expect(response).toEqual({
        message: 'Password reset email sent.',
      });

      expect(response)
        .not.toHaveProperty('resetLink');

      expect(response)
        .not.toHaveProperty('email');

      expect(
        JSON.stringify(response)
      ).not.toContain(resetLink);
    });


    test('no utiliza un enlace de recuperación proporcionado por el cliente', async () => {

      await UserController
        .sendPasswordResetEmail({
          email,
          resetLink:
            'https://example.com/forged-link',
          firebaseUid,
          idToken,
          password: 'test-password',
        });

      expect(
        GeneratePasswordResetLink.execute
      ).toHaveBeenCalledWith({
        email,
      });

      expect(
        SendPasswordResetEmail.execute
      ).toHaveBeenCalledWith({
        email,
        resetLink,
      });
    });


    test('no devuelve información interna del proveedor de correo', async () => {

      SendPasswordResetEmail.execute
        .mockResolvedValue({
          MessageId: 'internal-message-id',
          RequestId: 'internal-request-id',
          resetLink,
        });

      await expect(
        UserController.sendPasswordResetEmail({
          email,
        })
      ).resolves.toEqual({
        message: 'Password reset email sent.',
      });
    });


    test('delega la ausencia del correo al servicio de generación del enlace', async () => {

      const error = {
        statusCode: 400,
        message: 'Correo requerido',
      };

      GeneratePasswordResetLink.execute
        .mockRejectedValue(error);

      await expect(
        UserController.sendPasswordResetEmail()
      ).rejects.toBe(error);

      expect(
        GeneratePasswordResetLink.execute
      ).toHaveBeenCalledWith({
        email: undefined,
      });

      expect(
        SendPasswordResetEmail.execute
      ).not.toHaveBeenCalled();
    });


    test.each([
      [400, 'Correo inválido'],
      [404, 'Usuario no registrado'],
      [500, 'Error interno'],
      [503, 'Servicio no disponible'],
    ])('propaga el error %i de generación del enlace sin enviar correo', async (
      statusCode,
      message
    ) => {

      const error = {
        statusCode,
        message,
      };

      GeneratePasswordResetLink.execute
        .mockRejectedValue(error);

      await expect(
        UserController.sendPasswordResetEmail({
          email,
        })
      ).rejects.toBe(error);

      expectOnlyServicesCalled([
        GeneratePasswordResetLink,
      ]);
    });


    test.each([
      [400, 'Parámetros inválidos'],
      [500, 'Error interno'],
      [503, 'Servicio no disponible'],
    ])('propaga el error %i durante el envío del correo', async (
      statusCode,
      message
    ) => {

      const error = {
        statusCode,
        message,
      };

      SendPasswordResetEmail.execute
        .mockRejectedValue(error);

      await expect(
        UserController.sendPasswordResetEmail({
          email,
        })
      ).rejects.toBe(error);

      expect(
        SendPasswordResetEmail.execute
      ).toHaveBeenCalledWith({
        email,
        resetLink,
      });

      expectOnlyServicesCalled([
        GeneratePasswordResetLink,
        SendPasswordResetEmail,
      ]);
    });


    test('propaga una excepción inesperada durante la generación del enlace', async () => {

      const error = new Error(
        'Unexpected Firebase error'
      );

      GeneratePasswordResetLink.execute
        .mockRejectedValue(error);

      await expect(
        UserController.sendPasswordResetEmail({
          email,
        })
      ).rejects.toBe(error);

      expect(
        SendPasswordResetEmail.execute
      ).not.toHaveBeenCalled();
    });


    test('propaga una excepción inesperada durante el envío del correo', async () => {

      const error = new Error(
        'Unexpected email provider error'
      );

      SendPasswordResetEmail.execute
        .mockRejectedValue(error);

      await expect(
        UserController.sendPasswordResetEmail({
          email,
        })
      ).rejects.toBe(error);

      expectOnlyServicesCalled([
        GeneratePasswordResetLink,
        SendPasswordResetEmail,
      ]);
    });
  });


  /*
   * =======================================================
   * CONTRATO DE DELEGACIÓN
   * =======================================================
   */

  describe('Consulta del perfil del usuario', () => {
    test('devuelve el perfil y transmite únicamente el UID autenticado', async () => {
      const response = [{ usuario_id: 10, avatar_id: 1 }];
      GetUserProfile.execute.mockResolvedValue(response);
      await expect(UserController.getUserProfile({
        firebaseUid, email, usuarioId: 99, documentoLegalIds, idToken,
      })).resolves.toBe(response);
      expect(GetUserProfile.execute).toHaveBeenCalledWith({ firebaseUid });
      expectOnlyServicesCalled([GetUserProfile]);
    });

    test('delega el UID ausente al servicio', async () => {
      await UserController.getUserProfile();
      expect(GetUserProfile.execute).toHaveBeenCalledWith({ firebaseUid: undefined });
      expectOnlyServicesCalled([GetUserProfile]);
    });

    test('conserva el UID sin normalizarlo', async () => {
      const uid = ' AbCdEf123 ';
      await UserController.getUserProfile({ firebaseUid: uid });
      expect(GetUserProfile.execute).toHaveBeenCalledWith({ firebaseUid: uid });
      expectOnlyServicesCalled([GetUserProfile]);
    });
  });

  describe('Contrato de delegación de servicios', () => {

    describe.each(delegatedOperations)(
      'método $method',
      ({
        method,
        service,
        params,
      }) => {

        test('conserva la referencia de la respuesta del servicio', async () => {

          const response = {
            success: true,
            data: {
              id: 25,
            },
          };

          service.execute
            .mockResolvedValue(response);

          await expect(
            UserController[method](params)
          ).resolves.toBe(response);

          expectOnlyServicesCalled([
            service,
          ]);
        });


        test('ejecuta únicamente el servicio correspondiente', async () => {

          service.execute
            .mockResolvedValue({
              success: true,
            });

          await UserController[method](
            params
          );

          expectOnlyServicesCalled([
            service,
          ]);
        });


        test.each([
          [400, 'Parámetros inválidos'],
          [401, 'Identidad no válida'],
          [403, 'Operación no permitida'],
          [404, 'Recurso no encontrado'],
          [409, 'Conflicto'],
          [500, 'Error interno'],
          [503, 'Servicio no disponible'],
        ])('propaga sin modificar el error controlado %i', async (
          statusCode,
          message
        ) => {

          const error = {
            statusCode,
            message,
          };

          service.execute
            .mockRejectedValue(error);

          await expect(
            UserController[method](params)
          ).rejects.toBe(error);

          expectOnlyServicesCalled([
            service,
          ]);
        });


        test('propaga una excepción inesperada del servicio', async () => {

          const error = new Error(
            'Unexpected service error'
          );

          service.execute
            .mockRejectedValue(error);

          await expect(
            UserController[method](params)
          ).rejects.toBe(error);

          expectOnlyServicesCalled([
            service,
          ]);
        });


        test('propaga una excepción síncrona del servicio', async () => {

          const error = new Error(
            'Synchronous service error'
          );

          service.execute
            .mockImplementation(() => {

              throw error;
            });

          await expect(
            UserController[method](params)
          ).rejects.toBe(error);

          expectOnlyServicesCalled([
            service,
          ]);
        });
      }
    );
  });
});