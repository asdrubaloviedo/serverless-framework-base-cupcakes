const db = require('@db/db');

class FestivityModel {
  static async getAllNameImageCount({ query }) {
    return db.query(query);
  }

  static async getAllNameImageCountByUserEmail({ query, params }) {
      return db.query(query, params);
  }
}

module.exports = {
  FestivityModel
};
