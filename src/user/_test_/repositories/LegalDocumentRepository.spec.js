
jest.mock('@user/models/legal', () => ({
  LegalDocumentModel: {
    get: jest.fn()
  }
}));

const {
  LegalDocumentModel
} = require('@user/models/legal');

const LegalDocumentRepository = require(
  '../../repositories/LegalDocumentRepository'
);

describe('LegalDocumentRepository', () => {

  let repository;

  const activeDocuments = [
    {
      documento_legal_id: 1,
      tipo: 'terminos_condiciones',
      version: '1.0.0',
      url: 'https://www.thecupcakelife.com/terminos/',
      vigente: true
    },
    {
      documento_legal_id: 2,
      tipo: 'politica_privacidad',
      version: '1.0.0',
      url: 'https://www.thecupcakelife.com/privacidad/',
      vigente: true
    }
  ];

  const normalizeSql = (query) =>
    query.replace(/\s+/g, ' ').trim();

  beforeEach(() => {
    jest.resetAllMocks();

    repository = new LegalDocumentRepository();
  });

  describe('getActive', () => {

    test('returns active legal documents', async () => {
      LegalDocumentModel.get.mockResolvedValue(
        activeDocuments
      );

      const result = await repository.getActive();

      expect(LegalDocumentModel.get)
        .toHaveBeenCalledTimes(1);

      expect(LegalDocumentModel.get)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [],
          transaction: undefined
        });

      expect(result).toEqual(activeDocuments);
    });

    test('selects only active legal documents', async () => {
      LegalDocumentModel.get.mockResolvedValue(
        activeDocuments
      );

      await repository.getActive();

      const { query } =
        LegalDocumentModel.get.mock.calls[0][0];

      const sql = normalizeSql(query);

      expect(sql).toContain(
        'FROM documentos_legales'
      );

      expect(sql).toContain(
        'WHERE vigente = TRUE'
      );

      expect(sql).toContain(
        'SELECT documento_legal_id, tipo, version, url, vigente'
      );

      expect(sql).toContain(
        'ORDER BY documento_legal_id'
      );
    });

    test('does not apply FOR SHARE by default', async () => {
      LegalDocumentModel.get.mockResolvedValue(
        activeDocuments
      );

      await repository.getActive();

      const { query } =
        LegalDocumentModel.get.mock.calls[0][0];

      expect(normalizeSql(query))
        .not.toContain('FOR SHARE');
    });

    test('does not apply FOR SHARE when lock is false', async () => {
      LegalDocumentModel.get.mockResolvedValue(
        activeDocuments
      );

      await repository.getActive({
        lock: false
      });

      const { query } =
        LegalDocumentModel.get.mock.calls[0][0];

      expect(normalizeSql(query))
        .not.toContain('FOR SHARE');
    });

    test('passes the transaction to the model', async () => {
      const transaction = {
        query: jest.fn()
      };

      LegalDocumentModel.get.mockResolvedValue(
        activeDocuments
      );

      const result = await repository.getActive({
        transaction
      });

      expect(LegalDocumentModel.get)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [],
          transaction
        });

      expect(result).toEqual(activeDocuments);
    });

    test('applies FOR SHARE when lock is true', async () => {
      const transaction = {
        query: jest.fn()
      };

      LegalDocumentModel.get.mockResolvedValue(
        activeDocuments
      );

      const result = await repository.getActive({
        transaction,
        lock: true
      });

      expect(LegalDocumentModel.get)
        .toHaveBeenCalledTimes(1);

      const {
        query,
        params,
        transaction: receivedTransaction
      } = LegalDocumentModel.get.mock.calls[0][0];

      expect(normalizeSql(query)).toContain(
        'ORDER BY documento_legal_id FOR SHARE;'
      );

      expect(params).toEqual([]);

      expect(receivedTransaction).toBe(
        transaction
      );

      expect(result).toEqual(activeDocuments);
    });

    test('returns an empty array when no active documents exist', async () => {
      LegalDocumentModel.get.mockResolvedValue([]);

      const result = await repository.getActive();

      expect(result).toEqual([]);

      expect(LegalDocumentModel.get)
        .toHaveBeenCalledTimes(1);
    });

    test('propagates database errors', async () => {
      const error = new Error(
        'Database error'
      );

      LegalDocumentModel.get.mockRejectedValue(
        error
      );

      await expect(
        repository.getActive()
      ).rejects.toBe(error);
    });
  });

  describe('getPendingByUserId', () => {

    const usuarioId = 10;

    const pendingDocuments = [
      {
        documento_legal_id: 2,
        tipo: 'politica_privacidad',
        version: '1.0.0',
        url: 'https://www.thecupcakelife.com/privacidad/'
      }
    ];

    test('returns pending legal documents for the user', async () => {
      LegalDocumentModel.get.mockResolvedValue(
        pendingDocuments
      );

      const result =
        await repository.getPendingByUserId({
          usuarioId
        });

      expect(LegalDocumentModel.get)
        .toHaveBeenCalledTimes(1);

      expect(LegalDocumentModel.get)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [usuarioId],
          transaction: undefined
        });

      expect(result).toEqual(pendingDocuments);
    });

    test('selects only active documents not accepted by the user', async () => {
      LegalDocumentModel.get.mockResolvedValue(
        pendingDocuments
      );

      await repository.getPendingByUserId({
        usuarioId
      });

      const { query, params } =
        LegalDocumentModel.get.mock.calls[0][0];

      const sql = normalizeSql(query);

      expect(sql).toContain(
        'SELECT dl.documento_legal_id, dl.tipo, dl.version, dl.url'
      );

      expect(sql).toContain(
        'FROM documentos_legales dl'
      );

      expect(sql).toContain(
        'WHERE dl.vigente = TRUE'
      );

      expect(sql).toContain(
        'AND NOT EXISTS ('
      );

      expect(sql).toContain(
        'FROM usuario_aceptaciones_legales ual'
      );

      expect(sql).toContain(
        'ual.documento_legal_id = dl.documento_legal_id'
      );

      expect(sql).toContain(
        'AND ual.usuario_id = $1'
      );

      expect(sql).toContain(
        'ORDER BY dl.documento_legal_id'
      );

      expect(params).toEqual([usuarioId]);
    });

    test('uses parameterized queries for different users', async () => {
      LegalDocumentModel.get.mockResolvedValue([]);

      await repository.getPendingByUserId({
        usuarioId: 10
      });

      await repository.getPendingByUserId({
        usuarioId: 20
      });

      expect(LegalDocumentModel.get)
        .toHaveBeenCalledTimes(2);

      const firstCall =
        LegalDocumentModel.get.mock.calls[0][0];

      const secondCall =
        LegalDocumentModel.get.mock.calls[1][0];

      expect(firstCall.query).toBe(
        secondCall.query
      );

      expect(firstCall.params).toEqual([10]);

      expect(secondCall.params).toEqual([20]);

      expect(normalizeSql(firstCall.query))
        .toContain('ual.usuario_id = $1');
    });

    test('passes the transaction to the model', async () => {
      const transaction = {
        query: jest.fn()
      };

      LegalDocumentModel.get.mockResolvedValue(
        pendingDocuments
      );

      const result =
        await repository.getPendingByUserId({
          usuarioId,
          transaction
        });

      expect(LegalDocumentModel.get)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [usuarioId],
          transaction
        });

      expect(result).toEqual(pendingDocuments);
    });

    test('returns an empty array when all documents are accepted', async () => {
      LegalDocumentModel.get.mockResolvedValue([]);

      const result =
        await repository.getPendingByUserId({
          usuarioId
        });

      expect(result).toEqual([]);

      expect(LegalDocumentModel.get)
        .toHaveBeenCalledTimes(1);
    });

    test('propagates database errors', async () => {
      const error = new Error(
        'Database error'
      );

      LegalDocumentModel.get.mockRejectedValue(
        error
      );

      await expect(
        repository.getPendingByUserId({
          usuarioId
        })
      ).rejects.toBe(error);
    });

    test('propagates errors when using a transaction', async () => {
      const transaction = {
        query: jest.fn()
      };

      const error = new Error(
        'Transaction error'
      );

      LegalDocumentModel.get.mockRejectedValue(
        error
      );

      await expect(
        repository.getPendingByUserId({
          usuarioId,
          transaction
        })
      ).rejects.toBe(error);

      expect(LegalDocumentModel.get)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [usuarioId],
          transaction
        });
    });
  });
});
