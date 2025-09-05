jest.mock('@user/models/user', () => ({
  UserMedalLeageModel: {
    create: jest.fn(),
    getByUserEmailAndMedal: jest.fn(),
    update: jest.fn(),
    getUpdated: jest.fn(),
  },
}));

const { UserMedalLeageModel } = require('@user/models/user');
const UserMedalLeageRepository = require('../../repositories/UserMedalLeageRepository');

beforeEach(() => jest.clearAllMocks());

describe('UserMedalLeageRepository', () => {
  test('create arma SQL y pasa params', async () => {
    const repo = new UserMedalLeageRepository();
    await repo.create({ email: 'a@a.com', medalla: 7 });
    expect(UserMedalLeageModel.create).toHaveBeenCalledWith({
      query: expect.stringContaining('INSERT INTO usuario_medallas_liga'),
      params: ['a@a.com', 7],
    });
  });

  test('getByUserEmailAndMedal arma SQL y pasa params', async () => {
    const repo = new UserMedalLeageRepository();
    await repo.getByUserEmailAndMedal({ email: 'b@b.com', medalla: 3 });
    expect(UserMedalLeageModel.getByUserEmailAndMedal).toHaveBeenCalledWith({
      query: expect.stringContaining('FROM usuario_medallas_liga'),
      params: ['b@b.com', 3],
    });
  });

  test('update pasa params (query placeholder)', async () => {
    const repo = new UserMedalLeageRepository();
    await repo.update({ email: 'c@c.com', cupcake: 1, estado: true, valor: 5 });
    expect(UserMedalLeageModel.update).toHaveBeenCalledWith({
      query: expect.stringContaining('Falta query'),
      params: ['c@c.com', 1, true, 5],
    });
  });

  test('getUpdated pasa params (query placeholder)', async () => {
    const repo = new UserMedalLeageRepository();
    await repo.getUpdated({ email: 'd@d.com', cupcake: 2, estado: false, valor: 10 });
    expect(UserMedalLeageModel.getUpdated).toHaveBeenCalledWith({
      query: expect.stringContaining('Falta query'),
      params: ['d@d.com', 2, false, 10],
    });
  });
});
