"use strict"

const { UserModel } = require("@user/models/user");

class UserRepository {

    async create({ email }) {
        const query = 
            `
                INSERT INTO usuarios (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, edad, sexo, email, rol_id, estado_id)
                SELECT 'indefinido', 'indefinido', 'indefinido', 'indefinido', 1, 'i', $1, 7, 1
                WHERE NOT EXISTS (
                    SELECT u.usuario_id
                    FROM usuarios AS u
                    WHERE u.email = $1
                );
            `
        const params = [email];
        return UserModel.create({ query, params });
    }

    async getCreated({ email }) {
        const query = 
            `
                SELECT *
                FROM usuarios
                WHERE email = $1
            `
        const params = [email];
        return UserModel.getCreated({ query, params });
    }
}

module.exports = UserRepository;