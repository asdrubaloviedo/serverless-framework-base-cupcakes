"use strict"

const { UserPackageModel } = require("@user/models/user");

class UserPackageRepository {

    async create({ email, paquete }) {
        const query = 
            `
                INSERT INTO usuario_paquetes (usuario_id, paquete_id)
                SELECT (
                    SELECT us.usuario_id
                    FROM usuarios AS us
                    WHERE us.email = $1
                ), $2
                WHERE NOT EXISTS (
                    SELECT usuario_id, paquete_id
                    FROM usuario_paquetes
                    WHERE usuario_id = (
                    SELECT us.usuario_id
                    FROM usuarios AS us
                    WHERE us.email = $1
                    ) AND paquete_id = $2
                );
            `
        const params = [email, paquete];
        return UserPackageModel.create({ query, params });
    }

    async getCreated({ email, paquete }) {
        const query = 
            `
                SELECT *
                FROM usuario_paquetes
                WHERE usuario_id = (
                    SELECT us.usuario_id
                    FROM usuarios AS us
                    WHERE us.email = $1
                ) AND paquete_id = $2
            `
        const params = [email, paquete];
        return UserPackageModel.getCreated({ query, params });
    }
}

module.exports = UserPackageRepository;