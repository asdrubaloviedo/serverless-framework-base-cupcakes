// Model + DB mock
describe('FestivityModel', () => {
  test('getAllNameImageCount usa SQL y devuelve filas', async () => {
    jest.resetModules();
    const rows = [{ x: 1 }];
    jest.doMock('@db/db', () => ({ query: jest.fn().mockResolvedValue(rows) }), { virtual: true });
    const { FestivityModel } = require('@festivity/models/festivity');
    const db = require('@db/db');

    const res = await FestivityModel.getAllNameImageCount({ query: 'SELECT 1' });
    expect(db.query).toHaveBeenCalledWith('SELECT 1');
    expect(res).toBe(rows);
  });

  test('getAllNameImageCountByUserEmail pasa params', async () => {
    jest.resetModules();
    const rows = [{ y: 2 }];
    jest.doMock('@db/db', () => ({ query: jest.fn().mockResolvedValue(rows) }), { virtual: true });
    const { FestivityModel } = require('@festivity/models/festivity');
    const db = require('@db/db');

    const res = await FestivityModel.getAllNameImageCountByUserEmail({ query: 'SELECT $1', params: ['a@b.com'] });
    expect(db.query).toHaveBeenCalledWith('SELECT $1', ['a@b.com']);
    expect(res).toBe(rows);
  });
});
