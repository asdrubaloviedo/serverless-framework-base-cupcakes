jest.mock('@db/db', () => ({ query: jest.fn() }), { virtual: true });

const db = require('@db/db');
const { IngredientModel } = require('@ingredient/models/ingredient');

describe('IngredientModel', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getById llama db.query con SQL y params', async () => {
    const rows = [{ ok: 1 }];
    db.query.mockResolvedValue(rows);

    const res = await IngredientModel.getById({ query: 'SELECT 1', params: [7] });

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith('SELECT 1', [7]);
    expect(res).toBe(rows);
  });
});
