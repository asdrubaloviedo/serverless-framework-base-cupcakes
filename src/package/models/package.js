const db = require('@db/db');

class PackageModel {
  static async getAll({ query, params }) {
    return db.query(query, params);
  }
}

module.exports = {
  PackageModel
};
