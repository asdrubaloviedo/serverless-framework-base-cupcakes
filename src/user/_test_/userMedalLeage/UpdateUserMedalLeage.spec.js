jest.mock('@user/repositories/index', () => ({
  UserMedalLeageRepository: jest.fn(),
}));
const { UserMedalLeageRepository } = require('@user/repositories/index');
const UpdateUserMedalLeage = require('../../services/userMedalLeage/UpdateUserMedalLeage');

beforeEach(() => jest.clearAllMocks());

describe('UpdateUserMedalLeage Service', () => {
  test('actualiza y devuelve estado', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const getUpdated = jest.fn().mockResolvedValue([{ ok: true }]);
    UserMedalLeageRepository.mockImplementation(() => ({ update, getUpdated }));

    const params = { email: 'a@a.com', cupcake: 1, estado: true, valor: 5 };
    const res = await UpdateUserMedalLeage.execute(params);
    expect(update).toHaveBeenCalledWith(params);
    expect(getUpdated).toHaveBeenCalledWith(params);
    expect(res).toEqual([{ ok: true }]);
  });

  test('error en update -> mensaje amigable', async () => {
    const update = jest.fn().mockRejectedValue(new Error('db'));
    const getUpdated = jest.fn();
    UserMedalLeageRepository.mockImplementation(() => ({ update, getUpdated }));

    await expect(
      UpdateUserMedalLeage.execute({ email: 'a@a.com', cupcake: 1, estado: true, valor: 5 })
    ).rejects.toThrow('Error updating the cupcake user state');
    expect(getUpdated).not.toHaveBeenCalled();
  });
});
