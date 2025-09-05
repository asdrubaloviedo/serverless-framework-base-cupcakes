jest.mock('@cupcake/repositories/index', () => {
  const repo = {
    getAllNameImage:                         jest.fn().mockResolvedValue([{ a: 1 }]),
    getAllNameImageByUserEmail:              jest.fn().mockResolvedValue([{ a: 2 }]),
    getAllNameImageByUserEmailAndStatus:     jest.fn().mockResolvedValue([{ a: 3 }]),
    getAllNameImageByCategory:               jest.fn().mockResolvedValue([{ a: 4 }]),
    getAllNameImageByUserEmailAndCategory:   jest.fn().mockResolvedValue([{ a: 5 }]),
    getAllNameImageByFestivity:              jest.fn().mockResolvedValue([{ a: 6 }]),
    getAllNameImageByUserEmailAndFestivity:  jest.fn().mockResolvedValue([{ a: 7 }]),
  };
  return { CupcakeRepository: jest.fn(() => repo) };
});

const { CupcakeRepository } = require('@cupcake/repositories/index');
const S = require('../../../services/cupcake/GetAllNameImageCupcake');

describe('GetAllNameImageCupcake Service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('email solo -> byUserEmail', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({ email: 'X@X.com' });
    expect(repo.getAllNameImageByUserEmail).toHaveBeenCalledWith({ lowerCaseEmail: 'x@x.com' });
    expect(res).toEqual([{ a: 2 }]);
  });

  test('email + estado -> byUserEmailAndStatus', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({ email: 'x@x.com', estado: 2 });
    expect(repo.getAllNameImageByUserEmailAndStatus).toHaveBeenCalledWith({ lowerCaseEmail: 'x@x.com', estado: 2 });
    expect(res).toEqual([{ a: 3 }]);
  });

  test('categoria sin email -> byCategory', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({ categoria: 9 });
    expect(repo.getAllNameImageByCategory).toHaveBeenCalledWith({ categoria: 9 });
    expect(res).toEqual([{ a: 4 }]);
  });

  test('email + categoria -> byUserEmailAndCategory', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({ email: 'x@x.com', categoria: 9 });
    expect(repo.getAllNameImageByUserEmailAndCategory).toHaveBeenCalledWith({ lowerCaseEmail: 'x@x.com', categoria: 9 });
    expect(res).toEqual([{ a: 5 }]);
  });

  test('festividad sin email -> byFestivity', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({ festividad: 4 });
    expect(repo.getAllNameImageByFestivity).toHaveBeenCalledWith({ festividad: 4 });
    expect(res).toEqual([{ a: 6 }]);
  });

  test('email + festividad -> byUserEmailAndFestivity', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({ email: 'a@a.com', festividad: 4 });
    expect(repo.getAllNameImageByUserEmailAndFestivity).toHaveBeenCalledWith({ lowerCaseEmail: 'a@a.com', festividad: 4 });
    expect(res).toEqual([{ a: 7 }]);
  });

  test('default -> getAllNameImage', async () => {
    const repo = new CupcakeRepository();
    const res = await S.execute({});
    expect(repo.getAllNameImage).toHaveBeenCalled();
    expect(res).toEqual([{ a: 1 }]);
  });
});
