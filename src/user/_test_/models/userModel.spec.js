jest.mock('@db/db', () => ({ query: jest.fn() }));
const db = require('@db/db');
const { UserModel, UserMedalLeageModel, UserPackageModel } = require('../../models/user');

beforeEach(() => { db.query.mockReset(); });

describe('UserModel', () => {
  test('create -> db.query(query, params)', async () => {
    await UserModel.create({ query: 'SQL1', params: ['a'] });
    expect(db.query).toHaveBeenCalledWith('SQL1', ['a']);
  });
  test('getCreated -> db.query(query, params)', async () => {
    await UserModel.getCreated({ query: 'SQL2', params: ['b'] });
    expect(db.query).toHaveBeenCalledWith('SQL2', ['b']);
  });
});

describe('UserMedalLeageModel', () => {
  test('create', async () => {
    await UserMedalLeageModel.create({ query: 'Q1', params: [1] });
    expect(db.query).toHaveBeenCalledWith('Q1', [1]);
  });
  test('getByUserEmailAndMedal', async () => {
    await UserMedalLeageModel.getByUserEmailAndMedal({ query: 'Q2', params: [2] });
    expect(db.query).toHaveBeenCalledWith('Q2', [2]);
  });
  test('update', async () => {
    await UserMedalLeageModel.update({ query: 'Q3', params: [3] });
    expect(db.query).toHaveBeenCalledWith('Q3', [3]);
  });
  test('getUpdated', async () => {
    await UserMedalLeageModel.getUpdated({ query: 'Q4', params: [4] });
    expect(db.query).toHaveBeenCalledWith('Q4', [4]);
  });
});

describe('UserPackageModel', () => {
  test('create', async () => {
    await UserPackageModel.create({ query: 'P1', params: [1] });
    expect(db.query).toHaveBeenCalledWith('P1', [1]);
  });
  test('getCreated', async () => {
    await UserPackageModel.getCreated({ query: 'P2', params: [2] });
    expect(db.query).toHaveBeenCalledWith('P2', [2]);
  });
});
