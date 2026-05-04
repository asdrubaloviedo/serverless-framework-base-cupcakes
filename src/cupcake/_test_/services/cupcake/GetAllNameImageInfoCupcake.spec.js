jest.mock('@cupcake/repositories/index', () => {
  const repo = {
    getAllNameImageInfoByUserEmail: jest.fn(),
    getAllNameImageInfoPackagesByUserEmail: jest.fn(),
    getAllNameImageInfoMissingPackagesByUserEmail: jest.fn(),
  };

  return {
    CupcakeRepository: jest.fn(() => repo),
  };
});

const { CupcakeRepository } = require('@cupcake/repositories/index');
const S = require('../../../services/cupcake/GetAllNameImageInfoCupcake');

describe('GetAllNameImageInfoCupcake Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sin email retorna arreglo vacío y no consulta repositorio', async () => {
    const repo = new CupcakeRepository();

    const res = await S.execute({});

    expect(res).toEqual([]);
    expect(repo.getAllNameImageInfoByUserEmail).not.toHaveBeenCalled();
  });

  test('email sin cupcakes retorna total 0 y arreglo vacío', async () => {
    const repo = new CupcakeRepository();

    repo.getAllNameImageInfoByUserEmail.mockResolvedValueOnce([]);

    const res = await S.execute({ email: 'USER@MAIL.COM' });

    expect(repo.getAllNameImageInfoByUserEmail).toHaveBeenCalledWith({
      lowerCaseEmail: 'user@mail.com',
    });

    expect(res).toEqual({
      paquete: 'Pack Personal',
      total_cupcakes: 0,
      cupcakes: [],
    });
  });

  test('email con cupcakes retorna total numérico y omite total_cupcakes en cada item', async () => {
    const repo = new CupcakeRepository();

    repo.getAllNameImageInfoByUserEmail.mockResolvedValueOnce([
      {
        total_cupcakes: '2',
        cupcake_id: 1,
        nombre: 'Chocolate',
      },
      {
        total_cupcakes: '2',
        cupcake_id: 2,
        nombre: 'Vainilla',
      },
    ]);

    const res = await S.execute({ email: 'USER@MAIL.COM' });

    expect(repo.getAllNameImageInfoByUserEmail).toHaveBeenCalledWith({
      lowerCaseEmail: 'user@mail.com',
    });

    expect(res).toEqual({
      paquete: 'Pack Personal',
      total_cupcakes: 2,
      cupcakes: [
        {
          cupcake_id: 1,
          nombre: 'Chocolate',
        },
        {
          cupcake_id: 2,
          nombre: 'Vainilla',
        },
      ],
    });
  });

  test('tipo paquetes sin email retorna arreglo vacío y no consulta repositorio', async () => {
    const repo = new CupcakeRepository();

    const res = await S.execute({ tipo: 'paquetes' });

    expect(res).toEqual([]);
    expect(repo.getAllNameImageInfoPackagesByUserEmail).not.toHaveBeenCalled();
  });

  test('tipo paquetes sin resultados retorna arreglo vacío', async () => {
    const repo = new CupcakeRepository();

    repo.getAllNameImageInfoPackagesByUserEmail.mockResolvedValueOnce([]);

    const res = await S.execute({
      email: 'USER@MAIL.COM',
      tipo: 'paquetes',
    });

    expect(repo.getAllNameImageInfoPackagesByUserEmail).toHaveBeenCalledWith({
      lowerCaseEmail: 'user@mail.com',
    });

    expect(res).toEqual([]);
  });

  test('tipo paquetes agrupa cupcakes por paquete', async () => {
    const repo = new CupcakeRepository();

    repo.getAllNameImageInfoPackagesByUserEmail.mockResolvedValueOnce([
      {
        paquete_id: 2,
        paquete: 'San Valentin basico',
        total_cupcakes: '2',
        cupcake_id: 10,
        nombre: 'Cupcake Amor',
        codigo: 'url-1',
        hecho: true,
        tiempo: 30,
        porciones: 10,
      },
      {
        paquete_id: 2,
        paquete: 'San Valentin basico',
        total_cupcakes: '2',
        cupcake_id: 11,
        nombre: 'Cupcake Corazon',
        codigo: 'url-2',
        hecho: false,
        tiempo: 40,
        porciones: 12,
      },
      {
        paquete_id: 3,
        paquete: 'Pascua basico',
        total_cupcakes: '1',
        cupcake_id: 20,
        nombre: 'Cupcake Conejo',
        codigo: 'url-3',
        hecho: false,
        tiempo: 35,
        porciones: 8,
      },
    ]);

    const res = await S.execute({
      email: 'USER@MAIL.COM',
      tipo: 'paquetes',
    });

    expect(repo.getAllNameImageInfoPackagesByUserEmail).toHaveBeenCalledWith({
      lowerCaseEmail: 'user@mail.com',
    });

    expect(res).toEqual([
      {
        paquete: 'San Valentin basico',
        total_cupcakes: 2,
        cupcakes: [
          {
            cupcake_id: 10,
            nombre: 'Cupcake Amor',
            codigo: 'url-1',
            hecho: true,
            tiempo: 30,
            porciones: 10,
          },
          {
            cupcake_id: 11,
            nombre: 'Cupcake Corazon',
            codigo: 'url-2',
            hecho: false,
            tiempo: 40,
            porciones: 12,
          },
        ],
      },
      {
        paquete: 'Pascua basico',
        total_cupcakes: 1,
        cupcakes: [
          {
            cupcake_id: 20,
            nombre: 'Cupcake Conejo',
            codigo: 'url-3',
            hecho: false,
            tiempo: 35,
            porciones: 8,
          },
        ],
      },
    ]);
  });

  test('tipo paquetes-faltantes sin resultados retorna arreglo vacío', async () => {
    const repo = new CupcakeRepository();

    repo.getAllNameImageInfoMissingPackagesByUserEmail.mockResolvedValueOnce([]);

    const res = await S.execute({
      email: 'USER@MAIL.COM',
      tipo: 'paquetes-faltantes',
    });

    expect(
      repo.getAllNameImageInfoMissingPackagesByUserEmail
    ).toHaveBeenCalledWith({
      lowerCaseEmail: 'user@mail.com',
    });

    expect(res).toEqual([]);
  });

  test('tipo paquetes-faltantes agrupa cupcakes por paquete con precio', async () => {
    const repo = new CupcakeRepository();

    repo.getAllNameImageInfoMissingPackagesByUserEmail.mockResolvedValueOnce([
      {
        paquete_id: 4,
        paquete: 'Halloween basico',
        moneda: 'PEN',
        monto_centavos: 2000,
        total_cupcakes: '2',
        cupcake_id: 30,
        nombre: 'Cupcake Fantasma',
        codigo: 'url-1',
        hecho: false,
        tiempo: 30,
        porciones: 10,
      },
      {
        paquete_id: 4,
        paquete: 'Halloween basico',
        moneda: 'PEN',
        monto_centavos: 2000,
        total_cupcakes: '2',
        cupcake_id: 31,
        nombre: 'Cupcake Calabaza',
        codigo: 'url-2',
        hecho: false,
        tiempo: 40,
        porciones: 12,
      },
    ]);

    const res = await S.execute({
      email: 'USER@MAIL.COM',
      tipo: 'paquetes-faltantes',
    });

    expect(
      repo.getAllNameImageInfoMissingPackagesByUserEmail
    ).toHaveBeenCalledWith({
      lowerCaseEmail: 'user@mail.com',
    });

    expect(res).toEqual([
      {
        paquete: 'Halloween basico',
        precio: {
          moneda: 'PEN',
          monto_centavos: 2000,
          monto: 20,
        },
        total_cupcakes: 2,
        cupcakes: [
          {
            cupcake_id: 30,
            nombre: 'Cupcake Fantasma',
            codigo: 'url-1',
            hecho: false,
            tiempo: 30,
            porciones: 10,
          },
          {
            cupcake_id: 31,
            nombre: 'Cupcake Calabaza',
            codigo: 'url-2',
            hecho: false,
            tiempo: 40,
            porciones: 12,
          },
        ],
      },
    ]);
  });
});