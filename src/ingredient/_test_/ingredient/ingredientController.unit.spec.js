const IngredientController = require('@ingredient/controller/ingredient');

jest.mock('@ingredient/services/ingredient', () => ({
  GetByIdIngredient: { execute: jest.fn() }
}));

const { GetByIdIngredient } = require('@ingredient/services/ingredient');

describe('IngredientController.getById', () => {
  beforeEach(() => jest.clearAllMocks());

  test('con id -> retorna resultado del servicio', async () => {
    GetByIdIngredient.execute.mockResolvedValue([{ id: 77 }]);
    const res = await IngredientController.getById({ id: 77 });
    expect(GetByIdIngredient.execute).toHaveBeenCalledWith({ id: 77 });
    expect(res).toEqual([{ id: 77 }]);
  });

  test('sin id o servicio retorna null -> devuelve mensaje not found', async () => {
    GetByIdIngredient.execute.mockResolvedValue(null);
    const res = await IngredientController.getById({});
    expect(GetByIdIngredient.execute).toHaveBeenCalledWith({ id: undefined });
    expect(res).toEqual({ message: 'Ingredients were not found' });
  });

  test('propaga error del servicio', async () => {
    GetByIdIngredient.execute.mockRejectedValue(new Error('boom'));
    await expect(IngredientController.getById({ id: 1 })).rejects.toThrow('boom');
  });
});
