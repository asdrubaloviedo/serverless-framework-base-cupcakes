jest.mock('@cupcake/models/cupcake', () => ({
  CupcakeRatingModel: {
    getByUserEmailAndCupcakeId: jest.fn(),
    isCupcakeDone: jest.fn(),
    save: jest.fn(),
  }
}));

const {
  CupcakeRatingModel
} = require('@cupcake/models/cupcake');

const CupcakeRatingRepository =
  require('../../repositories/CupcakeRatingRepository');

describe('CupcakeRatingRepository', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getByUserEmailAndCupcakeId -> SELECT con email y cupcake', async () => {

    const esperado = [
      {
        cupcake_calificacion_id: 1,
        usuario_id: 6,
        cupcake_id: 1,
        calificacion: 5,
        comentario: 'Muy bueno'
      }
    ];

    CupcakeRatingModel
      .getByUserEmailAndCupcakeId
      .mockResolvedValueOnce(esperado);

    const repository =
      new CupcakeRatingRepository();

    const result =
      await repository.getByUserEmailAndCupcakeId({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1
      });

    expect(
      CupcakeRatingModel
        .getByUserEmailAndCupcakeId
    ).toHaveBeenCalledTimes(1);

    const {
      query,
      params
    } =
      CupcakeRatingModel
        .getByUserEmailAndCupcakeId
        .mock.calls[0][0];

    expect(params).toEqual([
      'asdrubaloviedo2@gmail.com',
      1
    ]);

    expect(query).toMatch(
      /FROM cupcake_calificaciones/
    );

    expect(query).toMatch(
      /LOWER\(us\.email\)/
    );

    expect(result).toEqual(
      esperado
    );
  });


  test('isCupcakeDone -> verifica estado 2 y valor TRUE', async () => {

    const esperado = [
      {
        hecho: true
      }
    ];

    CupcakeRatingModel
      .isCupcakeDone
      .mockResolvedValueOnce(esperado);

    const repository =
      new CupcakeRatingRepository();

    const result =
      await repository.isCupcakeDone({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1
      });

    expect(
      CupcakeRatingModel
        .isCupcakeDone
    ).toHaveBeenCalledTimes(1);

    const {
      query,
      params
    } =
      CupcakeRatingModel
        .isCupcakeDone
        .mock.calls[0][0];

    expect(params).toEqual([
      'asdrubaloviedo2@gmail.com',
      1
    ]);

    expect(query).toMatch(
      /FROM cupcake_usuario_estados/
    );

    expect(query).toMatch(
      /estado_id = 2/
    );

    expect(query).toMatch(
      /valor = TRUE/
    );

    expect(result).toEqual(
      esperado
    );
  });


  test('save -> INSERT con ON CONFLICT para crear o actualizar', async () => {

    const esperado = [
      {
        cupcake_calificacion_id: 1,
        usuario_id: 6,
        cupcake_id: 1,
        calificacion: 4,
        comentario: 'Excelente'
      }
    ];

    CupcakeRatingModel
      .save
      .mockResolvedValueOnce(esperado);

    const repository =
      new CupcakeRatingRepository();

    const result =
      await repository.save({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1,
        calificacion: 4,
        comentario: 'Excelente'
      });

    expect(
      CupcakeRatingModel.save
    ).toHaveBeenCalledTimes(1);

    const {
      query,
      params
    } =
      CupcakeRatingModel
        .save
        .mock.calls[0][0];

    expect(params).toEqual([
      'asdrubaloviedo2@gmail.com',
      1,
      4,
      'Excelente'
    ]);

    expect(query).toMatch(
      /INSERT INTO cupcake_calificaciones/
    );

    expect(query).toMatch(
      /ON CONFLICT/
    );

    expect(query).toMatch(
      /DO UPDATE SET/
    );

    expect(query).toMatch(
      /fecha_actualizacion = NOW\(\)/
    );

    expect(query).toMatch(
      /RETURNING/
    );

    expect(result).toEqual(
      esperado
    );
  });

});