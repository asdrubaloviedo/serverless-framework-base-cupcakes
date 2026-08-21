jest.mock('@cupcake/repositories/index', () => ({
  CupcakeRatingRepository: jest.fn()
}));

const {
  CupcakeRatingRepository
} = require('@cupcake/repositories/index');

const SaveCupcakeRating =
  require('../../../services/cupcakeRating/SaveCupcakeRating');

describe('SaveCupcakeRating', () => {

  let repositoryMock;

  beforeEach(() => {

    jest.clearAllMocks();

    repositoryMock = {
      isCupcakeDone: jest.fn(),
      save: jest.fn()
    };

    CupcakeRatingRepository
      .mockImplementation(() => repositoryMock);
  });


  test('lanza error si no se envía email', async () => {

    await expect(
      SaveCupcakeRating.execute({
        email: '',
        cupcake: 1,
        calificacion: 5,
        comentario: 'Muy bueno'
      })
    ).rejects.toThrow(
      'El email es requerido'
    );
  });


  test('lanza error si no se envía cupcake', async () => {

    await expect(
      SaveCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: null,
        calificacion: 5,
        comentario: 'Muy bueno'
      })
    ).rejects.toThrow(
      'El cupcake es requerido'
    );
  });


  test('lanza error si calificacion es undefined', async () => {

    await expect(
      SaveCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1,
        calificacion: undefined,
        comentario: 'Muy bueno'
      })
    ).rejects.toThrow(
      'La calificación es requerida'
    );
  });


  test('lanza error si calificacion es null', async () => {

    await expect(
      SaveCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1,
        calificacion: null,
        comentario: 'Muy bueno'
      })
    ).rejects.toThrow(
      'La calificación es requerida'
    );
  });


  test('lanza error si calificacion no es entero', async () => {

    await expect(
      SaveCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1,
        calificacion: 3.5,
        comentario: 'Muy bueno'
      })
    ).rejects.toThrow(
      'La calificación debe estar entre 1 y 5'
    );
  });


  test('lanza error si calificacion es menor que 1', async () => {

    await expect(
      SaveCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1,
        calificacion: 0,
        comentario: 'Muy bueno'
      })
    ).rejects.toThrow(
      'La calificación debe estar entre 1 y 5'
    );
  });


  test('lanza error si calificacion es mayor que 5', async () => {

    await expect(
      SaveCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1,
        calificacion: 6,
        comentario: 'Muy bueno'
      })
    ).rejects.toThrow(
      'La calificación debe estar entre 1 y 5'
    );
  });


  test('lanza error si el cupcake no está marcado como hecho', async () => {

    repositoryMock
      .isCupcakeDone
      .mockResolvedValueOnce([
        {
          hecho: false
        }
      ]);

    await expect(
      SaveCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1,
        calificacion: 5,
        comentario: 'Muy bueno'
      })
    ).rejects.toThrow(
      'Debes marcar como hecho el cupcake antes de poder calificarlo'
    );

    expect(
      repositoryMock.isCupcakeDone
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: 1
    });

    expect(
      repositoryMock.save
    ).not.toHaveBeenCalled();
  });


  test('lanza error si isCupcakeDone devuelve un array vacío', async () => {

    repositoryMock
      .isCupcakeDone
      .mockResolvedValueOnce([]);

    await expect(
      SaveCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1,
        calificacion: 5,
        comentario: 'Muy bueno'
      })
    ).rejects.toThrow(
      'Debes marcar como hecho el cupcake antes de poder calificarlo'
    );
  });


  test('lanza error si isCupcakeDone no devuelve un array', async () => {

    repositoryMock
      .isCupcakeDone
      .mockResolvedValueOnce(null);

    await expect(
      SaveCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1,
        calificacion: 5,
        comentario: 'Muy bueno'
      })
    ).rejects.toThrow(
      'Debes marcar como hecho el cupcake antes de poder calificarlo'
    );
  });


  test('guarda correctamente una calificacion cuando el cupcake está hecho', async () => {

    repositoryMock
      .isCupcakeDone
      .mockResolvedValueOnce([
        {
          hecho: true
        }
      ]);

    const esperado = [
      {
        cupcake_calificacion_id: 1,
        usuario_id: 6,
        cupcake_id: 1,
        calificacion: 5,
        comentario: 'Muy bueno'
      }
    ];

    repositoryMock
      .save
      .mockResolvedValueOnce(
        esperado
      );

    const result =
      await SaveCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1,
        calificacion: 5,
        comentario: '  Muy bueno  '
      });

    expect(
      repositoryMock.isCupcakeDone
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: 1
    });

    expect(
      repositoryMock.save
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: 1,
      calificacion: 5,
      comentario: 'Muy bueno'
    });

    expect(result).toEqual(
      esperado
    );
  });


  test('convierte calificacion string a número', async () => {

    repositoryMock
      .isCupcakeDone
      .mockResolvedValueOnce([
        {
          hecho: true
        }
      ]);

    repositoryMock
      .save
      .mockResolvedValueOnce([]);

    await SaveCupcakeRating.execute({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: 1,
      calificacion: '4',
      comentario: 'Bueno'
    });

    expect(
      repositoryMock.save
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: 1,
      calificacion: 4,
      comentario: 'Bueno'
    });
  });


  test('convierte comentario null a cadena vacía', async () => {

    repositoryMock
      .isCupcakeDone
      .mockResolvedValueOnce([
        {
          hecho: true
        }
      ]);

    repositoryMock
      .save
      .mockResolvedValueOnce([]);

    await SaveCupcakeRating.execute({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: 1,
      calificacion: 5,
      comentario: null
    });

    expect(
      repositoryMock.save
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: 1,
      calificacion: 5,
      comentario: ''
    });
  });


  test('convierte comentario undefined a cadena vacía', async () => {

    repositoryMock
      .isCupcakeDone
      .mockResolvedValueOnce([
        {
          hecho: true
        }
      ]);

    repositoryMock
      .save
      .mockResolvedValueOnce([]);

    await SaveCupcakeRating.execute({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: 1,
      calificacion: 5,
      comentario: undefined
    });

    expect(
      repositoryMock.save
    ).toHaveBeenCalledWith({
      email: 'asdrubaloviedo2@gmail.com',
      cupcake: 1,
      calificacion: 5,
      comentario: ''
    });
  });


  test('devuelve array vacío si repository.save devuelve null', async () => {

    repositoryMock
      .isCupcakeDone
      .mockResolvedValueOnce([
        {
          hecho: true
        }
      ]);

    repositoryMock
      .save
      .mockResolvedValueOnce(
        null
      );

    const result =
      await SaveCupcakeRating.execute({
        email: 'asdrubaloviedo2@gmail.com',
        cupcake: 1,
        calificacion: 5,
        comentario: 'Muy bueno'
      });

    expect(result).toEqual([]);
  });

});