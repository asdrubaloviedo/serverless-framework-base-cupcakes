jest.mock('@cupcake/models/cupcake', () => {
  const m = {
    CupcakeUserStateModel: {
      create:                      jest.fn(),
      getByUserEmailAndIdAndState: jest.fn(),
      getByUserEmail:              jest.fn(),
      getByUserEmailAndId:         jest.fn(),
      update:                      jest.fn(),
    }
  };
  return m;
});

const { CupcakeUserStateModel } = require('@cupcake/models/cupcake');
const Repo = require('../../repositories/CupcakeUserStateRepository');

describe('CupcakeUserStateRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('create -> INSERT con params', async () => {
    const r = new Repo();
    await r.create({ email: 'a@a.com', cupcake: 1, estado: 2 });
    const { query, params } = CupcakeUserStateModel.create.mock.calls[0][0];
    expect(params).toEqual(['a@a.com', 1, 2]);
    expect(query).toMatch(/INSERT INTO cupcake_usuario_estados/);
  });

  test('getByUserEmailAndIdAndState -> SELECT con params', async () => {
    const r = new Repo();
    await r.getByUserEmailAndIdAndState({ email: 'x@x.com', cupcake: 3, estado: 4 });
    const { query, params } = CupcakeUserStateModel.getByUserEmailAndIdAndState.mock.calls[0][0];
    expect(params).toEqual(['x@x.com', 3, 4]);
    expect(query).toMatch(/FROM cupcake_usuario_estados/);
  });

  test('getByUserEmail -> agrega CTE y COUNTs', async () => {
    const r = new Repo();
    await r.getByUserEmail({ lowerCaseEmail: 'u@u.com' });
    const { query, params } = CupcakeUserStateModel.getByUserEmail.mock.calls[0][0];
    expect(params).toEqual(['u@u.com']);
    expect(query).toMatch(/WITH\s+hechos AS/);
  });

  test('getByUserEmailAndId -> ordena por estado_id', async () => {
    const r = new Repo();
    await r.getByUserEmailAndId({ lowerCaseEmail: 'u@u.com', id: 7 });
    const { query, params } = CupcakeUserStateModel.getByUserEmailAndId.mock.calls[0][0];
    expect(params).toEqual(['u@u.com', 7]);
    expect(query).toMatch(/ORDER BY cue\.estado_id/);
  });

  test('update -> UPDATE con params', async () => {
    const r = new Repo();
    await r.update({ email: 'a@a.com', cupcake: 2, estado: 3, valor: true });
    const { query, params } = CupcakeUserStateModel.update.mock.calls[0][0];
    expect(params).toEqual(['a@a.com', 2, 3, true]);
    expect(query).toMatch(/UPDATE cupcake_usuario_estados/);
  });
});
