jest.mock('@cupcake/repositories/index', () => {
  const repo = {
    update: jest.fn().mockResolvedValue(undefined),
    getByUserEmailAndIdAndState: jest.fn().mockResolvedValue([{ ok: 'p' }]),
  };
  return { CupcakeUserStateRepository: jest.fn(() => repo) };
});

const { CupcakeUserStateRepository } = require('@cupcake/repositories/index');
const S = require('../../services/cupcakeUserState/PatchOneCupcakeUserStateCupcake');

describe('PatchOneCupcakeUserStateCupcake Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('actualiza y devuelve estado', async () => {
    const repo = new CupcakeUserStateRepository();
    const params = { email: 'a@a.com', cupcake: 1, estado: 2, valor: true };
    const res = await S.execute(params);
    expect(repo.update).toHaveBeenCalledWith(params);
    expect(repo.getByUserEmailAndIdAndState).toHaveBeenCalledWith({ email: 'a@a.com', cupcake: 1, estado: 2 });
    expect(res).toEqual([{ ok: 'p' }]);
  });

  test('error en update -> mensaje amigable', async () => {
    const repo = new CupcakeUserStateRepository();
    repo.update.mockRejectedValueOnce(new Error('db'));
    await expect(
      S.execute({ email: 'a@a.com', cupcake: 1, estado: 2, valor: false })
    ).rejects.toThrow('Error updating the cupcake user state');
  });
});
