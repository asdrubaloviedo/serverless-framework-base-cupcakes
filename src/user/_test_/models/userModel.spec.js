
jest.mock('@db/db', () => ({ query: jest.fn() }));

const db = require('@db/db');

const {
  UserModel,
  UserMedalLeageModel,
  UserPackageModel
} = require('../../models/user');

beforeEach(() => {
  db.query.mockReset();
});

describe('UserModel', () => {

  test('create -> db.query(query, params)', async () => {
    await UserModel.create({
      query: 'SQL1',
      params: ['a']
    });

    expect(db.query).toHaveBeenCalledWith(
      'SQL1',
      ['a']
    );
  });

  test('create -> transaction.query(query, params)', async () => {
    const rows = [{ usuario_id: 1 }];

    const transaction = {
      query: jest.fn().mockResolvedValue(rows)
    };

    const result = await UserModel.create({
      query: 'SQL1',
      params: ['a'],
      transaction
    });

    expect(transaction.query).toHaveBeenCalledTimes(1);

    expect(transaction.query).toHaveBeenCalledWith(
      'SQL1',
      ['a']
    );

    expect(db.query).not.toHaveBeenCalled();

    expect(result).toEqual(rows);
  });

  test('getCreated -> db.query(query, params)', async () => {
    await UserModel.getCreated({
      query: 'SQL2',
      params: ['b']
    });

    expect(db.query).toHaveBeenCalledWith(
      'SQL2',
      ['b']
    );
  });

  test('getCreated -> transaction.query(query, params)', async () => {
    const rows = [{ usuario_id: 1 }];

    const transaction = {
      query: jest.fn().mockResolvedValue(rows)
    };

    const result = await UserModel.getCreated({
      query: 'SQL2',
      params: ['b'],
      transaction
    });

    expect(transaction.query).toHaveBeenCalledTimes(1);

    expect(transaction.query).toHaveBeenCalledWith(
      'SQL2',
      ['b']
    );

    expect(db.query).not.toHaveBeenCalled();

    expect(result).toEqual(rows);
  });

  test('getByFirebaseUid -> db.query(query, params)', async () => {
    const firebaseUid = 'FirebaseUidTest123';

    const rows = [{ usuario_id: 1 }];

    db.query.mockResolvedValue(rows);

    const result = await UserModel.getByFirebaseUid({
      query: 'SQL3',
      params: [firebaseUid]
    });

    expect(db.query).toHaveBeenCalledTimes(1);

    expect(db.query).toHaveBeenCalledWith(
      'SQL3',
      [firebaseUid]
    );

    expect(result).toEqual(rows);
  });

  test('getByFirebaseUid -> transaction.query(query, params)', async () => {
    const firebaseUid = 'FirebaseUidTest123';

    const rows = [{ usuario_id: 1 }];

    const transaction = {
      query: jest.fn().mockResolvedValue(rows)
    };

    const result = await UserModel.getByFirebaseUid({
      query: 'SQL3',
      params: [firebaseUid],
      transaction
    });

    expect(transaction.query).toHaveBeenCalledTimes(1);

    expect(transaction.query).toHaveBeenCalledWith(
      'SQL3',
      [firebaseUid]
    );

    expect(db.query).not.toHaveBeenCalled();

    expect(result).toEqual(rows);
  });

  test('getByFirebaseUid -> returns empty rows when user does not exist', async () => {
    const firebaseUid = 'UnknownFirebaseUid123';

    db.query.mockResolvedValue([]);

    const result = await UserModel.getByFirebaseUid({
      query: 'SQL3',
      params: [firebaseUid]
    });

    expect(db.query).toHaveBeenCalledWith(
      'SQL3',
      [firebaseUid]
    );

    expect(result).toEqual([]);
  });

  test('getByFirebaseUid -> propagates transaction errors', async () => {
    const firebaseUid = 'FirebaseUidTest123';

    const error = new Error('Database error');

    const transaction = {
      query: jest.fn().mockRejectedValue(error)
    };

    await expect(
      UserModel.getByFirebaseUid({
        query: 'SQL3',
        params: [firebaseUid],
        transaction
      })
    ).rejects.toBe(error);

    expect(transaction.query).toHaveBeenCalledWith(
      'SQL3',
      [firebaseUid]
    );

    expect(db.query).not.toHaveBeenCalled();
  });

  test('update -> db.query(query, params)', async () => {
    const rows = [{ usuario_id: 1 }];

    db.query.mockResolvedValue(rows);

    const result = await UserModel.update({
      query: 'SQL4',
      params: ['Usuario', 1]
    });

    expect(db.query).toHaveBeenCalledTimes(1);

    expect(db.query).toHaveBeenCalledWith(
      'SQL4',
      ['Usuario', 1]
    );

    expect(result).toEqual(rows);
  });
});

describe('UserMedalLeageModel', () => {

  test('create', async () => {
    await UserMedalLeageModel.create({
      query: 'Q1',
      params: [1]
    });

    expect(db.query).toHaveBeenCalledWith('Q1', [1]);
  });

  test('getByUserEmailAndMedal', async () => {
    await UserMedalLeageModel.getByUserEmailAndMedal({
      query: 'Q2',
      params: [2]
    });

    expect(db.query).toHaveBeenCalledWith('Q2', [2]);
  });

  test('update', async () => {
    await UserMedalLeageModel.update({
      query: 'Q3',
      params: [3]
    });

    expect(db.query).toHaveBeenCalledWith('Q3', [3]);
  });

  test('getUpdated', async () => {
    await UserMedalLeageModel.getUpdated({
      query: 'Q4',
      params: [4]
    });

    expect(db.query).toHaveBeenCalledWith('Q4', [4]);
  });
});

describe('UserPackageModel', () => {

  test('create', async () => {
    await UserPackageModel.create({
      query: 'P1',
      params: [1]
    });

    expect(db.query).toHaveBeenCalledWith('P1', [1]);
  });

  test('getCreated', async () => {
    await UserPackageModel.getCreated({
      query: 'P2',
      params: [2]
    });

    expect(db.query).toHaveBeenCalledWith('P2', [2]);
  });
});
