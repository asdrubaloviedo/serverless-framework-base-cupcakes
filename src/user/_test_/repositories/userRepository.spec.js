jest.mock('@user/models/user', () => ({
  UserModel: {
    create: jest.fn(),
    getCreated: jest.fn(),
    update: jest.fn()
  },
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

  test('update actualiza nombre y avatar del usuario', async () => {
    const repo = new UserRepository();

    await repo.update({
      nombre: 'asdrubal david',
      email: 'asdrubaloviedo@gmail.com',
      avatarId: 5
    });

    expect(UserModel.update).toHaveBeenCalledWith({
      query: expect.stringContaining('UPDATE usuarios'),
      params: [
        'asdrubal',
        'david',
        5,
        'asdrubaloviedo@gmail.com'
      ],
    });
  });

  test('getPreferences obtiene las preferencias del usuario por email', async () => {
    const repo = new UserRepository();

    await repo.getPreferences({
      email: 'asdrubaloviedo@gmail.com'
    });

    expect(UserModel.getCreated).toHaveBeenCalledTimes(1);

    const {
      query,
      params
    } = UserModel.getCreated.mock.calls[0][0];

    expect(query).toContain('FROM usuario_preferencias up');
    expect(query).toContain('INNER JOIN usuarios u');
    expect(query).toContain('ON u.usuario_id = up.usuario_id');
    expect(query).toContain('WHERE u.email = LOWER($1)');

    expect(query).toContain('up.recordatorios');
    expect(query).toContain('up.mensajes');
    expect(query).toContain('up.promociones');
    expect(query).toContain('up.musica');
    expect(query).toContain('up.efectos_sonido');
    expect(query).toContain('up.vibracion');

    expect(params).toEqual([
      'asdrubaloviedo@gmail.com'
    ]);
  });

  test('updatePreferences actualiza todas las preferencias del usuario', async () => {
    const repo = new UserRepository();

    await repo.updatePreferences({
      email: 'asdrubaloviedo@gmail.com',
      recordatorios: false,
      mensajes: true,
      promociones: false,
      musica: true,
      efectos_sonido: false,
      vibracion: true
    });

    expect(UserModel.update).toHaveBeenCalledTimes(1);

    const {
      query,
      params
    } = UserModel.update.mock.calls[0][0];

    expect(query).toContain('UPDATE usuario_preferencias');
    expect(query).toContain('recordatorios = $1');
    expect(query).toContain('mensajes = $2');
    expect(query).toContain('promociones = $3');
    expect(query).toContain('musica = $4');
    expect(query).toContain('efectos_sonido = $5');
    expect(query).toContain('vibracion = $6');

    expect(query).toContain('SELECT usuario_id');
    expect(query).toContain('FROM usuarios');
    expect(query).toContain('WHERE email = LOWER($7)');

    expect(params).toEqual([
      false,
      true,
      false,
      true,
      false,
      true,
      'asdrubaloviedo@gmail.com'
    ]);
  });
});