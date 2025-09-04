// Repository (unit) con mock del Model
describe('FestivityRepository', () => {
  const load = () => {
    jest.resetModules();
    const model = {
      FestivityModel: {
        getAllNameImageCount: jest.fn().mockResolvedValue([{ a: 1 }]),
        getAllNameImageCountByUserEmail: jest.fn().mockResolvedValue([{ a: 2 }]),
      }
    };
    jest.doMock('@festivity/models/festivity', () => model);
    const Repo = require('@festivity/repositories/FestivityRepository');
    return { Repo, model };
  };

  test('getAllNameImageCount envía SQL', async () => {
    const { Repo, model } = load();
    const r = new Repo();
    const res = await r.getAllNameImageCount();
    expect(model.FestivityModel.getAllNameImageCount).toHaveBeenCalled();
    expect(res).toEqual([{ a: 1 }]);
  });

  test('getAllNameImageCountByUserEmail pasa params', async () => {
    const { Repo, model } = load();
    const r = new Repo();
    const res = await r.getAllNameImageCountByUserEmail({ lowerCaseEmail: 'a@b.com' });
    expect(model.FestivityModel.getAllNameImageCountByUserEmail).toHaveBeenCalled();
    expect(res).toEqual([{ a: 2 }]);
  });
});
