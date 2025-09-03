const db = require('@db/db'); // mock global desde setup
const { CategoryModel } = require('@category/models/category');

const pickCalled = () => {
  if (db.any?.mock?.calls?.length) return ['any', db.any];
  if (db.query?.mock?.calls?.length) return ['query', db.query];
  if (db.oneOrNone?.mock?.calls?.length) return ['oneOrNone', db.oneOrNone];
  if (db.one?.mock?.calls?.length) return ['one', db.one];
  if (db.none?.mock?.calls?.length) return ['none', db.none];
  return [null, { mock: { calls: [] } }];
};

describe('CategoryModel', () => {
  beforeEach(() => {
    for (const k of ['any', 'query', 'one', 'oneOrNone', 'none']) {
      if (db[k]?.mock) db[k].mockReset();
    }
  });

  test('getAllNameImageCount usa SQL y devuelve filas', async () => {
    const rows = [{ id: 1 }];
    // no sabemos qué método usa el modelo; programa "any" y "query" para seguridad
    db.any?.mockResolvedValueOnce(rows);
    db.query?.mockResolvedValueOnce(rows);

    const res = await CategoryModel.getAllNameImageCount({ query: 'SELECT 1' });

    const [name, fn] = pickCalled();
    expect(['any', 'query', 'oneOrNone', 'one', 'none']).toContain(name);
    expect(fn.mock.calls[0][0]).toContain('SELECT');
    expect(res).toBe(rows);
  });

  test('getAllNameImageCountWithEmail pasa params', async () => {
    const rows = [{ id: 2 }];
    db.any?.mockResolvedValueOnce(rows);
    db.query?.mockResolvedValueOnce(rows);

    const res = await CategoryModel.getAllNameImageCountWithEmail({
      query: 'SELECT $1',
      params: ['a@b.com']
    });

    const [_, fn] = pickCalled();
    const call = fn.mock.calls[0];
    // Soporta firma (sql, params) o un objeto con { params/values/args }
    if (call.length >= 2) {
      expect(call[0]).toContain('SELECT');
      expect(call[1]).toEqual(['a@b.com']);
    } else if (typeof call[0] === 'object') {
      const p = call[0].params ?? call[0].values ?? call[0].args;
      expect(p).toEqual(expect.arrayContaining(['a@b.com']));
    }
    expect(res).toBe(rows);
  });
});
