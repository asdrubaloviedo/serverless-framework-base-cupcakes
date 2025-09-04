jest.mock('@ingredient/models/ingredient', () => ({
  IngredientModel: { getById: jest.fn() }
}));

const { IngredientModel } = require('@ingredient/models/ingredient');
const IngredientRepository = require('@ingredient/repositories/IngredientRepository');

describe('IngredientRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getById arma SQL y pasa params', async () => {
    const repo = new IngredientRepository();
    const rows = [{ x: 1 }];
    IngredientModel.getById.mockResolvedValue(rows);

    const res = await repo.getById({ id: 42 });

    expect(IngredientModel.getById).toHaveBeenCalledTimes(1);
    const arg = IngredientModel.getById.mock.calls[0][0];
    expect(arg.query).toMatch(/SELECT/i);
    expect(arg.params).toEqual([42]);
    expect(res).toBe(rows);
  });
});
