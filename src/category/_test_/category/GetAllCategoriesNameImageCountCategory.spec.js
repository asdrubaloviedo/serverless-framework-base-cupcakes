/*
  Este test te garantiza que el servicio GetAllCategoriesNameImageCountCategory:
    Llama correctamente al método getAllNameImageCount si no se le pasa un email.
    Devuelve lo que esa función retorna (en este caso simulado como mockData).
*/
// Unit del servicio, repo mockeado
jest.mock('@category/repositories/index', () => {
  const mockRepo = {
    getAllNameImageCount: jest.fn(),
    getAllNameImageCountWithEmail: jest.fn()
  };
  return { __esModule: true, _mockRepo: mockRepo, CategoryRepository: jest.fn(() => mockRepo) };
});

const { _mockRepo } = require('@category/repositories/index');
const GetAll = require('@category/services/category/GetAllCategoriesNameImageCountCategory');

describe('GetAllCategoriesNameImageCountCategory Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retorna categorías sin email', async () => {
    const mockData = [{ id: 1, descripcion: 'Choco' }];
    _mockRepo.getAllNameImageCount.mockResolvedValue(mockData);

    const result = await GetAll.execute({});

    expect(_mockRepo.getAllNameImageCount).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });

  test('retorna categorías filtradas por email', async () => {
    const mockData = [{ id: 2, descripcion: 'Vainilla' }];
    _mockRepo.getAllNameImageCountWithEmail.mockResolvedValue(mockData);

    const result = await GetAll.execute({ email: 'Test@Example.com' });

    expect(_mockRepo.getAllNameImageCountWithEmail)
      .toHaveBeenCalledWith({ lowerCaseEmail: 'test@example.com' });
    expect(result).toEqual(mockData);
  });

  test('retorna null si no hay categorías sin email', async () => {
    _mockRepo.getAllNameImageCount.mockResolvedValue([]);

    const result = await GetAll.execute({});

    expect(result).toBeNull();
  });

  test('retorna [] si no hay categorías con email', async () => {
    _mockRepo.getAllNameImageCountWithEmail.mockResolvedValue([]);

    const result = await GetAll.execute({ email: 'a@b.com' });

    expect(result).toEqual([]);
  });

  test('propaga error del repo', async () => {
    _mockRepo.getAllNameImageCount.mockRejectedValue(new Error('Fallo'));
    await expect(GetAll.execute({})).rejects.toThrow('Fallo');
  });
});
