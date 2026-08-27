jest.mock('@cupcake/controller/cupcake', () => ({
  doTest:
    jest.fn().mockResolvedValue('ok'),

  getAll:
    jest.fn().mockResolvedValue([
      {
        ok: 'all'
      }
    ]),

  getAllNameImage:
    jest.fn().mockResolvedValue([
      {
        ok: 'ni'
      }
    ]),

  getAllNameImageMovies:
    jest.fn().mockResolvedValue([
      {
        ok: 'mov'
      }
    ]),

  getAllNameImageInfoByUserEmail:
    jest.fn().mockResolvedValue([
      {
        ok: 'info'
      }
    ]),

  getById:
    jest.fn().mockResolvedValue([
      {
        ok: 'id'
      }
    ]),

  getByIdInfoImage:
    jest.fn().mockResolvedValue([
      {
        ok: 'img'
      }
    ]),

  getByIdCupcakeUserState:
    jest.fn().mockResolvedValue([
      {
        ok: 'state'
      }
    ]),

  createOneCupcakeUserState:
    jest.fn().mockResolvedValue([
      {
        ok: 'create-state'
      }
    ]),

  patchOneCupcakeUserState:
    jest.fn().mockResolvedValue([
      {
        ok: 'patch-state'
      }
    ]),

  getCupcakeRating:
    jest.fn().mockResolvedValue([
      {
        ok: 'rating'
      }
    ]),

  saveCupcakeRating:
    jest.fn().mockResolvedValue([
      {
        ok: 'save-rating'
      }
    ]),

  getAllRamdom:
    jest.fn().mockResolvedValue([
      {
        ok: 'rnd'
      }
    ]),

  getAllNameImageFiltros:
    jest.fn().mockResolvedValue([
      {
        ok: 'flt'
      }
    ]),

  /*
   * =========================================================
   * COLLECTIONS
   * =========================================================
   */

  getCupcakeCollections:
    jest.fn().mockResolvedValue([
      {
        collection_id: 1,
        nombre: 'Cumpleaños',
        total_recetas: 2,
        seleccionada: false
      }
    ]),

  getCupcakesByCollection:
    jest.fn().mockResolvedValue([
      {
        cupcake_id: 1,
        nombre: 'Cupcake test',
        codigo:
          'https://example.com/test.jpg'
      }
    ]),

  createCupcakeCollection:
    jest.fn().mockResolvedValue([
      {
        collection_id: 1,
        nombre: 'Cumpleaños'
      }
    ]),

  saveCupcakeCollection:
    jest.fn().mockResolvedValue([
      {
        collection_id: 1,
        cupcake_id: 1
      }
    ]),
}));


jest.mock('@cupcake/schema/cupcake', () => ({

  validateCupcakeUserState:
    jest.fn(
      data => ({
        success: true,
        data,
      })
    ),

  validatePartialCupcakeUserState:
    jest.fn(
      data => ({
        success: true,
        data,
      })
    ),

  validateCupcakeRating:
    jest.fn(
      data => ({
        success: true,
        data,
      })
    ),

  /*
   * Estos mocks permiten que el handler
   * pueda cargar también las rutas POST
   * de collections si las necesita.
   */
  validateCupcakeCollection:
    jest.fn(
      data => ({
        success: true,
        data,
      })
    ),

  validateCupcakeCollectionCupcake:
    jest.fn(
      data => ({
        success: true,
        data,
      })
    ),
}));


const Ctrl =
  require(
    '@cupcake/controller/cupcake'
  );

const {
  handler
} =
  require(
    '../../handlers/cupcake'
  );


