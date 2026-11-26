
jest.mock(
  '@user/services/user/LegalAcceptanceService',
  () => ({
    getPendingAcceptances: jest.fn()
  })
);

const LegalAcceptanceService = require(
  '@user/services/user/LegalAcceptanceService'
);

const GetPendingLegalAcceptances = require(
  '../../services/user/GetPendingLegalAcceptances'
);

describe('GetPendingLegalAcceptances', () => {

  const firebaseUid = 'AbCdEf123FirebaseUID';

  const pendingDocuments = [
    {
      documento_legal_id: 12,
      tipo: 'terminos_condiciones',
      version: '2.0.0',
      url: 'https://www.thecupcakelife.com/terminos/'
    },
    {
      documento_legal_id: 35,
      tipo: 'politica_privacidad',
      version: '2.0.0',
      url: 'https://www.thecupcakelife.com/privacidad/'
    }
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns complete acceptances when no documents are pending', async () => {
    const response = {
      success: true,
      aceptaciones_completas: true,
      documentos_pendientes: []
    };

    LegalAcceptanceService.getPendingAcceptances
      .mockResolvedValue(response);

    const result =
      await GetPendingLegalAcceptances.execute({
        firebaseUid
      });

    expect(result).toEqual(response);
  });

  test('returns one pending legal document', async () => {
    const response = {
      success: true,
      aceptaciones_completas: false,
      documentos_pendientes: [
        pendingDocuments[0]
      ]
    };

    LegalAcceptanceService.getPendingAcceptances
      .mockResolvedValue(response);

    const result =
      await GetPendingLegalAcceptances.execute({
        firebaseUid
      });

    expect(result).toEqual(response);

    expect(result.documentos_pendientes)
      .toHaveLength(1);
  });

  test('returns two pending legal documents', async () => {
    const response = {
      success: true,
      aceptaciones_completas: false,
      documentos_pendientes: pendingDocuments
    };

    LegalAcceptanceService.getPendingAcceptances
      .mockResolvedValue(response);

    const result =
      await GetPendingLegalAcceptances.execute({
        firebaseUid
      });

    expect(result).toEqual(response);

    expect(result.documentos_pendientes)
      .toHaveLength(2);
  });

  test('delegates the query using Firebase UID', async () => {
    LegalAcceptanceService.getPendingAcceptances
      .mockResolvedValue({
        success: true,
        aceptaciones_completas: true,
        documentos_pendientes: []
      });

    await GetPendingLegalAcceptances.execute({
      firebaseUid
    });

    expect(
      LegalAcceptanceService.getPendingAcceptances
    ).toHaveBeenCalledTimes(1);

    expect(
      LegalAcceptanceService.getPendingAcceptances
    ).toHaveBeenCalledWith({
      firebaseUid
    });
  });

  test('preserves uppercase and lowercase characters in Firebase UID', async () => {
    const originalUid = 'AbCdEf123XyZ';

    LegalAcceptanceService.getPendingAcceptances
      .mockResolvedValue({
        success: true,
        aceptaciones_completas: true,
        documentos_pendientes: []
      });

    await GetPendingLegalAcceptances.execute({
      firebaseUid: originalUid
    });

    expect(
      LegalAcceptanceService.getPendingAcceptances
    ).toHaveBeenCalledWith({
      firebaseUid: originalUid
    });
  });

  test('does not forward additional identity parameters', async () => {
    LegalAcceptanceService.getPendingAcceptances
      .mockResolvedValue({
        success: true,
        aceptaciones_completas: true,
        documentos_pendientes: []
      });

    await GetPendingLegalAcceptances.execute({
      firebaseUid,
      email: 'other@example.com',
      usuarioId: 99,
      firebase_uid: 'OtherFirebaseUid'
    });

    expect(
      LegalAcceptanceService.getPendingAcceptances
    ).toHaveBeenCalledWith({
      firebaseUid
    });
  });

  test('preserves the original service response', async () => {
    const response = {
      success: true,
      aceptaciones_completas: false,
      documentos_pendientes: pendingDocuments
    };

    LegalAcceptanceService.getPendingAcceptances
      .mockResolvedValue(response);

    const result =
      await GetPendingLegalAcceptances.execute({
        firebaseUid
      });

    expect(result).toBe(response);

    expect(Object.keys(result).sort()).toEqual([
      'aceptaciones_completas',
      'documentos_pendientes',
      'success'
    ]);
  });

  test.each([
    401,
    404,
    503
  ])('propagates the service error with status %i', async (
    statusCode
  ) => {
    const error = {
      statusCode,
      message: 'Legal acceptance service error'
    };

    LegalAcceptanceService.getPendingAcceptances
      .mockRejectedValue(error);

    await expect(
      GetPendingLegalAcceptances.execute({
        firebaseUid
      })
    ).rejects.toBe(error);

    expect(
      LegalAcceptanceService.getPendingAcceptances
    ).toHaveBeenCalledTimes(1);

    expect(
      LegalAcceptanceService.getPendingAcceptances
    ).toHaveBeenCalledWith({
      firebaseUid
    });
  });

  test('propagates unexpected database errors', async () => {
    const error = new Error(
      'Database connection error'
    );

    LegalAcceptanceService.getPendingAcceptances
      .mockRejectedValue(error);

    await expect(
      GetPendingLegalAcceptances.execute({
        firebaseUid
      })
    ).rejects.toBe(error);
  });
});
