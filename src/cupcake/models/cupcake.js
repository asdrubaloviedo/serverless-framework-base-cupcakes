const db = require('@db/db');

class CupcakeModel {
  static doTest() {
    return 'Test';
  }

  static async getAll({ query }) {    
    return db.query(query);
  }

  static async getAllWithFilters({ query, params }) {
    return db.query(query, params);
  }

  static async getAllByUserEmail({ query, params }) {
    return db.query(query, params);
  }

  static async getAllRamdom({ query }) {
    return db.query(query);
  }

  static async getAllNameImage({ query }) {
    return db.query(query);
  }

  static async getAllNameImageByUserEmail({ query, params }) {
    return db.query(query, params);
  }

  static async getAllNameImageByUserEmailAndStatus({ query, params }) {
    return db.query(query, params);
  }

  static async getAllNameImageByCategory({ query, params }) {
    return db.query(query, params);
  }

  static async getAllNameImageByUserEmailAndCategory({ query, params }) {
    return db.query(query, params);
  }

  static async getAllNameImageByFestivity({ query, params }) {
    return db.query(query, params);
  }

  static async getAllNameImageByUserEmailAndFestivity({ query, params }) {
    return db.query(query, params);
  }

  static async getAllNameImageMovies({ query }) {
    return db.query(query);
  }

  static async getAllNameImageMoviesByUserEmail({ query, params }) {
    return db.query(query, params);
  }

  static async getAllNameImageFiltros({ query, params }) {
    return db.query(query, params);
  }

  static async getById({ query, params }) {
    return db.query(query, params);
  }

  static async getRandomByUserEmail({ query, params }) {
    return db.query(query, params);
  }

  static async getByFilters({ query, params }) {
    return db.query(query, params);
  }

  static async getByIdInfoImage({ query, params }) {
    return db.query(query, params);
  }
}

class CupcakeUserStateModel {
  static async create({ query, params }) {
    return db.query(query, params);
  }

  static async getByUserEmail({ query, params }) {
    return db.query(query, params);
  }

  static async getByUserEmailAndId({ query, params }) {
    return db.query(query, params);
  }

  static async getByUserEmailAndIdAndState({ query, params }) {
    return db.query(query, params);
  }

  static async update({ query, params }) {
    return db.query(query, params);
  }
}
module.exports = {
  CupcakeModel,
  CupcakeUserStateModel
};
