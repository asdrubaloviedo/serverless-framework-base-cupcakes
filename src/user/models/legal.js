
const db = require('@db/db');

class LegalDocumentModel {

    // Obtiene los documentos legales.
    static async get({ query, params, transaction = db }) {
        return transaction.query(query, params);
    }
}

class UserLegalAcceptanceModel {

    // Obtiene las aceptaciones legales de un usuario.
    static async get({ query, params, transaction = db }) {
        return transaction.query(query, params);
    }

    // Registra las aceptaciones legales de un usuario.
    static async create({ query, params, transaction = db }) {
        return transaction.query(query, params);
    }
}

module.exports = {
    LegalDocumentModel,
    UserLegalAcceptanceModel
};