describe(
  'Cupcake handler rutas varias (smoke)',
  () => {

    beforeEach(
      () => {

        jest.clearAllMocks();

        process.env.ENDPOINT_ROOT =
          '';

        process.env.CUPCAKE_MODULE =
          'cupcakes';
      }
    );


    /*
     * =========================================================
     * TEST
     * =========================================================
     */

    test(
      'GET /test -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/test',
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.doTest
        ).toHaveBeenCalled();
      }
    );


    /*
     * =========================================================
     * CUPCAKES
     * =========================================================
     */

    test(
      'GET /usuario -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/usuario',

            queryStringParameters: {
              email:
                'test@test.com',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAll
        ).toHaveBeenCalledWith({
          email:
            'test@test.com',
        });
      }
    );


    test(
      'GET /busqueda -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/busqueda',

            queryStringParameters: {
              tiempo:
                '30',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAll
        ).toHaveBeenCalledWith({
          tiempo:
            '30',
        });
      }
    );


    /*
     * =========================================================
     * NAME IMAGE
     * =========================================================
     */

    test(
      'GET /name-image -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/name-image',
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAllNameImage
        ).toHaveBeenCalled();
      }
    );


    test(
      'GET /name-image-categoria -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/name-image-categoria',

            queryStringParameters: {
              categoria:
                '2',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAllNameImage
        ).toHaveBeenCalledWith({
          categoria:
            '2',
        });
      }
    );


    test(
      'GET /name-image-categoria/usuario -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/name-image-categoria/usuario',

            queryStringParameters: {
              email:
                'test@test.com',

              categoria:
                '2',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAllNameImage
        ).toHaveBeenCalledWith({
          email:
            'test@test.com',

          categoria:
            '2',
        });
      }
    );


    test(
      'GET /name-image-estado -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/name-image-estado',

            queryStringParameters: {
              email:
                'test@test.com',

              estado:
                '2',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAllNameImage
        ).toHaveBeenCalledWith({
          email:
            'test@test.com',

          estado:
            '2',
        });
      }
    );


    test(
      'GET /name-image/usuario -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/name-image/usuario',

            queryStringParameters: {
              email:
                'test@test.com',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAllNameImage
        ).toHaveBeenCalledWith({
          email:
            'test@test.com',
        });
      }
    );


    test(
      'GET /name-image-festividad -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/name-image-festividad',

            queryStringParameters: {
              festividad:
                '4',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAllNameImage
        ).toHaveBeenCalledWith({
          festividad:
            '4',
        });
      }
    );


    test(
      'GET /name-image-festividad/usuario -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/name-image-festividad/usuario',

            queryStringParameters: {
              email:
                'test@test.com',

              festividad:
                '4',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAllNameImage
        ).toHaveBeenCalledWith({
          email:
            'test@test.com',

          festividad:
            '4',
        });
      }
    );


    test(
      'GET /name-image-peliculas -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/name-image-peliculas',
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAllNameImageMovies
        ).toHaveBeenCalled();
      }
    );


    test(
      'GET /name-image-peliculas/usuario -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/name-image-peliculas/usuario',

            queryStringParameters: {
              email:
                'test@test.com',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAllNameImageMovies
        ).toHaveBeenCalledWith({
          email:
            'test@test.com',
        });
      }
    );


    /*
     * =========================================================
     * DETALLE
     * =========================================================
     */

    test(
      'GET /cupcake -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/cupcake',

            queryStringParameters: {
              id:
                '1',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getById
        ).toHaveBeenCalledWith({
          id:
            '1',
        });
      }
    );


    test(
      'GET /busqueda/usuario -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/busqueda/usuario',

            queryStringParameters: {
              email:
                'test@test.com',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getById
        ).toHaveBeenCalledWith({
          email:
            'test@test.com',
        });
      }
    );


    test(
      'GET /ramdom/usuario -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/ramdom/usuario',

            queryStringParameters: {
              email:
                'test@test.com',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getById
        ).toHaveBeenCalledWith({
          email:
            'test@test.com',
        });
      }
    );


    test(
      'GET /all-image -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/all-image',

            queryStringParameters: {
              id:
                '1',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getByIdInfoImage
        ).toHaveBeenCalledWith({
          id:
            '1',
        });
      }
    );


    /*
     * =========================================================
     * ESTADOS
     * =========================================================
     */

    test(
      'GET /estados -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/estados',

            queryStringParameters: {
              email:
                'test@test.com',

              id:
                '1',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getByIdCupcakeUserState
        ).toHaveBeenCalledWith({
          email:
            'test@test.com',

          id:
            '1',
        });
      }
    );


    test(
      'GET /logros -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/logros',
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getByIdCupcakeUserState
        ).toHaveBeenCalled();
      }
    );


    /*
     * =========================================================
     * CALIFICACIONES
     * =========================================================
     */

    test(
      'GET /calificacion -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/calificacion',

            queryStringParameters: {
              email:
                'asdrubaloviedo2@gmail.com',

              id:
                '1',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getCupcakeRating
        ).toHaveBeenCalledWith({
          email:
            'asdrubaloviedo2@gmail.com',

          id:
            '1',
        });
      }
    );


    test(
      'POST /calificacion -> 200',
      async () => {

        const body = {
          email:
            'asdrubaloviedo2@gmail.com',

          cupcake:
            1,

          calificacion:
            5,

          comentario:
            'Muy bueno',
        };

        const r =
          await handler({
            httpMethod:
              'POST',

            rawPath:
              '/cupcakes/calificacion',

            body:
              JSON.stringify(
                body
              ),
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.saveCupcakeRating
        ).toHaveBeenCalledWith(
          body
        );
      }
    );


    /*
     * =========================================================
     * RANDOM / FILTROS
     * =========================================================
     */

    test(
      'GET /ramdom -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/ramdom',
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAllRamdom
        ).toHaveBeenCalled();
      }
    );


    test(
      'GET /name-image-filtros -> 200',
      async () => {

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/name-image-filtros',
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getAllNameImageFiltros
        ).toHaveBeenCalled();
      }
    );


    /*
     * =========================================================
     * COLLECTIONS
     * =========================================================
     */

    test(
      'GET /collections con cupcake -> 200',
      async () => {

        Ctrl
          .getCupcakeCollections
          .mockResolvedValueOnce([
            {
              collection_id:
                1,

              nombre:
                'Cumpleaños',

              total_recetas:
                2,

              seleccionada:
                true,
            }
          ]);

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/collections',

            queryStringParameters: {
              email:
                'user@mail.com',

              cupcake:
                '1',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getCupcakeCollections
        ).toHaveBeenCalledWith({
          email:
            'user@mail.com',

          cupcake:
            '1',
        });

        expect(
          JSON.parse(
            r.body
          )
        ).toEqual([
          {
            collection_id:
              1,

            nombre:
              'Cumpleaños',

            total_recetas:
              2,

            seleccionada:
              true,
          }
        ]);
      }
    );


    test(
      'GET /collections sin cupcake -> 200',
      async () => {

        Ctrl
          .getCupcakeCollections
          .mockResolvedValueOnce([
            {
              collection_id:
                1,

              nombre:
                'Cumpleaños',

              total_recetas:
                2,

              seleccionada:
                false,
            }
          ]);

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/collections',

            queryStringParameters: {
              email:
                'user@mail.com',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        /*
         * Al no existir cupcake, qs(e)
         * simplemente no incluye esa propiedad.
         */
        expect(
          Ctrl.getCupcakeCollections
        ).toHaveBeenCalledWith({
          email:
            'user@mail.com',
        });

        expect(
          JSON.parse(
            r.body
          )
        ).toEqual([
          {
            collection_id:
              1,

            nombre:
              'Cumpleaños',

            total_recetas:
              2,

            seleccionada:
              false,
          }
        ]);
      }
    );


    test(
      'GET /collections/cupcakes -> 200',
      async () => {

        Ctrl
          .getCupcakesByCollection
          .mockResolvedValueOnce([
            {
              cupcake_id:
                1,

              nombre:
                'Cupcake test',

              codigo:
                'https://example.com/test.jpg',
            }
          ]);

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/collections/cupcakes',

            queryStringParameters: {
              email:
                'user@mail.com',

              collection:
                '3',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getCupcakesByCollection
        ).toHaveBeenCalledWith({
          email:
            'user@mail.com',

          collection:
            '3',
        });

        expect(
          JSON.parse(
            r.body
          )
        ).toEqual([
          {
            cupcake_id:
              1,

            nombre:
              'Cupcake test',

            codigo:
              'https://example.com/test.jpg',
          }
        ]);
      }
    );


    test(
      'GET /collections/cupcakes vacío -> 200 y []',
      async () => {

        Ctrl
          .getCupcakesByCollection
          .mockResolvedValueOnce(
            []
          );

        const r =
          await handler({
            httpMethod:
              'GET',

            rawPath:
              '/cupcakes/collections/cupcakes',

            queryStringParameters: {
              email:
                'user@mail.com',

              collection:
                '99',
            },
          });

        expect(
          r.statusCode
        ).toBe(
          200
        );

        expect(
          Ctrl.getCupcakesByCollection
        ).toHaveBeenCalledWith({
          email:
            'user@mail.com',

          collection:
            '99',
        });

        expect(
          JSON.parse(
            r.body
          )
        ).toEqual(
          []
        );
      }
    );

  }
);