jest.mock('@user/repositories/index', () => ({
  UserMedalLeageRepository: jest.fn(),
}));
const { UserMedalLeageRepository } = require('@user/repositories/index');
const CreateOneUserMedalLeage = require('../../services/userMedalLeage/CreateOneUserMedalLeage');

beforeEach(() => jest.clearAllMocks());

describe('CreateOneUserMedalLeage Service', () => {
  test('crea y devuelve estado', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const getByUserEmailAndMedal = jest.fn().mockResolvedValue([{ id: 1 }]);
    UserMedalLeageRepository.mockImplementation(() => ({ create, getByUserEmailAndMedal }));

    const res = await CreateOneUserMedalLeage.execute({ email: 'a@a.com', medalla: 'oro' });
    expect(create).toHaveBeenCalledWith({ email: 'a@a.com', medalla: 'oro' });
    expect(getByUserEmailAndMedal).toHaveBeenCalledWith({ email: 'a@a.com', medalla: 'oro' });
    expect(res).toEqual([{ id: 1 }]);
  });

  test('error en create -> mensaje amigable', async () => {
    const create = jest.fn().mockRejectedValue(new Error('db'));
    const getByUserEmailAndMedal = jest.fn();
    UserMedalLeageRepository.mockImplementation(() => ({ create, getByUserEmailAndMedal }));

    await expect(
      CreateOneUserMedalLeage.execute({ email: 'a@a.com', medalla: 'oro' })
    ).rejects.toThrow('Error creating the user medal state');
    expect(getByUserEmailAndMedal).not.toHaveBeenCalled();
  });
});
