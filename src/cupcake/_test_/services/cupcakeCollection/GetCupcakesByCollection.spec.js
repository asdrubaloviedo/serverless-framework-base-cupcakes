jest.mock(
    '@cupcake/repositories/index',
    () => {

        const repo = {

            getCupcakesByCollection:
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

const GetCupcakesByCollection =
    require(
        '../../../services/cupcakeCollection/GetCupcakesByCollection'
    );

describe(
    'GetCupcakesByCollection Service',
    () => {

        beforeEach(
            () => {

                jest.clearAllMocks();
            }
        );

        test(
            'devuelve los cupcakes de una collection',
            async () => {

                const repo =
                    new CupcakeCollectionRepository();

                repo
                    .getCupcakesByCollection
                    .mockResolvedValueOnce([
                        {
                            cupcake_id: 1,
                            nombre: 'Cupcake 1',
                            codigo: 'https://image.com/1.jpg'
                        },
                        {
                            cupcake_id: 2,
                            nombre: 'Cupcake 2',
                            codigo: 'https://image.com/2.jpg'
                        }
                    ]);

                const result =
                    await GetCupcakesByCollection.execute({
                        email:
                            'USER@MAIL.COM',
                        collection:
                            3
                    });

                expect(
                    repo.getCupcakesByCollection
                ).toHaveBeenCalledWith({
                    email:
                        'user@mail.com',
                    collection:
                        3
                });

                expect(
                    result
                ).toEqual([
                    {
                        cupcake_id: 1,
                        nombre: 'Cupcake 1',
                        codigo: 'https://image.com/1.jpg'
                    },
                    {
                        cupcake_id: 2,
                        nombre: 'Cupcake 2',
                        codigo: 'https://image.com/2.jpg'
                    }
                ]);
            }
        );

        test(
            'normaliza email con espacios y mayúsculas',
            async () => {

                const repo =
                    new CupcakeCollectionRepository();

                repo
                    .getCupcakesByCollection
                    .mockResolvedValueOnce([]);

                await GetCupcakesByCollection.execute({
                    email:
                        '  USER@MAIL.COM  ',
                    collection:
                        '5'
                });

                expect(
                    repo.getCupcakesByCollection
                ).toHaveBeenCalledWith({
                    email:
                        'user@mail.com',
                    collection:
                        5
                });
            }
        );

        test(
            'devuelve [] si repository devuelve null',
            async () => {

                const repo =
                    new CupcakeCollectionRepository();

                repo
                    .getCupcakesByCollection
                    .mockResolvedValueOnce(
                        null
                    );

                const result =
                    await GetCupcakesByCollection.execute({
                        email:
                            'user@mail.com',
                        collection:
                            1
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
                    .getCupcakesByCollection
                    .mockResolvedValueOnce(
                        undefined
                    );

                const result =
                    await GetCupcakesByCollection.execute({
                        email:
                            'user@mail.com',
                        collection:
                            1
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
            '   '
        ])(
            'lanza error si email es inválido: %p',
            async email => {

                await expect(
                    GetCupcakesByCollection.execute({
                        email,
                        collection:
                            1
                    })
                ).rejects.toThrow(
                    'El email es requerido'
                );
            }
        );

        test(
            'lanza error si email no es string',
            async () => {

                await expect(
                    GetCupcakesByCollection.execute({
                        email:
                            123,
                        collection:
                            1
                    })
                ).rejects.toThrow(
                    'El email es requerido'
                );
            }
        );

        test.each([
            undefined,
            null,
            '',
            0,
            -1,
            '0',
            '-2',
            'abc',
            1.5,
            '1.5'
        ])(
            'lanza error si collection es inválida: %p',
            async collection => {

                await expect(
                    GetCupcakesByCollection.execute({
                        email:
                            'user@mail.com',
                        collection
                    })
                ).rejects.toThrow(
                    'La colección debe ser un identificador válido'
                );
            }
        );

        test(
            'acepta collection como string numérico',
            async () => {

                const repo =
                    new CupcakeCollectionRepository();

                repo
                    .getCupcakesByCollection
                    .mockResolvedValueOnce([]);

                await GetCupcakesByCollection.execute({
                    email:
                        'user@mail.com',
                    collection:
                        '7'
                });

                expect(
                    repo.getCupcakesByCollection
                ).toHaveBeenCalledWith({
                    email:
                        'user@mail.com',
                    collection:
                        7
                });
            }
        );
    }
);