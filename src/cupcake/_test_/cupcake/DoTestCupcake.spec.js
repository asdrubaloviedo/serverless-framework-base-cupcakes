jest.mock('@cupcake/repositories/index', () => {
  const repo = { doTest: jest.fn().mockResolvedValue('Test') };
  return { CupcakeRepository: jest.fn(() => repo) };
});
const { CupcakeRepository } = require('@cupcake/repositories/index');
const S = require('../../services/cupcake/DoTestCupcake');

describe('DoTestCupcake', () => {
  beforeEach(() => jest.clearAllMocks());

  test('ejecuta repo.doTest', async () => {
    const repo = new CupcakeRepository();
    const r = await S.execute();
    expect(repo.doTest).toHaveBeenCalled();
    expect(r).toBe('Test');
  });
});
