jest.mock('@db/db', () => ({ query: jest.fn() }));
const db = require('@db/db');
const { CupcakeModel, CupcakeUserStateModel } = require('../../models/cupcake');

describe('Cupcake & CupcakeUserState Models', () => {
  beforeEach(() => jest.clearAllMocks());

  test('CupcakeModel.getAll llama db.query con SQL', async () => {
    await CupcakeModel.getAll({ query: 'SELECT 1' });
    expect(db.query).toHaveBeenCalledWith('SELECT 1');
  });

  test('CupcakeModel.getById llama db.query con SQL y params', async () => {
    await CupcakeModel.getById({ query: 'SELECT $1', params: [9] });
    expect(db.query).toHaveBeenCalledWith('SELECT $1', [9]);
  });

  test('CupcakeUserStateModel.update llama db.query con SQL y params', async () => {
    await CupcakeUserStateModel.update({ query: 'UPDATE x', params: [1,2,3] });
    expect(db.query).toHaveBeenCalledWith('UPDATE x', [1,2,3]);
  });
});
