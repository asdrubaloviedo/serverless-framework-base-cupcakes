jest.mock('@cupcake/repositories/index', () => {
  const repo = {
    getAllNameImageMovies:           jest.fn().mockResolvedValue([{ id: 1 }]),
    getAllNameImageMoviesByUserEmail:jest.fn().mockResolvedValue([{ id: 2 }]),
  };
  return { CupcakeRepository: jest.fn(() => repo) };
});

const { CupcakeRepository } = require('@cupcake/repositories/index');
const S = require('../../../services/cupcake/GetAllNameImageMoviesCupcake');

describe('GetAllNameImageMoviesCupcake Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('email -> byUserEmail', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({ email: 'A@A.com' });
    expect(repo.getAllNameImageMoviesByUserEmail).toHaveBeenCalledWith({ lowerCaseEmail: 'a@a.com' });
    expect(res).toEqual([{ id: 2 }]);
  });

  test('sin email -> getAllNameImageMovies', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({});
    expect(repo.getAllNameImageMovies).toHaveBeenCalled();
    expect(res).toEqual([{ id: 1 }]);
  });

  test('sin datos -> []', async () => {
    const repo = new CupcakeRepository();
    repo.getAllNameImageMovies.mockResolvedValueOnce([]);
    const res = await S.execute({});
    expect(res).toEqual([]);
  });
});
