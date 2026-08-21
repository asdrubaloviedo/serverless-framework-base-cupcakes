jest.mock('@cupcake/repositories/index', () => ({
  CupcakeRatingRepository: jest.fn()
}));

const {
  CupcakeRatingRepository
} = require('@cupcake/repositories/index');

const GetCupcakeRating =
  require('../../../services/cupcakeRating/GetCupcakeRating');

describe('GetCupcakeRating', () => {

  let repositoryMock;

  beforeEach(() => {

    jest.clearAllMocks();

    repositoryMock = {
      getByUserEmailAndCupcakeId: jest.fn()
    };

    CupcakeRatingRepository
      .mockImplementation(() => repositoryMock);
  });


  test('lanza error si no se envía email', async () => {

    await expect(
      GetCupcakeRating.execute({
        email: '',
        cupcake: 1
      })
    ).rejects.toThrow(
      'El email es requerido'
    );

    expect(
      CupcakeRatingRepository
    ).not.toHaveBeenCalled();
  });


  test('lanza error si no se envía cupcake', async () => {

    await expect(
      GetCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: null
      })
    ).rejects.toThrow(
      'El cupcake es requerido'
    );

    expect(
      CupcakeRatingRepository
    ).not.toHaveBeenCalled();
  });


  test('devuelve la calificación existente', async () => {

    const esperado = [
      {
        cupcake_calificacion_id: 1,
        usuario_id: 6,
        cupcake_id: 1,
        calificacion: 5,
        comentario: 'Muy excelente'
      }
    ];

    repositoryMock
      .getByUserEmailAndCupcakeId
      .mockResolvedValueOnce(
        esperado
      );

    const result =
      await GetCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1
      });

    expect(
      CupcakeRatingRepository
    ).toHaveBeenCalledTimes(1);

    expect(
      repositoryMock
        .getByUserEmailAndCupcakeId
    ).toHaveBeenCalledTimes(1);

    expect(
      repositoryMock
        .getByUserEmailAndCupcakeId
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: 1
    });

    expect(result).toEqual(
      esperado
    );
  });


  test('devuelve array vacío si no existe calificación', async () => {

    repositoryMock
      .getByUserEmailAndCupcakeId
      .mockResolvedValueOnce([]);

    const result =
      await GetCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1
      });

    expect(result).toEqual([]);
  });


  test('devuelve array vacío si repository devuelve null', async () => {

    repositoryMock
      .getByUserEmailAndCupcakeId
      .mockResolvedValueOnce(null);

    const result =
      await GetCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1
      });

    expect(result).toEqual([]);
  });

});