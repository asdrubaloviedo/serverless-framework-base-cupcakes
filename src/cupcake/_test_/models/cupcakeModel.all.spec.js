jest.mock('@db/db', () => ({ query: jest.fn() }));
const db = require('@db/db');
const { CupcakeModel, CupcakeUserStateModel } = require('../../models/cupcake');

describe('CupcakeModel & CupcakeUserStateModel (full)', () => {
  beforeEach(() => jest.clearAllMocks());

  const q = 'Q', p = [1,2,3];

  test('CupcakeModel: todas las funciones llaman db.query', async () => {
    await CupcakeModel.getAll({ query:q });
    await CupcakeModel.getAllWithFilters({ query:q, params:p });
    await CupcakeModel.getAllByUserEmail({ query:q, params:p });
    await CupcakeModel.getAllRamdom({ query:q });
    await CupcakeModel.getAllNameImage({ query:q });
    await CupcakeModel.getAllNameImageByUserEmail({ query:q, params:p });
    await CupcakeModel.getAllNameImageByUserEmailAndStatus({ query:q, params:p });
    await CupcakeModel.getAllNameImageByCategory({ query:q, params:p });
    await CupcakeModel.getAllNameImageByUserEmailAndCategory({ query:q, params:p });
    await CupcakeModel.getAllNameImageByFestivity({ query:q, params:p });
    await CupcakeModel.getAllNameImageByUserEmailAndFestivity({ query:q, params:p });
    await CupcakeModel.getAllNameImageMovies({ query:q });
    await CupcakeModel.getAllNameImageMoviesByUserEmail({ query:q, params:p });
    await CupcakeModel.getAllNameImageFiltros({ query:q, params:p });
    await CupcakeModel.getById({ query:q, params:p });
    await CupcakeModel.getRandomByUserEmail({ query:q, params:p });
    await CupcakeModel.getByFilters({ query:q, params:p });
    await CupcakeModel.getByIdInfoImage({ query:q, params:p });

    // 18 llamadas
    expect(db.query).toHaveBeenCalledTimes(18);
  });

  test('CupcakeUserStateModel: todas llaman db.query', async () => {
    await CupcakeUserStateModel.create({ query:q, params:p });
    await CupcakeUserStateModel.getByUserEmail({ query:q, params:p });
    await CupcakeUserStateModel.getByUserEmailAndId({ query:q, params:p });
    await CupcakeUserStateModel.getByUserEmailAndIdAndState({ query:q, params:p });
    await CupcakeUserStateModel.update({ query:q, params:p });
    expect(db.query).toHaveBeenCalledTimes(5);
  });
});
