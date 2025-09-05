jest.mock('@category/models/category', () => ({
  __esModule: true,
  CategoryModel: {
    getAllNameImageCount: jest.fn(),
    getAllNameImageCountWithEmail: jest.fn()
  }
}));
const { CategoryModel } = require('@category/models/category');
const CategoryRepository = require('@category/repositories/CategoryRepository');

describe('CategoryRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAllNameImageCount envía SQL', async () => {
    CategoryModel.getAllNameImageCount.mockResolvedValue([{ ok: 1 }]);
    const repo = new CategoryRepository();
    const res = await repo.getAllNameImageCount();

    expect(CategoryModel.getAllNameImageCount).toHaveBeenCalledTimes(1);
    const arg = CategoryModel.getAllNameImageCount.mock.calls[0][0];
    expect(typeof arg.query).toBe('string');
    expect(arg.query.toLowerCase()).toContain('select');
    expect(res).toEqual([{ ok: 1 }]);
  });

  test('getAllNameImageCountWithEmail pasa params', async () => {
    CategoryModel.getAllNameImageCountWithEmail.mockResolvedValue([{ ok: 1 }]);
    const repo = new CategoryRepository();
    const res = await repo.getAllNameImageCountWithEmail({ lowerCaseEmail: 'a@b.com' });

    expect(CategoryModel.getAllNameImageCountWithEmail).toHaveBeenCalledTimes(1);
    const arg = CategoryModel.getAllNameImageCountWithEmail.mock.calls[0][0];
    expect(Array.isArray(arg.params)).toBe(true);
    expect(arg.params[0]).toBe('a@b.com');
    expect(typeof arg.query).toBe('string');
    expect(res).toEqual([{ ok: 1 }]);
  });
});
