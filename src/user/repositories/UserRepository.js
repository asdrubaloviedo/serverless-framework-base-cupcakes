"use strict"

const { UserModel } = require("@user/models/user");

class UserRepository {
    splitName(nombre = '') {
        const normalized = String(nombre)
        .trim()
        .replace(/\s+/g, ' ');

        const [primerNombre = 'indefinido', segundoNombre = 'indefinido'] = normalized.split(' ');

        return {
            primerNombre,
            segundoNombre,
        };
    }

    async create({ nombre, email }) {
        const { primerNombre, segundoNombre } = this.splitName(nombre);

        const query = 
            `
                INSERT INTO usuarios (
                    primer_nombre,
                    segundo_nombre,
                    primer_apellido,
                    segundo_apellido,
                    edad,
                    sexo,
                    email,
                    rol_id,
                    estado_id
                )
                VALUES ($1, $2, 'indefinido', 'indefinido', 1, 'i', LOWER($3), 7, 1)
                ON CONFLICT (email) DO NOTHING;
            `
        const params = [primerNombre, segundoNombre, email];
        return UserModel.create({ query, params });
    }

    async getCreated({ email }) {
        const query = 
            `
                SELECT *
                FROM usuarios
                WHERE email = LOWER($1)
            `
        const params = [email];
        return UserModel.getCreated({ query, params });
    }
}

module.exports = UserRepository;