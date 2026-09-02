jest.mock('@user/models/user', () => ({
  UserModel: { create: jest.fn(), getCreated: jest.fn() },
}));

const { UserModel } = require('@user/models/user');
const UserRepository = require('../../repositories/UserRepository');

beforeEach(() => jest.clearAllMocks());

describe('UserRepository', () => {

  test('create arma SQL y pasa params', async () => {
    const repo = new UserRepository();

    await repo.create({
      nombre: 'Juan Perez',
      email: 'a@a.com'
    });

    expect(UserModel.create).toHaveBeenCalledWith({
      query: expect.stringContaining('INSERT INTO usuarios'),
      params: ['Juan', 'Perez', 'PER', 'a@a.com'],
    });
  });

  test('create con solo un nombre usa segundo nombre indefinido', async () => {
    const repo = new UserRepository();

    await repo.create({
      nombre: 'Juan',
      email: 'a@a.com'
    });

    expect(UserModel.create).toHaveBeenCalledWith({
      query: expect.stringContaining('INSERT INTO usuarios'),
      params: ['Juan', 'indefinido', 'PER', 'a@a.com'],
    });
  });

  test('create sin nombre usa valores por defecto', async () => {
    const repo = new UserRepository();

    await repo.create({
      email: 'a@a.com'
    });

    expect(UserModel.create).toHaveBeenCalledWith({
      query: expect.stringContaining('INSERT INTO usuarios'),
      params: ['', 'indefinido', 'PER', 'a@a.com'],
    });
  });

  test('create con pais personalizado lo pasa en params', async () => {
    const repo = new UserRepository();

    await repo.create({
      nombre: 'Juan Perez',
      email: 'a@a.com',
      pais: 'FRA',
    });

    expect(UserModel.create).toHaveBeenCalledWith({
      query: expect.stringContaining('INSERT INTO usuarios'),
      params: ['Juan', 'Perez', 'FRA', 'a@a.com'],
    });
  });

  test('getCreated obtiene el usuario junto con su avatar', async () => {
    const repo = new UserRepository();

    await repo.getCreated({
      email: 'b@b.com'
    });

    expect(UserModel.getCreated).toHaveBeenCalledTimes(1);

    const {
      query,
      params
    } = UserModel.getCreated.mock.calls[0][0];

    expect(query).toContain('FROM usuarios u');
    expect(query).toContain('INNER JOIN avatares a');
    expect(query).toContain('ON a.avatar_id = u.avatar_id');
    expect(query).toContain('a.nombre AS avatar_nombre');
    expect(query).toContain('a.codigo AS avatar_url');
    expect(query).toContain('WHERE u.email = LOWER($1)');

    expect(params).toEqual(['b@b.com']);
  });
});