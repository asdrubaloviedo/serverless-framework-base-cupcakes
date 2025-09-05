jest.mock('@cupcake/repositories/index', () => {
  const repo = {
    create: jest.fn().mockResolvedValue(undefined),
    getByUserEmailAndIdAndState: jest.fn().mockResolvedValue([{ ok: true }]),
  };
  return { CupcakeUserStateRepository: jest.fn(() => repo) };
});

const { CupcakeUserStateRepository } = require('@cupcake/repositories/index');
const S = require('../../services/cupcakeUserState/CreateOneCupcakeUserStateCupcake');

describe('CreateOneCupcakeUserStateCupcake Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea y devuelve estado', async () => {
    const repo = new CupcakeUserStateRepository();
    const res = await S.execute({ email: 'a@a.com', cupcake: 1, estado: 2 });
    expect(repo.create).toHaveBeenCalledWith({ email: 'a@a.com', cupcake: 1, estado: 2 });
    expect(repo.getByUserEmailAndIdAndState).toHaveBeenCalledWith({ email: 'a@a.com', cupcake: 1, estado: 2 });
    expect(res).toEqual([{ ok: true }]);
  });

  test('error en create -> mensaje amigable', async () => {
    const repo = new CupcakeUserStateRepository();
    repo.create.mockRejectedValueOnce(new Error('db'));
    await expect(
      S.execute({ email: 'a@a.com', cupcake: 1, estado: 2 })
    ).rejects.toThrow('Error creating the cupcake user state');
  });
});
