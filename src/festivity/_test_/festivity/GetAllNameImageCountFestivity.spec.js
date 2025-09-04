// Service (unit)
describe('GetAllNameImageCountFestivity Service', () => {
  const load = (impl) => {
    jest.resetModules();
    let mockRepo;
    jest.doMock('@festivity/repositories/index', () => ({
      FestivityRepository: jest.fn(() => mockRepo)
    }));
    const S = require('@festivity/services/festivity/GetAllNameImageCountFestivity');
    mockRepo = impl;
    return { S, mockRepo };
  };

  test('sin email -> usa getAllNameImageCount', async () => {
    const { S, mockRepo } = load({ getAllNameImageCount: jest.fn().mockResolvedValue([{ id: 1 }]) });
    const res = await S.execute(undefined);
    expect(mockRepo.getAllNameImageCount).toHaveBeenCalled();
    expect(res).toEqual([{ id: 1 }]);
  });

  test('con email -> usa getAllNameImageCountByUserEmail', async () => {
    const { S, mockRepo } = load({ getAllNameImageCountByUserEmail: jest.fn().mockResolvedValue([{ id: 2 }]) });
    const res = await S.execute('TEST@MAIL.COM');
    expect(mockRepo.getAllNameImageCountByUserEmail).toHaveBeenCalledWith({ lowerCaseEmail: 'test@mail.com' });
    expect(res).toEqual([{ id: 2 }]);
  });

  test('sin datos sin email -> null', async () => {
    const { S } = load({ getAllNameImageCount: jest.fn().mockResolvedValue([]) });
    const res = await S.execute();
    expect(res).toBeNull();
  });

  test('sin datos con email -> []', async () => {
    const { S, mockRepo } = load({ getAllNameImageCountByUserEmail: jest.fn().mockResolvedValue([]) });
    const res = await S.execute('a@b.com');
    expect(mockRepo.getAllNameImageCountByUserEmail).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  test('propaga error del repo', async () => {
    const boom = new Error('db down');
    const { S } = load({ getAllNameImageCount: jest.fn().mockRejectedValue(boom) });
    await expect(S.execute()).rejects.toThrow('db down');
  });
});
