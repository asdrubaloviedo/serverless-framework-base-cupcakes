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

    // Actualiza el nombre y avatar del usuario.
    async update({ nombre, email, avatarId }) {
        const { primerNombre, segundoNombre } = this.splitName(nombre);

        const query =
            `
                UPDATE usuarios
                SET
                    primer_nombre = $1,
                    segundo_nombre = $2,
                    avatar_id = $3
                WHERE email = LOWER($4)
            `;

        const params = [
            primerNombre,
            segundoNombre,
            avatarId,
            email
        ];

        return UserModel.update({ query, params });
    }

    // Obtiene el usuario junto con la información de su avatar.
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

    // Obtiene las preferencias asociadas al usuario.
    //
    // La búsqueda se realiza por email porque es el dato que tenemos
    // disponible desde Firebase en la aplicación Android.
    //
    // usuario_preferencias se relaciona con usuarios mediante usuario_id.
    async getPreferences({ email }) {
        const query =
            `
                SELECT
                    up.usuario_id,
                    up.recordatorios,
                    up.mensajes,
                    up.promociones,
                    up.sonido,
                    up.vibracion
                FROM usuario_preferencias up
                INNER JOIN usuarios u
                    ON u.usuario_id = up.usuario_id
                WHERE u.email = LOWER($1)
            `;

        const params = [email];

        return UserModel.getCreated({ query, params });
    }

    // Actualiza las preferencias del usuario.
    //
    // No recibimos usuario_id desde Android. El usuario se identifica
    // mediante su email y PostgreSQL obtiene internamente su usuario_id.
    async updatePreferences({
        email,
        recordatorios,
        mensajes,
        promociones,
        sonido,
        vibracion
    }) {
        const query =
            `
                UPDATE usuario_preferencias
                SET
                    recordatorios = $1,
                    mensajes = $2,
                    promociones = $3,
                    sonido = $4,
                    vibracion = $5
                WHERE usuario_id = (
                    SELECT usuario_id
                    FROM usuarios
                    WHERE email = LOWER($6)
                )
            `;

        const params = [
            recordatorios,
            mensajes,
            promociones,
            sonido,
            vibracion,
            email
        ];

        return UserModel.update({ query, params });
    }
}

module.exports = UserRepository;