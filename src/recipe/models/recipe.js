const db = require('@db/db');

class RecipeModel {
  static async getById({ query, params }) {
    return db.query(query, params);
  }
}

module.exports = {
  RecipeModel
};

