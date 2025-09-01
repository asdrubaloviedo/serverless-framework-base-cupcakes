const db = require('@db/db');

class IngredientModel {
  static async getById({ query, params }) {
    return db.query(query, params);
  }
}

module.exports = {
  IngredientModel
};

