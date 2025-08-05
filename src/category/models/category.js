const db = require('./db');

class CategoryModel {
  static async getAllNameImageCount({ query }) {
    return db.query(query);
  }

  static async getAllNameImageCountWithEmail({ query, params }) {
    return db.query(query, params);
  }  
}

module.exports = {
  CategoryModel
};
