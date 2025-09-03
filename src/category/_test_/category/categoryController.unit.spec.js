jest.mock('@category/services/category', () => ({
  __esModule: true,
  GetAllCategoriesNameImageCountCategory: { execute: jest.fn() }
}));
const { GetAllCategoriesNameImageCountCategory } = require('@category/services/category');
const CategoryController = require('@category/controller/category');

describe('CategoryController.getAllNameImageCount', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sin email', async () => {
    GetAllCategoriesNameImageCountCategory.execute.mockResolvedValue(['ok']);
    const res = await CategoryController.getAllNameImageCount({});
    expect(GetAllCategoriesNameImageCountCategory.execute).toHaveBeenCalledWith({ email: undefined });
    expect(res).toEqual(['ok']);
  });

  test('con email', async () => {
    GetAllCategoriesNameImageCountCategory.execute.mockResolvedValue(['ok']);
    const res = await CategoryController.getAllNameImageCount({ email: 'x@y.com' });
    expect(GetAllCategoriesNameImageCountCategory.execute).toHaveBeenCalledWith({ email: 'x@y.com' });
    expect(res).toEqual(['ok']);
  });
});
