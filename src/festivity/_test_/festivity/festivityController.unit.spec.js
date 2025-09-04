// Controller (unit)
describe('FestivityController.getAllNameImageCount', () => {
  const load = () => {
    jest.resetModules();
    const mockSvc = { GetAllNameImageCountFestivity: { execute: jest.fn() } };
    jest.doMock('@festivity/services/festivity', () => mockSvc);
    const C = require('@festivity/controller/festivity');
    return { C, mockSvc };
  };

  test('sin email pasa undefined', async () => {
    const { C, mockSvc } = load();
    mockSvc.GetAllNameImageCountFestivity.execute.mockResolvedValue([{ a: 1 }]);
    const res = await C.getAllNameImageCount(undefined);
    expect(mockSvc.GetAllNameImageCountFestivity.execute).toHaveBeenCalledWith(undefined);
    expect(res).toEqual([{ a: 1 }]);
  });

  test('con email lo pasa tal cual', async () => {
    const { C, mockSvc } = load();
    mockSvc.GetAllNameImageCountFestivity.execute.mockResolvedValue([{ a: 2 }]);
    const res = await C.getAllNameImageCount('x@y.com');
    expect(mockSvc.GetAllNameImageCountFestivity.execute).toHaveBeenCalledWith('x@y.com');
    expect(res).toEqual([{ a: 2 }]);
  });

  test('propaga error del servicio', async () => {
    const { C, mockSvc } = load();
    mockSvc.GetAllNameImageCountFestivity.execute.mockRejectedValue(new Error('boom'));
    await expect(C.getAllNameImageCount('a')).rejects.toThrow('boom');
  });
});
