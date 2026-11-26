
jest.mock('@db/db', () => ({
  query: jest.fn()
}));

const db = require('@db/db');

const {
  LegalDocumentModel,
  UserLegalAcceptanceModel
} = require('../../models/legal');

beforeEach(() => {
  db.query.mockReset();
});

describe('LegalDocumentModel', () => {

  test('get -> db.query(query, params)', async () => {
    const rows = [
      {
        documento_legal_id: 1,
        tipo: 'terminos_condiciones',
        version: '1.0.0',
        vigente: true
      },
      {
        documento_legal_id: 2,
        tipo: 'politica_privacidad',
        version: '1.0.0',
        vigente: true
      }
    ];

    db.query.mockResolvedValue(rows);

    const result = await LegalDocumentModel.get({
      query: 'SELECT_DOCUMENTS',
      params: []
    });

    expect(db.query).toHaveBeenCalledTimes(1);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT_DOCUMENTS',
      []
    );

    expect(result).toEqual(rows);
  });

  test('get -> transaction.query(query, params)', async () => {
    const rows = [
      {
        documento_legal_id: 1
      }
    ];

    const transaction = {
      query: jest.fn().mockResolvedValue(rows)
    };

    const result = await LegalDocumentModel.get({
      query: 'SELECT_DOCUMENTS',
      params: [1],
      transaction
    });

    expect(transaction.query).toHaveBeenCalledTimes(1);

    expect(transaction.query).toHaveBeenCalledWith(
      'SELECT_DOCUMENTS',
      [1]
    );

    expect(db.query).not.toHaveBeenCalled();

    expect(result).toEqual(rows);
  });

  test('get -> returns empty rows', async () => {
    db.query.mockResolvedValue([]);

    const result = await LegalDocumentModel.get({
      query: 'SELECT_DOCUMENTS',
      params: []
    });

    expect(db.query).toHaveBeenCalledWith(
      'SELECT_DOCUMENTS',
      []
    );

    expect(result).toEqual([]);
  });

  test('get -> propagates database errors', async () => {
    const error = new Error('Database error');

    db.query.mockRejectedValue(error);

    await expect(
      LegalDocumentModel.get({
        query: 'SELECT_DOCUMENTS',
        params: []
      })
    ).rejects.toBe(error);
  });

  test('get -> propagates transaction errors', async () => {
    const error = new Error('Transaction error');

    const transaction = {
      query: jest.fn().mockRejectedValue(error)
    };

    await expect(
      LegalDocumentModel.get({
        query: 'SELECT_DOCUMENTS',
        params: [],
        transaction
      })
    ).rejects.toBe(error);

    expect(db.query).not.toHaveBeenCalled();
  });
});

