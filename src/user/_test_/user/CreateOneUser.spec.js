
jest.mock('@db/db', () => ({
  tx: jest.fn()
}));

jest.mock('@user/repositories/index', () => {
  const mockCreate = jest.fn();
  const mockGetByFirebaseUid = jest.fn();

  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      create: mockCreate,
      getByFirebaseUid: mockGetByFirebaseUid
    })),
    __mocks__: {
      mockCreate,
      mockGetByFirebaseUid
    }
  };
});

jest.mock(
  '@user/services/user/LegalAcceptanceService',
  () => ({
    validateRegistrationDocuments: jest.fn(),
    registerInitialAcceptances: jest.fn()
  })
);

const db = require('@db/db');

const {
  UserRepository,
  __mocks__
} = require('@user/repositories/index');

const LegalAcceptanceService = require(
  '@user/services/user/LegalAcceptanceService'
);

const CreateOneUser = require(
  '../../services/user/CreateOneUser'
);

describe('CreateOneUser Service', () => {

  const transaction = {};

  const firebaseUid = 'AbCdEf123FirebaseUID';

  const documentoLegalIds = [12, 35];

  const validParams = {
    nombre: 'Juan Perez',
    email: 'a@a.com',
    firebaseUid,
    pais: 'PER',
    documentoLegalIds
  };

  const createdUser = [
    {
      usuario_id: 10
    }
  ];

  const retrievedUser = [
    {
      usuario_id: 10,
      primer_nombre: 'Juan',
      segundo_nombre: 'Perez',
      email: 'a@a.com',
      pais: 'PER',
      avatar_id: 1,
      avatar_nombre: 'Avatar',
      avatar_url: 'avatar.png'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    db.tx.mockReset();

    __mocks__.mockCreate.mockReset();

    __mocks__.mockGetByFirebaseUid.mockReset();

    LegalAcceptanceService.validateRegistrationDocuments
      .mockReset();

    LegalAcceptanceService.registerInitialAcceptances
      .mockReset();

    db.tx.mockImplementation(async callback => {
      return callback(transaction);
    });

    __mocks__.mockCreate
      .mockResolvedValue(createdUser);

    __mocks__.mockGetByFirebaseUid
      .mockResolvedValue(retrievedUser);

    LegalAcceptanceService.validateRegistrationDocuments
      .mockResolvedValue(undefined);

    LegalAcceptanceService.registerInitialAcceptances
      .mockResolvedValue(undefined);
  });

  describe('Validaciones existentes readaptadas', () => {

    test('crea y devuelve usuario', async () => {
      const result =
        await CreateOneUser.execute(validParams);

      expect(UserRepository)
        .toHaveBeenCalledTimes(1);

      expect(db.tx)
        .toHaveBeenCalledTimes(1);

      expect(
        LegalAcceptanceService.validateRegistrationDocuments
      ).toHaveBeenCalledWith({
        documentoLegalIds,
        transaction
      });

      expect(__mocks__.mockCreate)
        .toHaveBeenCalledWith({
          nombre: 'Juan Perez',
          email: 'a@a.com',
          firebaseUid,
          pais: 'PER',
          transaction
        });

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).toHaveBeenCalledWith({
        usuarioId: 10,
        documentoLegalIds,
        metodoAceptacion: 'tradicional',
        transaction
      });

      expect(__mocks__.mockGetByFirebaseUid)
        .toHaveBeenCalledWith({
          firebaseUid,
          transaction
        });

      expect(result).toEqual(retrievedUser);
    });

    test('lanza error si no encuentra usuario creado', async () => {
      __mocks__.mockGetByFirebaseUid
        .mockResolvedValue([]);

      await expect(
        CreateOneUser.execute(validParams)
      ).rejects.toThrow('Error creating the user');

      expect(__mocks__.mockCreate)
        .toHaveBeenCalledTimes(1);

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).toHaveBeenCalledTimes(1);

      expect(__mocks__.mockGetByFirebaseUid)
        .toHaveBeenCalledWith({
          firebaseUid,
          transaction
        });
    });

    test('lanza error si falla create', async () => {
      __mocks__.mockCreate
        .mockRejectedValue(new Error('db error'));

      await expect(
        CreateOneUser.execute(validParams)
      ).rejects.toThrow('Error creating the user');

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).not.toHaveBeenCalled();

      expect(__mocks__.mockGetByFirebaseUid)
        .not.toHaveBeenCalled();
    });
  });

  describe('Registro tradicional exitoso', () => {

    test('utiliza PER como país predeterminado', async () => {
      const {
        pais,
        ...params
      } = validParams;

      await CreateOneUser.execute(params);

      expect(__mocks__.mockCreate)
        .toHaveBeenCalledWith({
          nombre: params.nombre,
          email: params.email,
          firebaseUid,
          pais: 'PER',
          transaction
        });
    });

    test('conserva el país proporcionado', async () => {
      await CreateOneUser.execute({
        ...validParams,
        pais: 'VEN'
      });

      expect(__mocks__.mockCreate)
        .toHaveBeenCalledWith({
          nombre: validParams.nombre,
          email: validParams.email,
          firebaseUid,
          pais: 'VEN',
          transaction
        });
    });

    test('conserva mayúsculas y minúsculas del Firebase UID', async () => {
      const originalUid = 'AbCdEf123XyZ';

      await CreateOneUser.execute({
        ...validParams,
        firebaseUid: originalUid
      });

      expect(__mocks__.mockCreate)
        .toHaveBeenCalledWith({
          nombre: validParams.nombre,
          email: validParams.email,
          firebaseUid: originalUid,
          pais: validParams.pais,
          transaction
        });

      expect(__mocks__.mockGetByFirebaseUid)
        .toHaveBeenCalledWith({
          firebaseUid: originalUid,
          transaction
        });
    });

    test('acepta un Firebase UID de 128 caracteres', async () => {
      const maximumUid = 'A'.repeat(128);

      await expect(
        CreateOneUser.execute({
          ...validParams,
          firebaseUid: maximumUid
        })
      ).resolves.toEqual(retrievedUser);

      expect(__mocks__.mockGetByFirebaseUid)
        .toHaveBeenCalledWith({
          firebaseUid: maximumUid,
          transaction
        });
    });

    test('utiliza los identificadores legales proporcionados', async () => {
      const updatedDocumentIds = [48, 52];

      await CreateOneUser.execute({
        ...validParams,
        documentoLegalIds: updatedDocumentIds
      });

      expect(
        LegalAcceptanceService.validateRegistrationDocuments
      ).toHaveBeenCalledWith({
        documentoLegalIds: updatedDocumentIds,
        transaction
      });

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).toHaveBeenCalledWith({
        usuarioId: 10,
        documentoLegalIds: updatedDocumentIds,
        metodoAceptacion: 'tradicional',
        transaction
      });
    });

    test('utiliza el identificador del usuario recién creado', async () => {
      __mocks__.mockCreate.mockResolvedValue([
        {
          usuario_id: 75
        }
      ]);

      await CreateOneUser.execute(validParams);

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).toHaveBeenCalledWith({
        usuarioId: 75,
        documentoLegalIds,
        metodoAceptacion: 'tradicional',
        transaction
      });
    });

    test('no permite sobrescribir el método de aceptación', async () => {
      await CreateOneUser.execute({
        ...validParams,
        metodoAceptacion: 'google',
        usuarioId: 99,
        fechaAceptacion: '2026-11-24T21:32:35Z'
      });

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).toHaveBeenCalledWith({
        usuarioId: 10,
        documentoLegalIds,
        metodoAceptacion: 'tradicional',
        transaction
      });
    });

    test('conserva el contrato de respuesta como array', async () => {
      const result =
        await CreateOneUser.execute(validParams);

      expect(Array.isArray(result)).toBe(true);

      expect(result).toBe(retrievedUser);
    });
  });

  describe('Validación de Firebase UID', () => {

    test.each([
      ['undefined', undefined],
      ['null', null],
      ['cadena vacía', ''],
      ['espacios en blanco', '   '],
      ['número', 12345],
      ['booleano', true],
      ['objeto', {}],
      ['más de 128 caracteres', 'A'.repeat(129)]
    ])('rechaza Firebase UID inválido: %s', async (
      description,
      invalidUid
    ) => {
      await expect(
        CreateOneUser.execute({
          ...validParams,
          firebaseUid: invalidUid
        })
      ).rejects.toEqual({
        statusCode: 401,
        message: 'Identidad de usuario no válida'
      });

      expect(db.tx).not.toHaveBeenCalled();

      expect(
        LegalAcceptanceService.validateRegistrationDocuments
      ).not.toHaveBeenCalled();

      expect(__mocks__.mockCreate)
        .not.toHaveBeenCalled();

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).not.toHaveBeenCalled();

      expect(__mocks__.mockGetByFirebaseUid)
        .not.toHaveBeenCalled();
    });
  });

  describe('Validación de documentos legales', () => {

    test.each([
      400,
      409,
      503
    ])('propaga el error legal %i antes de crear el usuario', async (
      statusCode
    ) => {
      const error = {
        statusCode,
        message: 'Error de validación legal'
      };

      LegalAcceptanceService.validateRegistrationDocuments
        .mockRejectedValue(error);

      await expect(
        CreateOneUser.execute(validParams)
      ).rejects.toBe(error);

      expect(db.tx)
        .toHaveBeenCalledTimes(1);

      expect(__mocks__.mockCreate)
        .not.toHaveBeenCalled();

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).not.toHaveBeenCalled();

      expect(__mocks__.mockGetByFirebaseUid)
        .not.toHaveBeenCalled();
    });

    test('devuelve un error genérico ante un fallo inesperado de validación', async () => {
      LegalAcceptanceService.validateRegistrationDocuments
        .mockRejectedValue(
          new Error('Internal database error')
        );

      await expect(
        CreateOneUser.execute(validParams)
      ).rejects.toThrow('Error creating the user');

      expect(__mocks__.mockCreate)
        .not.toHaveBeenCalled();
    });
  });

  describe('Conflictos durante el registro', () => {

    test('rechaza la creación cuando el correo o UID ya están registrados', async () => {
      __mocks__.mockCreate
        .mockResolvedValue([]);

      await expect(
        CreateOneUser.execute(validParams)
      ).rejects.toEqual({
        statusCode: 409,
        message: 'El correo ya se encuentra registrado'
      });

      expect(__mocks__.mockCreate)
        .toHaveBeenCalledTimes(1);

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).not.toHaveBeenCalled();

      expect(__mocks__.mockGetByFirebaseUid)
        .not.toHaveBeenCalled();
    });
  });

  describe('Registro de aceptaciones iniciales', () => {

    test.each([
      400,
      401,
      409,
      503
    ])('propaga el error controlado %i durante las aceptaciones', async (
      statusCode
    ) => {
      const error = {
        statusCode,
        message: 'Error registrando aceptaciones legales'
      };

      LegalAcceptanceService.registerInitialAcceptances
        .mockRejectedValue(error);

      await expect(
        CreateOneUser.execute(validParams)
      ).rejects.toBe(error);

      expect(__mocks__.mockCreate)
        .toHaveBeenCalledTimes(1);

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).toHaveBeenCalledTimes(1);

      expect(__mocks__.mockGetByFirebaseUid)
        .not.toHaveBeenCalled();
    });

    test('devuelve un error genérico si falla la inserción de aceptaciones', async () => {
      LegalAcceptanceService.registerInitialAcceptances
        .mockRejectedValue(
          new Error('Acceptance insert failed')
        );

      await expect(
        CreateOneUser.execute(validParams)
      ).rejects.toThrow('Error creating the user');

      expect(__mocks__.mockGetByFirebaseUid)
        .not.toHaveBeenCalled();
    });
  });

  describe('Transacciones y manejo de errores', () => {

    test('utiliza la misma transacción en todas las operaciones', async () => {
      await CreateOneUser.execute(validParams);

      const validationParams =
        LegalAcceptanceService.validateRegistrationDocuments
          .mock.calls[0][0];

      const creationParams =
        __mocks__.mockCreate.mock.calls[0][0];

      const acceptanceParams =
        LegalAcceptanceService.registerInitialAcceptances
          .mock.calls[0][0];

      const retrievalParams =
        __mocks__.mockGetByFirebaseUid.mock.calls[0][0];

      expect(validationParams.transaction)
        .toBe(transaction);

      expect(creationParams.transaction)
        .toBe(transaction);

      expect(acceptanceParams.transaction)
        .toBe(transaction);

      expect(retrievalParams.transaction)
        .toBe(transaction);

      expect(db.tx)
        .toHaveBeenCalledTimes(1);
    });

    test('ejecuta las operaciones en el orden correcto', async () => {
      await CreateOneUser.execute(validParams);

      const validationOrder =
        LegalAcceptanceService.validateRegistrationDocuments
          .mock.invocationCallOrder[0];

      const creationOrder =
        __mocks__.mockCreate
          .mock.invocationCallOrder[0];

      const acceptanceOrder =
        LegalAcceptanceService.registerInitialAcceptances
          .mock.invocationCallOrder[0];

      const retrievalOrder =
        __mocks__.mockGetByFirebaseUid
          .mock.invocationCallOrder[0];

      expect(validationOrder)
        .toBeLessThan(creationOrder);

      expect(creationOrder)
        .toBeLessThan(acceptanceOrder);

      expect(acceptanceOrder)
        .toBeLessThan(retrievalOrder);
    });

    test('lanza un error genérico si falla la transacción', async () => {
      db.tx.mockRejectedValue(
        new Error('Transaction failed')
      );

      await expect(
        CreateOneUser.execute(validParams)
      ).rejects.toThrow('Error creating the user');

      expect(__mocks__.mockCreate)
        .not.toHaveBeenCalled();

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).not.toHaveBeenCalled();

      expect(__mocks__.mockGetByFirebaseUid)
        .not.toHaveBeenCalled();
    });

    test('lanza un error genérico si falla la recuperación del usuario', async () => {
      __mocks__.mockGetByFirebaseUid
        .mockRejectedValue(
          new Error('User retrieval failed')
        );

      await expect(
        CreateOneUser.execute(validParams)
      ).rejects.toThrow('Error creating the user');

      expect(
        LegalAcceptanceService.registerInitialAcceptances
      ).toHaveBeenCalledTimes(1);
    });

    test('no expone errores internos de PostgreSQL', async () => {
      const internalError = new Error(
        'Internal PostgreSQL connection details'
      );

      __mocks__.mockCreate
        .mockRejectedValue(internalError);

      await expect(
        CreateOneUser.execute(validParams)
      ).rejects.toThrow(/^Error creating the user$/);
    });
  });
});
