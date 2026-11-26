
jest.mock('@user/models/legal', () => ({
  UserLegalAcceptanceModel: {
    create: jest.fn(),
    get: jest.fn()
  }
}));

const {
  UserLegalAcceptanceModel
} = require('@user/models/legal');

const UserLegalAcceptanceRepository = require(
  '../../repositories/UserLegalAcceptanceRepository'
);

describe('UserLegalAcceptanceRepository', () => {

  let repository;

  const usuarioId = 10;

  const documentoLegalId = 1;

  const fechaAceptacion = new Date(
    '2026-11-24T21:32:35.000Z'
  );

  const acceptance = {
    usuario_aceptacion_legal_id: 1,
    usuario_id: usuarioId,
    documento_legal_id: documentoLegalId,
    fecha_aceptacion: fechaAceptacion,
    metodo_aceptacion: 'tradicional'
  };

  const normalizeSql = (query) =>
    query.replace(/\s+/g, ' ').trim();

  beforeEach(() => {
    jest.resetAllMocks();

    repository = new UserLegalAcceptanceRepository();
  });

  describe('create', () => {

    test('registers a legal acceptance', async () => {
      UserLegalAcceptanceModel.create.mockResolvedValue([
        acceptance
      ]);

      const result = await repository.create({
        usuarioId,
        documentoLegalId,
        metodoAceptacion: 'tradicional'
      });

      expect(UserLegalAcceptanceModel.create)
        .toHaveBeenCalledTimes(1);

      expect(UserLegalAcceptanceModel.create)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [
            usuarioId,
            documentoLegalId,
            'tradicional'
          ],
          transaction: undefined
        });

      expect(result).toEqual([acceptance]);
    });

    test('builds the correct INSERT query', async () => {
      UserLegalAcceptanceModel.create.mockResolvedValue([
        acceptance
      ]);

      await repository.create({
        usuarioId,
        documentoLegalId,
        metodoAceptacion: 'tradicional'
      });

      const { query, params } =
        UserLegalAcceptanceModel.create.mock.calls[0][0];

      const sql = normalizeSql(query);

      expect(sql).toContain(
        'INSERT INTO usuario_aceptaciones_legales'
      );

      expect(sql).toContain(
        '( usuario_id, documento_legal_id, metodo_aceptacion )'
      );

      expect(sql).toContain(
        'VALUES ($1, $2, $3)'
      );

      expect(params).toEqual([
        usuarioId,
        documentoLegalId,
        'tradicional'
      ]);
    });

    test('uses ON CONFLICT DO NOTHING to prevent duplicates', async () => {
      UserLegalAcceptanceModel.create.mockResolvedValue([]);

      await repository.create({
        usuarioId,
        documentoLegalId,
        metodoAceptacion: 'actualizacion'
      });

      const { query } =
        UserLegalAcceptanceModel.create.mock.calls[0][0];

      const sql = normalizeSql(query);

      expect(sql).toContain(
        'ON CONFLICT ( usuario_id, documento_legal_id ) DO NOTHING'
      );

      expect(sql).not.toContain(
        'DO UPDATE'
      );
    });

    test('returns the registered acceptance fields', async () => {
      UserLegalAcceptanceModel.create.mockResolvedValue([
        acceptance
      ]);

      const result = await repository.create({
        usuarioId,
        documentoLegalId,
        metodoAceptacion: 'tradicional'
      });

      const { query } =
        UserLegalAcceptanceModel.create.mock.calls[0][0];

      const sql = normalizeSql(query);

      expect(sql).toContain(
        'RETURNING usuario_aceptacion_legal_id, usuario_id, documento_legal_id, fecha_aceptacion, metodo_aceptacion'
      );

      expect(result).toEqual([acceptance]);

      expect(result[0].fecha_aceptacion)
        .toEqual(fechaAceptacion);
    });

    test.each([
      'tradicional',
      'google',
      'actualizacion'
    ])('passes the acceptance method %s to the model', async (
      metodoAceptacion
    ) => {
      const rows = [
        {
          ...acceptance,
          metodo_aceptacion: metodoAceptacion
        }
      ];

      UserLegalAcceptanceModel.create.mockResolvedValue(
        rows
      );

      const result = await repository.create({
        usuarioId,
        documentoLegalId,
        metodoAceptacion
      });

      expect(UserLegalAcceptanceModel.create)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [
            usuarioId,
            documentoLegalId,
            metodoAceptacion
          ],
          transaction: undefined
        });

      expect(result).toEqual(rows);
    });

    test('passes the transaction to the model', async () => {
      const transaction = {
        query: jest.fn()
      };

      UserLegalAcceptanceModel.create.mockResolvedValue([
        acceptance
      ]);

      const result = await repository.create({
        usuarioId,
        documentoLegalId,
        metodoAceptacion: 'tradicional',
        transaction
      });

      expect(UserLegalAcceptanceModel.create)
        .toHaveBeenCalledTimes(1);

      expect(UserLegalAcceptanceModel.create)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [
            usuarioId,
            documentoLegalId,
            'tradicional'
          ],
          transaction
        });

      expect(
        UserLegalAcceptanceModel.create.mock.calls[0][0]
          .transaction
      ).toBe(transaction);

      expect(result).toEqual([acceptance]);
    });

    test('returns empty rows when the acceptance already exists', async () => {
      const transaction = {
        query: jest.fn()
      };

      UserLegalAcceptanceModel.create.mockResolvedValue([]);

      const result = await repository.create({
        usuarioId,
        documentoLegalId,
        metodoAceptacion: 'actualizacion',
        transaction
      });

      expect(result).toEqual([]);

      expect(UserLegalAcceptanceModel.create)
        .toHaveBeenCalledTimes(1);

      expect(UserLegalAcceptanceModel.create)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [
            usuarioId,
            documentoLegalId,
            'actualizacion'
          ],
          transaction
        });
    });

    test('uses parameterized queries for different users and documents', async () => {
      UserLegalAcceptanceModel.create.mockResolvedValue([]);

      await repository.create({
        usuarioId: 10,
        documentoLegalId: 1,
        metodoAceptacion: 'tradicional'
      });

      await repository.create({
        usuarioId: 20,
        documentoLegalId: 2,
        metodoAceptacion: 'google'
      });

      expect(UserLegalAcceptanceModel.create)
        .toHaveBeenCalledTimes(2);

      const firstCall =
        UserLegalAcceptanceModel.create.mock.calls[0][0];

      const secondCall =
        UserLegalAcceptanceModel.create.mock.calls[1][0];

      expect(firstCall.query).toBe(
        secondCall.query
      );

      expect(firstCall.params).toEqual([
        10,
        1,
        'tradicional'
      ]);

      expect(secondCall.params).toEqual([
        20,
        2,
        'google'
      ]);
    });

    test('propagates database errors', async () => {
      const error = new Error(
        'Database error'
      );

      UserLegalAcceptanceModel.create.mockRejectedValue(
        error
      );

      await expect(
        repository.create({
          usuarioId,
          documentoLegalId,
          metodoAceptacion: 'tradicional'
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

      UserLegalAcceptanceModel.create.mockRejectedValue(
        error
      );

      await expect(
        repository.create({
          usuarioId,
          documentoLegalId,
          metodoAceptacion: 'actualizacion',
          transaction
        })
      ).rejects.toBe(error);

      expect(UserLegalAcceptanceModel.create)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [
            usuarioId,
            documentoLegalId,
            'actualizacion'
          ],
          transaction
        });
    });
  });

  describe('getByUserId', () => {

    const acceptanceHistory = [
      {
        usuario_aceptacion_legal_id: 2,
        usuario_id: usuarioId,
        documento_legal_id: 2,
        tipo: 'politica_privacidad',
        version: '1.0.0',
        url: 'https://www.thecupcakelife.com/privacidad/',
        vigente: true,
        fecha_aceptacion: fechaAceptacion,
        metodo_aceptacion: 'tradicional'
      },
      {
        usuario_aceptacion_legal_id: 1,
        usuario_id: usuarioId,
        documento_legal_id: 1,
        tipo: 'terminos_condiciones',
        version: '1.0.0',
        url: 'https://www.thecupcakelife.com/terminos/',
        vigente: false,
        fecha_aceptacion: fechaAceptacion,
        metodo_aceptacion: 'tradicional'
      }
    ];

    test('returns the legal acceptance history', async () => {
      UserLegalAcceptanceModel.get.mockResolvedValue(
        acceptanceHistory
      );

      const result = await repository.getByUserId({
        usuarioId
      });

      expect(UserLegalAcceptanceModel.get)
        .toHaveBeenCalledTimes(1);

      expect(UserLegalAcceptanceModel.get)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [usuarioId],
          transaction: undefined
        });

      expect(result).toEqual(acceptanceHistory);
    });

    test('selects acceptance and legal document information', async () => {
      UserLegalAcceptanceModel.get.mockResolvedValue(
        acceptanceHistory
      );

      await repository.getByUserId({
        usuarioId
      });

      const { query } =
        UserLegalAcceptanceModel.get.mock.calls[0][0];

      const sql = normalizeSql(query);

      expect(sql).toContain(
        'ual.usuario_aceptacion_legal_id'
      );

      expect(sql).toContain(
        'ual.usuario_id'
      );

      expect(sql).toContain(
        'ual.documento_legal_id'
      );

      expect(sql).toContain('dl.tipo');

      expect(sql).toContain('dl.version');

      expect(sql).toContain('dl.url');

      expect(sql).toContain('dl.vigente');

      expect(sql).toContain(
        'ual.fecha_aceptacion'
      );

      expect(sql).toContain(
        'ual.metodo_aceptacion'
      );

      expect(sql).toContain(
        'FROM usuario_aceptaciones_legales ual'
      );

      expect(sql).toContain(
        'INNER JOIN documentos_legales dl'
      );

      expect(sql).toContain(
        'ON dl.documento_legal_id = ual.documento_legal_id'
      );

      expect(sql).toContain(
        'WHERE ual.usuario_id = $1'
      );
    });

    test('includes active and inactive accepted documents', async () => {
      UserLegalAcceptanceModel.get.mockResolvedValue(
        acceptanceHistory
      );

      const result = await repository.getByUserId({
        usuarioId
      });

      const { query } =
        UserLegalAcceptanceModel.get.mock.calls[0][0];

      const sql = normalizeSql(query);

      expect(sql).not.toMatch(
        /(?:WHERE|AND)\s+dl\.vigente\s*=/i
      );

      expect(result).toHaveLength(2);

      expect(
        result.some(document => document.vigente === true)
      ).toBe(true);

      expect(
        result.some(document => document.vigente === false)
      ).toBe(true);
    });

    test('orders the acceptance history from newest to oldest', async () => {
      UserLegalAcceptanceModel.get.mockResolvedValue(
        acceptanceHistory
      );

      await repository.getByUserId({
        usuarioId
      });

      const { query } =
        UserLegalAcceptanceModel.get.mock.calls[0][0];

      expect(normalizeSql(query)).toContain(
        'ORDER BY ual.fecha_aceptacion DESC, ual.usuario_aceptacion_legal_id DESC'
      );
    });

    test('uses parameterized queries for different users', async () => {
      UserLegalAcceptanceModel.get.mockResolvedValue([]);

      await repository.getByUserId({
        usuarioId: 10
      });

      await repository.getByUserId({
        usuarioId: 20
      });

      expect(UserLegalAcceptanceModel.get)
        .toHaveBeenCalledTimes(2);

      const firstCall =
        UserLegalAcceptanceModel.get.mock.calls[0][0];

      const secondCall =
        UserLegalAcceptanceModel.get.mock.calls[1][0];

      expect(firstCall.query).toBe(
        secondCall.query
      );

      expect(firstCall.params).toEqual([10]);

      expect(secondCall.params).toEqual([20]);

      expect(normalizeSql(firstCall.query))
        .toContain('WHERE ual.usuario_id = $1');
    });

    test('passes the transaction to the model', async () => {
      const transaction = {
        query: jest.fn()
      };

      UserLegalAcceptanceModel.get.mockResolvedValue(
        acceptanceHistory
      );

      const result = await repository.getByUserId({
        usuarioId,
        transaction
      });

      expect(UserLegalAcceptanceModel.get)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [usuarioId],
          transaction
        });

      expect(
        UserLegalAcceptanceModel.get.mock.calls[0][0]
          .transaction
      ).toBe(transaction);

      expect(result).toEqual(acceptanceHistory);
    });

    test('returns an empty array when the user has no acceptances', async () => {
      UserLegalAcceptanceModel.get.mockResolvedValue([]);

      const result = await repository.getByUserId({
        usuarioId
      });

      expect(result).toEqual([]);

      expect(UserLegalAcceptanceModel.get)
        .toHaveBeenCalledTimes(1);
    });

    test('propagates database errors', async () => {
      const error = new Error(
        'Database error'
      );

      UserLegalAcceptanceModel.get.mockRejectedValue(
        error
      );

      await expect(
        repository.getByUserId({
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

      UserLegalAcceptanceModel.get.mockRejectedValue(
        error
      );

      await expect(
        repository.getByUserId({
          usuarioId,
          transaction
        })
      ).rejects.toBe(error);

      expect(UserLegalAcceptanceModel.get)
        .toHaveBeenCalledWith({
          query: expect.any(String),
          params: [usuarioId],
          transaction
        });
    });
  });
});