describe('UserLegalAcceptanceModel', () => {

  test('get -> db.query(query, params)', async () => {
    const rows = [
      {
        usuario_aceptacion_legal_id: 1,
        usuario_id: 10,
        documento_legal_id: 1,
        metodo_aceptacion: 'tradicional'
      }
    ];

    db.query.mockResolvedValue(rows);

    const result = await UserLegalAcceptanceModel.get({
      query: 'SELECT_ACCEPTANCES',
      params: [10]
    });

    expect(db.query).toHaveBeenCalledTimes(1);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT_ACCEPTANCES',
      [10]
    );

    expect(result).toEqual(rows);
  });

  test('get -> transaction.query(query, params)', async () => {
    const rows = [
      {
        usuario_aceptacion_legal_id: 1
      }
    ];

    const transaction = {
      query: jest.fn().mockResolvedValue(rows)
    };

    const result = await UserLegalAcceptanceModel.get({
      query: 'SELECT_ACCEPTANCES',
      params: [10],
      transaction
    });

    expect(transaction.query).toHaveBeenCalledTimes(1);

    expect(transaction.query).toHaveBeenCalledWith(
      'SELECT_ACCEPTANCES',
      [10]
    );

    expect(db.query).not.toHaveBeenCalled();

    expect(result).toEqual(rows);
  });

  test('get -> returns empty rows', async () => {
    db.query.mockResolvedValue([]);

    const result = await UserLegalAcceptanceModel.get({
      query: 'SELECT_ACCEPTANCES',
      params: [10]
    });

    expect(db.query).toHaveBeenCalledWith(
      'SELECT_ACCEPTANCES',
      [10]
    );

    expect(result).toEqual([]);
  });

  test('get -> propagates database errors', async () => {
    const error = new Error('Database error');

    db.query.mockRejectedValue(error);

    await expect(
      UserLegalAcceptanceModel.get({
        query: 'SELECT_ACCEPTANCES',
        params: [10]
      })
    ).rejects.toBe(error);
  });

  test('get -> propagates transaction errors', async () => {
    const error = new Error('Transaction error');

    const transaction = {
      query: jest.fn().mockRejectedValue(error)
    };

    await expect(
      UserLegalAcceptanceModel.get({
        query: 'SELECT_ACCEPTANCES',
        params: [10],
        transaction
      })
    ).rejects.toBe(error);

    expect(db.query).not.toHaveBeenCalled();
  });

  test('create -> db.query(query, params)', async () => {
    const rows = [
      {
        usuario_aceptacion_legal_id: 1,
        usuario_id: 10,
        documento_legal_id: 1,
        metodo_aceptacion: 'tradicional'
      }
    ];

    const params = [10, 1, 'tradicional'];

    db.query.mockResolvedValue(rows);

    const result = await UserLegalAcceptanceModel.create({
      query: 'INSERT_ACCEPTANCE',
      params
    });

    expect(db.query).toHaveBeenCalledTimes(1);

    expect(db.query).toHaveBeenCalledWith(
      'INSERT_ACCEPTANCE',
      params
    );

    expect(result).toEqual(rows);
  });

  test('create -> transaction.query(query, params)', async () => {
    const rows = [
      {
        usuario_aceptacion_legal_id: 2,
        usuario_id: 10,
        documento_legal_id: 2,
        metodo_aceptacion: 'google'
      }
    ];

    const params = [10, 2, 'google'];

    const transaction = {
      query: jest.fn().mockResolvedValue(rows)
    };

    const result = await UserLegalAcceptanceModel.create({
      query: 'INSERT_ACCEPTANCE',
      params,
      transaction
    });

    expect(transaction.query).toHaveBeenCalledTimes(1);

    expect(transaction.query).toHaveBeenCalledWith(
      'INSERT_ACCEPTANCE',
      params
    );

    expect(db.query).not.toHaveBeenCalled();

    expect(result).toEqual(rows);
  });

  test('create -> returns empty rows when no record is inserted', async () => {
    const params = [10, 1, 'actualizacion'];

    const transaction = {
      query: jest.fn().mockResolvedValue([])
    };

    const result = await UserLegalAcceptanceModel.create({
      query: 'INSERT_ACCEPTANCE',
      params,
      transaction
    });

    expect(transaction.query).toHaveBeenCalledTimes(1);

    expect(transaction.query).toHaveBeenCalledWith(
      'INSERT_ACCEPTANCE',
      params
    );

    expect(db.query).not.toHaveBeenCalled();

    expect(result).toEqual([]);
  });

  test('create -> propagates database errors', async () => {
    const error = new Error('Database error');

    db.query.mockRejectedValue(error);

    await expect(
      UserLegalAcceptanceModel.create({
        query: 'INSERT_ACCEPTANCE',
        params: [10, 1, 'tradicional']
      })
    ).rejects.toBe(error);
  });

  test('create -> propagates transaction errors', async () => {
    const error = new Error('Transaction error');

    const transaction = {
      query: jest.fn().mockRejectedValue(error)
    };

    await expect(
      UserLegalAcceptanceModel.create({
        query: 'INSERT_ACCEPTANCE',
        params: [10, 1, 'actualizacion'],
        transaction
      })
    ).rejects.toBe(error);

    expect(db.query).not.toHaveBeenCalled();
  });
});
