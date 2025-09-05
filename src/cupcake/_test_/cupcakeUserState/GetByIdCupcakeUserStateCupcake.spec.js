jest.mock('@cupcake/repositories/index', () => {
  const repo = {
    getByUserEmail:     jest.fn().mockResolvedValue([{ a: 1 }]),
    getByUserEmailAndId:jest.fn().mockResolvedValue([{ a: 2 }]),
  };
  return { CupcakeUserStateRepository: jest.fn(() => repo) };
});

const { CupcakeUserStateRepository } = require('@cupcake/repositories/index');
const S = require('../../services/cupcakeUserState/GetByIdCupcakeUserStateCupcake');

describe('GetByIdCupcakeUserStateCupcake Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('/logros -> por email', async () => {
    const repo = new CupcakeUserStateRepository();
    const res = await S.execute({ email: 'A@A.com' });
    expect(repo.getByUserEmail).toHaveBeenCalledWith({ lowerCaseEmail: 'a@a.com' });
    expect(res).toEqual([{ a: 1 }]);
  });

  test('/estados -> por email+id', async () => {
    const repo = new CupcakeUserStateRepository();
    const res = await S.execute({ email: 'a@a.com', id: 5 });
    expect(repo.getByUserEmailAndId).toHaveBeenCalledWith({ lowerCaseEmail: 'a@a.com', id: 5 });
    expect(res).toEqual([{ a: 2 }]);
  });

  test('sin datos -> null', async () => {
    const repo = new CupcakeUserStateRepository();
    repo.getByUserEmailAndId.mockResolvedValueOnce([]);
    const res = await S.execute({ email: 'a@a.com', id: 5 });
    expect(res).toBeNull();
  });
});
