
jest.mock(
  '@user/services/user/LegalAcceptanceService',
  () => ({
    registerPendingAcceptances: jest.fn()
  })
);

const LegalAcceptanceService = require(
  '@user/services/user/LegalAcceptanceService'
);

const RegisterLegalAcceptances = require(
  '../../services/user/RegisterLegalAcceptances'
);

describe('RegisterLegalAcceptances', () => {

  const firebaseUid = 'AbCdEf123FirebaseUID';

  const documentoLegalIds = [12, 35];

  const successResponse = {
    success: true,
    aceptaciones_completas: true,
    documentos_pendientes: []
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('registers two pending legal documents successfully', async () => {
    LegalAcceptanceService.registerPendingAcceptances
      .mockResolvedValue(successResponse);

    const result =
      await RegisterLegalAcceptances.execute({
        firebaseUid,
        documentoLegalIds
      });

    expect(result).toEqual(successResponse);

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenCalledTimes(1);

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenCalledWith({
      firebaseUid,
      documentoLegalIds
    });
  });

  test('registers one pending legal document successfully', async () => {
    const documentIds = [35];

    LegalAcceptanceService.registerPendingAcceptances
      .mockResolvedValue(successResponse);

    const result =
      await RegisterLegalAcceptances.execute({
        firebaseUid,
        documentoLegalIds: documentIds
      });

    expect(result).toEqual(successResponse);

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenCalledWith({
      firebaseUid,
      documentoLegalIds: documentIds
    });
  });

  test('preserves uppercase and lowercase characters in Firebase UID', async () => {
    const originalUid = 'AbCdEf123XyZ';

    LegalAcceptanceService.registerPendingAcceptances
      .mockResolvedValue(successResponse);

    await RegisterLegalAcceptances.execute({
      firebaseUid: originalUid,
      documentoLegalIds
    });

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenCalledWith({
      firebaseUid: originalUid,
      documentoLegalIds
    });
  });

  test('preserves the original legal document identifiers and order', async () => {
    const documentIds = [52, 48];

    LegalAcceptanceService.registerPendingAcceptances
      .mockResolvedValue(successResponse);

    await RegisterLegalAcceptances.execute({
      firebaseUid,
      documentoLegalIds: documentIds
    });

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenCalledWith({
      firebaseUid,
      documentoLegalIds: [52, 48]
    });

    const forwardedParams =
      LegalAcceptanceService.registerPendingAcceptances
        .mock.calls[0][0];

    expect(forwardedParams.documentoLegalIds)
      .toBe(documentIds);

    expect(documentIds).toEqual([52, 48]);
  });

  test('does not forward unauthorized additional parameters', async () => {
    LegalAcceptanceService.registerPendingAcceptances
      .mockResolvedValue(successResponse);

    await RegisterLegalAcceptances.execute({
      firebaseUid,
      documentoLegalIds,
      email: 'other@example.com',
      usuarioId: 99,
      firebase_uid: 'OtherFirebaseUid',
      metodoAceptacion: 'tradicional',
      fechaAceptacion: '2026-11-24T21:32:35Z'
    });

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenCalledTimes(1);

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenCalledWith({
      firebaseUid,
      documentoLegalIds
    });
  });

  test('preserves the original service response', async () => {
    LegalAcceptanceService.registerPendingAcceptances
      .mockResolvedValue(successResponse);

    const result =
      await RegisterLegalAcceptances.execute({
        firebaseUid,
        documentoLegalIds
      });

    expect(result).toBe(successResponse);

    expect(Object.keys(result).sort()).toEqual([
      'aceptaciones_completas',
      'documentos_pendientes',
      'success'
    ]);
  });

  test('preserves successful responses for repeated acceptance requests', async () => {
    LegalAcceptanceService.registerPendingAcceptances
      .mockResolvedValue(successResponse);

    const params = {
      firebaseUid,
      documentoLegalIds
    };

    const firstResult =
      await RegisterLegalAcceptances.execute(params);

    const secondResult =
      await RegisterLegalAcceptances.execute(params);

    expect(firstResult).toEqual(successResponse);

    expect(secondResult).toEqual(successResponse);

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenCalledTimes(2);

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenNthCalledWith(1, params);

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenNthCalledWith(2, params);
  });

  test.each([
    [
      400,
      'Identificadores de documentos legales inválidos'
    ],
    [
      401,
      'Identidad Firebase inválida'
    ],
    [
      404,
      'Usuario no registrado'
    ],
    [
      409,
      'Los documentos legales vigentes han cambiado'
    ],
    [
      503,
      'Documentos legales obligatorios no disponibles'
    ]
  ])('propagates the service error with status %i', async (
    statusCode,
    message
  ) => {
    const error = {
      statusCode,
      message
    };

    LegalAcceptanceService.registerPendingAcceptances
      .mockRejectedValue(error);

    await expect(
      RegisterLegalAcceptances.execute({
        firebaseUid,
        documentoLegalIds
      })
    ).rejects.toBe(error);

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenCalledTimes(1);

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenCalledWith({
      firebaseUid,
      documentoLegalIds
    });
  });

  test('propagates unexpected database errors', async () => {
    const error = new Error(
      'Database connection error'
    );

    LegalAcceptanceService.registerPendingAcceptances
      .mockRejectedValue(error);

    await expect(
      RegisterLegalAcceptances.execute({
        firebaseUid,
        documentoLegalIds
      })
    ).rejects.toBe(error);

    expect(
      LegalAcceptanceService.registerPendingAcceptances
    ).toHaveBeenCalledTimes(1);
  });
});
