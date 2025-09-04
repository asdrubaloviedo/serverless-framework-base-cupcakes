describe('GetByIdIngredient Service', () => {
  let mockRepo;

  const load = () => {
    jest.resetModules();
    jest.doMock('@ingredient/repositories/index', () => ({
      IngredientRepository: jest.fn(() => mockRepo)
    }));
    return require('@ingredient/services/ingredient/GetByIdIngredient');
  };

  beforeEach(() => {
    mockRepo = { getById: jest.fn() };
  });

  test('retorna ingredientes cuando hay datos', async () => {
    const rows = [{ ing: 'azúcar' }];
    mockRepo.getById.mockResolvedValue(rows);

    const Svc = load();
    const res = await Svc.execute({ id: 5 });

    expect(mockRepo.getById).toHaveBeenCalledWith({ id: 5 });
    expect(res).toBe(rows);
  });

  test('retorna null cuando no hay datos', async () => {
    mockRepo.getById.mockResolvedValue([]);

    const Svc = load();
    const res = await Svc.execute({ id: 9 });

    expect(res).toBeNull();
  });

  test('propaga error del repo', async () => {
    mockRepo.getById.mockRejectedValue(new Error('db fail'));

    const Svc = load();
    await expect(Svc.execute({ id: 1 })).rejects.toThrow('db fail');
  });
});
