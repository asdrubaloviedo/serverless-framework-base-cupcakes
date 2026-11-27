
jest.mock(
  '@user/services/user/LegalAcceptanceService',
  () => ({
    getActiveDocuments: jest.fn()
  })
);

const LegalAcceptanceService = require(
  '@user/services/user/LegalAcceptanceService'
);

const GetActiveLegalDocuments = require(
  '../../services/user/GetActiveLegalDocuments'
);

describe('GetActiveLegalDocuments', () => {

  const activeDocuments = [
    {
      documento_legal_id: 12,
      tipo: 'terminos_condiciones',
      version: '1.0.0',
      url: 'https://thecupcakelife.com/terminos/',
      vigente: true
    },
    {
      documento_legal_id: 35,
      tipo: 'politica_privacidad',
      version: '1.0.0',
      url: 'https://thecupcakelife.com/privacidad/',
      vigente: true
    }
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns the active legal documents successfully', async () => {
    LegalAcceptanceService.getActiveDocuments
      .mockResolvedValue(activeDocuments);

    const result =
      await GetActiveLegalDocuments.execute();

    expect(result).toEqual({
      success: true,
      documentos: activeDocuments
    });
  });

  test('delegates the query to LegalAcceptanceService', async () => {
    LegalAcceptanceService.getActiveDocuments
      .mockResolvedValue(activeDocuments);

    await GetActiveLegalDocuments.execute();

    expect(
      LegalAcceptanceService.getActiveDocuments
    ).toHaveBeenCalledTimes(1);

    expect(
      LegalAcceptanceService.getActiveDocuments
    ).toHaveBeenCalledWith();
  });

  test('preserves the original document information', async () => {
    LegalAcceptanceService.getActiveDocuments
      .mockResolvedValue(activeDocuments);

    const result =
      await GetActiveLegalDocuments.execute();

    expect(result.documentos).toBe(
      activeDocuments
    );

    expect(result.documentos).toHaveLength(2);

    expect(result.documentos[0]).toEqual(
      activeDocuments[0]
    );

    expect(result.documentos[1]).toEqual(
      activeDocuments[1]
    );
  });

  test('returns updated document identifiers and versions', async () => {
    const updatedDocuments = [
      {
        documento_legal_id: 48,
        tipo: 'terminos_condiciones',
        version: '2.0.0',
        url: 'https://thecupcakelife.com/terminos/',
        vigente: true
      },
      {
        documento_legal_id: 52,
        tipo: 'politica_privacidad',
        version: '2.1.0',
        url: 'https://thecupcakelife.com/privacidad/',
        vigente: true
      }
    ];

    LegalAcceptanceService.getActiveDocuments
      .mockResolvedValue(updatedDocuments);

    const result =
      await GetActiveLegalDocuments.execute();

    expect(result).toEqual({
      success: true,
      documentos: updatedDocuments
    });
  });

  test('preserves the public response contract', async () => {
    LegalAcceptanceService.getActiveDocuments
      .mockResolvedValue(activeDocuments);

    const result =
      await GetActiveLegalDocuments.execute();

    expect(Object.keys(result).sort()).toEqual([
      'documentos',
      'success'
    ]);

    expect(result.success).toBe(true);

    expect(Array.isArray(result.documentos))
      .toBe(true);
  });

  test('propagates the error when mandatory legal documents are unavailable', async () => {
    const error = {
      statusCode: 503,
      message: 'Documentos legales obligatorios no disponibles'
    };

    LegalAcceptanceService.getActiveDocuments
      .mockRejectedValue(error);

    await expect(
      GetActiveLegalDocuments.execute()
    ).rejects.toBe(error);

    expect(
      LegalAcceptanceService.getActiveDocuments
    ).toHaveBeenCalledTimes(1);
  });

  test('propagates unexpected database errors', async () => {
    const error = new Error(
      'Database connection error'
    );

    LegalAcceptanceService.getActiveDocuments
      .mockRejectedValue(error);

    await expect(
      GetActiveLegalDocuments.execute()
    ).rejects.toBe(error);
  });
});
