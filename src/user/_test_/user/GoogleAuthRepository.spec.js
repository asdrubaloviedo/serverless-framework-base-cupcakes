
jest.mock('@user/models/user', () => ({
  UserModel: {
    create: jest.fn(),
    getCreated: jest.fn(),
    getByFirebaseUid: jest.fn()
  }
}));

const { UserModel } = require('@user/models/user');

const { UserRepository } = require('@user/repositories');

beforeEach(() => {
  jest.resetAllMocks();
});

describe('UserRepository Google', () => {

  const repo = new UserRepository();

  const firebaseUid = 'GoogleFirebaseUidTest123';

  const normalizeSql = (query) =>
    query.replace(/\s+/g, ' ').trim();

  test('existsByEmail: encontrado', async () => {
    UserModel.getCreated.mockResolvedValue([
      { usuario_id: 1 }
    ]);

    await expect(
      repo.existsByEmail({
        email: 'a@example.com'
      })
    ).resolves.toBe(true);

    const { query, params } =
      UserModel.getCreated.mock.calls[0][0];

    expect(normalizeSql(query)).toMatch(
      /SELECT usuario_id FROM usuarios/i
    );

    expect(params).toEqual([
      'a@example.com'
    ]);
  });

  test('existsByEmail: inexistente', async () => {
    UserModel.getCreated.mockResolvedValue([]);

    await expect(
      repo.existsByEmail({
        email: 'missing@example.com'
      })
    ).resolves.toBe(false);
  });

  test('registerGoogle: inserción parametrizada', async () => {
    UserModel.create.mockResolvedValue([
      { usuario_id: 2 }
    ]);

    await expect(
      repo.registerGoogle({
        nombre: 'Ana María',
        email: 'ana@example.com',
        firebaseUid
      })
    ).resolves.toEqual([
      { usuario_id: 2 }
    ]);

    const { query, params } =
      UserModel.create.mock.calls[0][0];

    const sql = normalizeSql(query);

    expect(sql).toMatch(
      /INSERT INTO usuarios/i
    );

    expect(sql).toMatch(
      /\bfirebase_uid\b/i
    );

    expect(sql).toMatch(
      /ON CONFLICT DO NOTHING/i
    );

    expect(sql).toMatch(
      /RETURNING usuario_id/i
    );

    expect(params).toEqual([
      'Ana',
      'María',
      'ana@example.com',
      firebaseUid
    ]);
  });

  test('registerGoogle: duplicado devuelve array vacío', async () => {
    UserModel.create.mockResolvedValue([]);

    await expect(
      repo.registerGoogle({
        nombre: 'Ana',
        email: 'ana@example.com',
        firebaseUid
      })
    ).resolves.toEqual([]);
  });

  test('error de DB no se oculta', async () => {
    UserModel.getCreated.mockRejectedValue(
      new Error('connection error')
    );

    await expect(
      repo.existsByEmail({
        email: 'a@example.com'
      })
    ).rejects.toThrow('connection error');
  });

  test('registerGoogle: conserva el UID sin normalizar', async () => {
    const originalUid = 'AbCdEf123GoogleUID';

    UserModel.create.mockResolvedValue([
      { usuario_id: 2 }
    ]);

    await repo.registerGoogle({
      nombre: 'Ana',
      email: 'ana@example.com',
      firebaseUid: originalUid
    });

    const { query, params } =
      UserModel.create.mock.calls[0][0];

    const sql = normalizeSql(query);

    expect(params).toEqual([
      'Ana',
      '',
      'ana@example.com',
      originalUid
    ]);

    expect(sql).toContain(
      'LOWER($3), $4'
    );

    expect(sql).not.toMatch(
      /(?:LOWER|UPPER)\s*\(\s*\$4\s*\)/i
    );
  });

  test('registerGoogle: permite utilizar una transacción', async () => {
    const transaction = {
      query: jest.fn()
    };

    const rows = [
      { usuario_id: 2 }
    ];

    UserModel.create.mockResolvedValue(rows);

    const result = await repo.registerGoogle({
      nombre: 'Ana María',
      email: 'ana@example.com',
      firebaseUid,
      transaction
    });

    expect(UserModel.create)
      .toHaveBeenCalledTimes(1);

    expect(UserModel.create)
      .toHaveBeenCalledWith({
        query: expect.any(String),
        params: [
          'Ana',
          'María',
          'ana@example.com',
          firebaseUid
        ],
        transaction
      });

    expect(
      UserModel.create.mock.calls[0][0].transaction
    ).toBe(transaction);

    expect(result).toEqual(rows);
  });

  test('registerGoogle: conflicto dentro de una transacción', async () => {
    const transaction = {
      query: jest.fn()
    };

    UserModel.create.mockResolvedValue([]);

    const result = await repo.registerGoogle({
      nombre: 'Ana',
      email: 'ana@example.com',
      firebaseUid,
      transaction
    });

    expect(result).toEqual([]);

    expect(UserModel.create)
      .toHaveBeenCalledWith({
        query: expect.any(String),
        params: [
          'Ana',
          '',
          'ana@example.com',
          firebaseUid
        ],
        transaction
      });
  });

  test('registerGoogle: propaga errores de inserción', async () => {
    const error = new Error(
      'Database insertion error'
    );

    UserModel.create.mockRejectedValue(error);

    await expect(
      repo.registerGoogle({
        nombre: 'Ana',
        email: 'ana@example.com',
        firebaseUid
      })
    ).rejects.toBe(error);
  });

  test('registerGoogle: propaga errores de transacción', async () => {
    const transaction = {
      query: jest.fn()
    };

    const error = new Error(
      'Transaction error'
    );

    UserModel.create.mockRejectedValue(error);

    await expect(
      repo.registerGoogle({
        nombre: 'Ana',
        email: 'ana@example.com',
        firebaseUid,
        transaction
      })
    ).rejects.toBe(error);

    expect(
      UserModel.create.mock.calls[0][0].transaction
    ).toBe(transaction);
  });

  test('existsByFirebaseUid: encontrado', async () => {
    UserModel.getByFirebaseUid.mockResolvedValue([
      { usuario_id: 2 }
    ]);

    await expect(
      repo.existsByFirebaseUid({
        firebaseUid
      })
    ).resolves.toBe(true);

    expect(UserModel.getByFirebaseUid)
      .toHaveBeenCalledTimes(1);

    const { query, params } =
      UserModel.getByFirebaseUid.mock.calls[0][0];

    const sql = normalizeSql(query);

    expect(sql).toMatch(
      /SELECT usuario_id FROM usuarios/i
    );

    expect(sql).toContain(
      'WHERE firebase_uid = $1'
    );

    expect(params).toEqual([
      firebaseUid
    ]);

    expect(UserModel.getCreated)
      .not.toHaveBeenCalled();
  });

  test('existsByFirebaseUid: inexistente', async () => {
    UserModel.getByFirebaseUid.mockResolvedValue([]);

    await expect(
      repo.existsByFirebaseUid({
        firebaseUid
      })
    ).resolves.toBe(false);

    expect(UserModel.getCreated)
      .not.toHaveBeenCalled();
  });

  test('existsByFirebaseUid: conserva mayúsculas y minúsculas', async () => {
    const originalUid = 'AbCdEf123GoogleUID';

    UserModel.getByFirebaseUid.mockResolvedValue([
      { usuario_id: 2 }
    ]);

    await repo.existsByFirebaseUid({
      firebaseUid: originalUid
    });

    const { query, params } =
      UserModel.getByFirebaseUid.mock.calls[0][0];

    const sql = normalizeSql(query);

    expect(params).toEqual([
      originalUid
    ]);

    expect(sql).toContain(
      'WHERE firebase_uid = $1'
    );

    expect(sql).not.toMatch(
      /(?:LOWER|UPPER)\s*\(/i
    );
  });

  test('existsByFirebaseUid: permite utilizar una transacción', async () => {
    const transaction = {
      query: jest.fn()
    };

    UserModel.getByFirebaseUid.mockResolvedValue([
      { usuario_id: 2 }
    ]);

    await expect(
      repo.existsByFirebaseUid({
        firebaseUid,
        transaction
      })
    ).resolves.toBe(true);

    expect(UserModel.getByFirebaseUid)
      .toHaveBeenCalledWith({
        query: expect.any(String),
        params: [firebaseUid],
        transaction
      });

    expect(
      UserModel.getByFirebaseUid.mock.calls[0][0]
        .transaction
    ).toBe(transaction);
  });

  test('existsByFirebaseUid: propaga errores de DB', async () => {
    const error = new Error(
      'Database connection error'
    );

    UserModel.getByFirebaseUid.mockRejectedValue(
      error
    );

    await expect(
      repo.existsByFirebaseUid({
        firebaseUid
      })
    ).rejects.toBe(error);

    expect(UserModel.getCreated)
      .not.toHaveBeenCalled();
  });
});
