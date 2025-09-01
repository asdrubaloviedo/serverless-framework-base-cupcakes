"use strict"

const { IngredientModel } = require("@ingredient/models/ingredient");

class IngredientRepository {
    async getById({ id }) {
        const query = 
             `
                SELECT ing.descripcion
                FROM cupcakes AS cu 
                LEFT JOIN ingredientes ing ON cu.cupcake_id = ing.cupcake_id 
                WHERE ing.cupcake_id = $1 AND cu.cupcake_id = $1
            `;
        const params = [id];
        return IngredientModel.getById({ query, params });
    }
}

module.exports = IngredientRepository;