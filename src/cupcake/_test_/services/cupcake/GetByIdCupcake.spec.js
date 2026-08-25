jest.mock(
  '@cupcake/repositories/index',
  () => {

    const repo = {

      getRandomByUserEmail:
        jest.fn()
          .mockResolvedValue([
            {
              id: 1
            }
          ]),

      getByFilters:
        jest.fn()
          .mockResolvedValue([
            {
              id: 2
            }
          ]),

      getById:
        jest.fn()
          .mockResolvedValue([
            {
              id: 3
            }
          ]),

      getByIdAndUserEmail:
        jest.fn()
          .mockResolvedValue([
            {
              cupcake_id: 7,
              nombre: 'Cupcake test',
              disponible: true
            }
          ]),
    };

    return {
      CupcakeRepository:
        jest.fn(
          () => repo
        )
    };
  }
);

const {
  CupcakeRepository
} =
  require(
    '@cupcake/repositories/index'
  );

const S =
  require(
    '../../../services/cupcake/GetByIdCupcake'
  );

describe(
  'GetByIdCupcake Service',
  () => {

    beforeEach(
      () => jest.clearAllMocks()
    );

    test(
      '/cupcake con id y email -> getByIdAndUserEmail',
      async () => {

        const repo =
          new CupcakeRepository();

        const res =
          await S.execute({
            id: 7,
            email: 'USER@MAIL.COM'
          });

        expect(
          repo.getByIdAndUserEmail
        ).toHaveBeenCalledWith({
          id: 7,
          lowerCaseEmail:
            'user@mail.com'
        });

        expect(
          repo.getRandomByUserEmail
        ).not.toHaveBeenCalled();

        expect(res).toEqual([
          {
            cupcake_id: 7,
            nombre: 'Cupcake test',
            disponible: true
          }
        ]);
      }
    );

    test(
      '/cupcake con id y email -> null si no existe',
      async () => {

        const repo =
          new CupcakeRepository();

        repo
          .getByIdAndUserEmail
          .mockResolvedValueOnce([]);

        const res =
          await S.execute({
            id: 99,
            email: 'user@mail.com'
          });

        expect(
          repo.getByIdAndUserEmail
        ).toHaveBeenCalledWith({
          id: 99,
          lowerCaseEmail:
            'user@mail.com'
        });

        expect(res).toBeNull();
      }
    );

    test(
      'ramdom/usuario -> getRandomByUserEmail',
      async () => {

        const repo =
          new CupcakeRepository();

        const res =
          await S.execute({
            email: 'A@A.com'
          });

        expect(
          repo.getRandomByUserEmail
        ).toHaveBeenCalledWith({
          lowerCaseEmail:
            'a@a.com'
        });

        expect(res).toEqual([
          {
            id: 1
          }
        ]);
      }
    );

    test(
      'ramdom/usuario -> vacío devuelve []',
      async () => {

        const repo =
          new CupcakeRepository();

        repo
          .getRandomByUserEmail
          .mockResolvedValueOnce([]);

        const res =
          await S.execute({
            email: 'a@a.com'
          });

        expect(res).toEqual([]);
      }
    );

    test(
      'busqueda/usuario -> getByFilters',
      async () => {

        const repo =
          new CupcakeRepository();

        const res =
          await S.execute({
            email: 'x@x.com',
            tiempo: 30,
            dificultad: '2'
          });

        expect(
          repo.getByFilters
        ).toHaveBeenCalledWith({
          email: 'x@x.com',
          tiempo: 30,
          dificultad: '2',
          festividad: undefined,
          predominante: undefined,
          secundario: undefined
        });

        expect(res).toEqual([
          {
            id: 2
          }
        ]);
      }
    );

    test(
      'busqueda/usuario -> vacío devuelve []',
      async () => {

        const repo =
          new CupcakeRepository();

        repo
          .getByFilters
          .mockResolvedValueOnce([]);

        const res =
          await S.execute({
            email: 'x@x.com',
            tiempo: 30
          });

        expect(res).toEqual([]);
      }
    );

    test(
      '/cupcake -> getById con null si vacío',
      async () => {

        const repo =
          new CupcakeRepository();

        repo
          .getById
          .mockResolvedValueOnce([]);

        const res =
          await S.execute({
            id: 7
          });

        expect(
          repo.getById
        ).toHaveBeenCalledWith({
          id: 7
        });

        expect(res).toBeNull();
      }
    );

    test(
      '/cupcake -> con filas',
      async () => {

        const repo =
          new CupcakeRepository();

        const res =
          await S.execute({
            id: 7
          });

        expect(
          repo.getById
        ).toHaveBeenCalledWith({
          id: 7
        });

        expect(res).toEqual([
          {
            id: 3
          }
        ]);
      }
    );
  }
);