const db = require('@db/db');

class UserModel {

  static async create({ query, params }) {
    return db.query(query, params);
  }

  static async getCreated({ query, params }) {
    return db.query(query, params);
  }

  // Actualiza los datos del perfil de un usuario.
  static async update({ query, params }) {
    return db.query(query, params);
  }
}

class UserMedalLeageModel {

  static async create({ query, params }) {
    return db.query(query, params);
  }

  static async getByUserEmailAndMedal({ query, params }) {
    return db.query(query, params);
  }

  static async update({ query, params }) {    
    return db.query(query, params);
  }

  static async getUpdated({ query, params }) {  
    return db.query(query, params);
  }
}

class UserPackageModel {

  static async create({ query, params }) {
    return db.query(query, params);
  }

  static async getCreated({ query, params }) {
    return db.query(query, params);
  }
}

module.exports = {
  UserModel,
  UserMedalLeageModel,
  UserPackageModel
};