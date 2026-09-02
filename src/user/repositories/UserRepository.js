"use strict"

const { UserModel } = require("@user/models/user");

class UserRepository {

    // Divide el nombre recibido en primer y segundo nombre.
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

    // Crea un nuevo usuario.
    async create({ nombre, email, pais = 'PER' }) {
        const { primerNombre, segundoNombre } = this.splitName(nombre);

        const query =
            `
                INSERT INTO usuarios (
                    primer_nombre,
                    segundo_nombre,
                    primer_apellido,
                    segundo_apellido,
                    pais,
                    edad,
                    sexo,
                    email,
                    rol_id,
                    estado_id
                )
                VALUES ($1, $2, 'indefinido', 'indefinido', UPPER($3), 1, 'i', LOWER($4), 7, 1)
                ON CONFLICT (email) DO NOTHING;
            `;

        const params = [primerNombre, segundoNombre, pais, email];

        return UserModel.create({ query, params });
    }

    // Obtiene el usuario creado junto con la información de su avatar.
    async getCreated({ email }) {
        const query =
            `
                SELECT
                    u.*,
                    a.nombre AS avatar_nombre,
                    a.codigo AS avatar_url
                FROM usuarios u
                INNER JOIN avatares a
                    ON a.avatar_id = u.avatar_id
                WHERE u.email = LOWER($1)
            `;

        const params = [email];

        return UserModel.getCreated({ query, params });
    }
}

module.exports = UserRepository;