jest.mock('@cupcake/models/cupcake', () => ({
  CupcakeModel: {
    getAllWithFilters: jest.fn(),
    getByFilters: jest.fn(),
  }
}));

const { CupcakeModel } = require('@cupcake/models/cupcake');
const Repo = require('../../repositories/CupcakeRepository');

describe('CupcakeRepository filtros – ramas dinámicas', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAllWithFilters: todos los filtros -> placeholders $2..$5 y params en orden', async () => {
    const r = new Repo();
    await r.getAllWithFilters({
      tiempo: 120,
      dificultad: '3',
      festividad: '4',
      predominante: 'rojo',
      secundario: 'azul'
    });

    const { query, params } = CupcakeModel.getAllWithFilters.mock.calls[0][0];

    expect(String(query)).toMatch(/AND \(cu\.dificultad_id = \$2\)/);
    expect(String(query)).toMatch(/AND \(cu\.festividad_id = \$3\)/);
    expect(String(query)).toMatch(/AND \(cu\.colorPredominante = \$4\)/);
    expect(String(query)).toMatch(/AND \(cu\.colorSecundario = \$5\)/);

    // El repo arma siempre este array fijo en ese orden
    expect(params).toEqual([120, '3', '4', 'rojo', 'azul']);
  });

  test('getAllWithFilters: solo colorSecundario -> solo $2 y sin otras condiciones', async () => {
    const r = new Repo();
    await r.getAllWithFilters({
      tiempo: 90,
      dificultad: '0',
      festividad: '0',
      predominante: 'todos',
      secundario: 'azul'
    });

    const { query, params } = CupcakeModel.getAllWithFilters.mock.calls[0][0];

    expect(String(query)).toMatch(/AND \(cu\.colorSecundario = \$2\)/);
    expect(String(query)).not.toMatch(/dificultad_id = \$/);
    expect(String(query)).not.toMatch(/festividad_id = \$/);
    expect(String(query)).not.toMatch(/colorPredominante = \$/);

    // De nuevo, el repo mantiene la firma fija de params
    expect(params).toEqual([90, '0', '0', 'todos', 'azul']);
  });

  test('getByFilters: con todos los filtros -> placeholders $3..$6 y params en orden (con mapeo de festividad)', async () => {
    const r = new Repo();
    await r.getByFilters({
      email: 'a@a.com',
      tiempo: 60,
      dificultad: '2',
      festividad: '3',
      predominante: 'rojo',
      secundario: 'verde'
    });

    const { query, params } = CupcakeModel.getByFilters.mock.calls[0][0];

    // Placeholders que construye el repo
    expect(String(query)).toMatch(/AND \(cu\.dificultad_id = \$3\)/);
    expect(String(query)).toMatch(/AND \(cu\.festividad_id = \$4\)/);
    expect(String(query)).toMatch(/AND \(cu\.colorPredominante = \$5\)/);
    expect(String(query)).toMatch(/AND \(cu\.colorSecundario = \$6\)/);

    // El repo:
    // - convierte dificultad a number (2)
    // - mapea festividad '3' -> 2
    // por lo que params queda:
    // ['a@a.com', 60, 2, 2, 'rojo', 'verde']
    expect(params).toEqual(['a@a.com', 60, 2, 2, 'rojo', 'verde']);
  });
});
