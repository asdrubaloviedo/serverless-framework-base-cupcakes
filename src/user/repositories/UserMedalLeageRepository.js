"use strict"

const { UserMedalLeageModel } = require("@user/models/user");

class UserMedalLeageRepository {
    
    async create({ email, medalla }) {
        const query = 
            `
                INSERT INTO usuario_medallas_liga (usuario_id, medalla_liga_id, requisito_alcanzado, cumple_requisitos)
                SELECT (
                    SELECT us.usuario_id
                    FROM usuarios AS us
                    WHERE us.email = $1
                ), $2, 0, FALSE
                WHERE NOT EXISTS (
                    SELECT usuario_id, medalla_liga_id, requisito_alcanzado, cumple_requisitos
                    FROM usuario_medallas_liga
                    WHERE usuario_id = (
                    SELECT us.usuario_id
                    FROM usuarios AS us
                    WHERE us.email = $1
                    )
                );
            `;
        const params = [email, medalla];
        return UserMedalLeageModel.create({ query, params });
    }

    async getByUserEmailAndMedal({ email, medalla }) {
        const query = 
            `
                SELECT *
                FROM usuario_medallas_liga
                WHERE usuario_id = (
                    SELECT us.usuario_id
                    FROM usuarios AS us
                    WHERE us.email = $1
                ) AND medalla_liga_id = $2
            `;
        const params = [email, medalla];
        return UserMedalLeageModel.getByUserEmailAndMedal({ query, params });
    }

    async update({ email, cupcake, estado, valor }) {
        const query = 
            `
                Falta query, tomar de ejemplo al de CupcakeUserStateModel
            `;
        const params = [email, cupcake, estado, valor];
        return UserMedalLeageModel.update({ query, params });
    }

    async getUpdated({ email, cupcake, estado, valor }) {
        const query = 
            `
                Falta query, tomar de ejemplo al de CupcakeUserStateModel
            `;
        const params = [email, cupcake, estado, valor];
        return UserMedalLeageModel.getUpdated({ query, params });
    }
}

module.exports = UserMedalLeageRepository;