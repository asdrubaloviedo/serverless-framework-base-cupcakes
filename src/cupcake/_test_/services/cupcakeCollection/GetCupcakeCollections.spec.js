jest.mock(
    '@cupcake/repositories/index',
    () => {

        const repo = {

            getByUserEmail:
                jest.fn()
        };

        return {

            CupcakeCollectionRepository:
                jest.fn(
                    () => repo
                )
        };
    }
);

const {
    CupcakeCollectionRepository
} =
    require(
        '@cupcake/repositories/index'
    );

const GetCupcakeCollections =
    require(
        '../../../services/cupcakeCollection/GetCupcakeCollections'
    );

describe(
    'GetCupcakeCollections Service',
    () => {

        beforeEach(
            () => {

                jest.clearAllMocks();
            }
        );

        test(
            'devuelve collections con cupcake válido',
            async () => {

                const repo =
                    new CupcakeCollectionRepository();

                repo
                    .getByUserEmail
                    .mockResolvedValueOnce([
                        {
                            collection_id: 1,
                            nombre: 'Cumpleaños',
                            seleccionada: true
                        }
                    ]);

                const result =
                    await GetCupcakeCollections.execute({
                        email:
                            'user@mail.com',
                        cupcake:
                            5
                    });

                expect(
                    repo.getByUserEmail
                ).toHaveBeenCalledWith({
                    email:
                        'user@mail.com',
                    cupcake:
                        5
                });

                expect(
                    result
                ).toEqual([
                    {
                        collection_id: 1,
                        nombre: 'Cumpleaños',
                        seleccionada: true
                    }
                ]);
            }
        );

        test(
            'acepta cupcake como string numérico',
            async () => {

                const repo =
                    new CupcakeCollectionRepository();

                repo
                    .getByUserEmail
                    .mockResolvedValueOnce([]);

                await GetCupcakeCollections.execute({
                    email:
                        'user@mail.com',
                    cupcake:
                        '7'
                });

                expect(
                    repo.getByUserEmail
                ).toHaveBeenCalledWith({
                    email:
                        'user@mail.com',
                    cupcake:
                        7
                });
            }
        );

        test(
            'permite omitir cupcake',
            async () => {

                const repo =
                    new CupcakeCollectionRepository();

                repo
                    .getByUserEmail
                    .mockResolvedValueOnce([
                        {
                            collection_id: 1,
                            nombre: 'Cumpleaños',
                            seleccionada: false
                        }
                    ]);

                const result =
                    await GetCupcakeCollections.execute({
                        email:
                            'user@mail.com'
                    });

                expect(
                    repo.getByUserEmail
                ).toHaveBeenCalledWith({
                    email:
                        'user@mail.com',
                    cupcake:
                        null
                });

                expect(
                    result
                ).toEqual([
                    {
                        collection_id: 1,
                        nombre: 'Cumpleaños',
                        seleccionada: false
                    }
                ]);
            }
        );

        test.each([
            undefined,
            null,
            '',
            0,
            '0',
            -1,
            '-3'
        ])(
            'cupcake inválido/no positivo se transforma en null: %p',
            async cupcake => {

                const repo =
                    new CupcakeCollectionRepository();

                repo
                    .getByUserEmail
                    .mockResolvedValueOnce([]);

                await GetCupcakeCollections.execute({
                    email:
                        'user@mail.com',
                    cupcake
                });

                expect(
                    repo.getByUserEmail
                ).toHaveBeenCalledWith({
                    email:
                        'user@mail.com',
                    cupcake:
                        null
                });
            }
        );

        test(
            'lanza error si cupcake positivo no es entero',
            async () => {

                await expect(
                    GetCupcakeCollections.execute({
                        email:
                            'user@mail.com',
                        cupcake:
                            1.5
                    })
                ).rejects.toThrow(
                    'El cupcake debe ser un identificador válido'
                );
            }
        );

        test(
            'devuelve [] si repository devuelve null',
            async () => {

                const repo =
                    new CupcakeCollectionRepository();

                repo
                    .getByUserEmail
                    .mockResolvedValueOnce(
                        null
                    );

                const result =
                    await GetCupcakeCollections.execute({
                        email:
                            'user@mail.com'
                    });

                expect(
                    result
                ).toEqual(
                    []
                );
            }
        );

        test(
            'devuelve [] si repository devuelve undefined',
            async () => {

                const repo =
                    new CupcakeCollectionRepository();

                repo
                    .getByUserEmail
                    .mockResolvedValueOnce(
                        undefined
                    );

                const result =
                    await GetCupcakeCollections.execute({
                        email:
                            'user@mail.com'
                    });

                expect(
                    result
                ).toEqual(
                    []
                );
            }
        );

        test.each([
            undefined,
            null,
            '',
            0,
            false
        ])(
            'lanza error si email es inválido: %p',
            async email => {

                await expect(
                    GetCupcakeCollections.execute({
                        email
                    })
                ).rejects.toThrow(
                    'El email es requerido'
                );
            }
        );
    }
);