"use strict"

const { RecipeModel } = require("@recipe/models/recipe");

class RecipeRepository {
    async getById({ id }) {
        const query = 
            `
                SELECT 
                    rs.orden, rs.descripcion
                FROM cupcakes AS cu 
                LEFT JOIN receta_segmentos rs ON cu.cupcake_id = rs.cupcake_id 
                WHERE rs.cupcake_id = $1 AND cu.cupcake_id = $1
                ORDER BY 
                    rs.orden, rs.descripcion
            `;
        const params = [id];
        return RecipeModel.getById({ query, params });         
    }
}

module.exports = RecipeRepository;