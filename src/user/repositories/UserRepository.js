
"use strict"

const { UserModel } = require("@user/models/user");

class UserRepository {

    // Divide el nombre recibido en primer y segundo nombre.
    splitName(nombre = '') {
        const normalized = String(nombre)
            .trim()
            .replace(/\s+/g, ' ');

        const partes = normalized.split(' ');

        const primerNombre =
            partes[0] || '';

        const segundoNombre =
            partes.slice(1).join(' ');

        return {
            primerNombre,
            segundoNombre,
        };
    }

    // Crea un nuevo usuario mediante registro tradicional.
    async create({
        nombre,
        email,
        firebaseUid,
        pais = 'PER',
        transaction
    }) {
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
                    firebase_uid,
                    rol_id,
                    estado_id
                )
                VALUES (
                    $1, $2, 'indefinido', 'indefinido',
                    UPPER($3), 1, 'i', LOWER($4), $5, 7, 1
                )
                ON CONFLICT DO NOTHING
                RETURNING usuario_id;
            `;

        const params = [
            primerNombre,
            segundoNombre,
            pais,
            email,
            firebaseUid
        ];

        return UserModel.create({
            query,
            params,
            transaction
        });
    }

    // Registra exclusivamente usuarios nuevos de Google.
    // Las restricciones UNIQUE sobre email y firebase_uid
    // evitan registros duplicados.
    async registerGoogle({
        nombre,
        email,
        firebaseUid,
        transaction
    }) {
        const { primerNombre, segundoNombre } = this.splitName(nombre);

        const query = `
            INSERT INTO usuarios (
                primer_nombre,
                segundo_nombre,
                primer_apellido,
                segundo_apellido,
                pais,
                edad,
                sexo,
                email,
                firebase_uid,
                rol_id,
                estado_id
            )
            VALUES (
                $1, $2, 'indefinido', 'indefinido',
                'PER', 1, 'i', LOWER($3), $4, 7, 1
            )
            ON CONFLICT DO NOTHING
            RETURNING usuario_id;
        `;

        const params = [
            primerNombre,
            segundoNombre,
            email,
            firebaseUid
        ];

        return UserModel.create({
            query,
            params,
            transaction
        });
    }

    // Verifica si existe un usuario con el correo indicado.
    async existsByEmail({ email, transaction }) {
        const query = `
            SELECT usuario_id
            FROM usuarios
            WHERE email = LOWER($1)
            LIMIT 1;
        `;

        const rows = await UserModel.getCreated({
            query,
            params: [email],
            transaction
        });

        return rows.length > 0;
    }

    // Obtiene el identificador interno mediante el correo.
    async getIdByEmail({ email, transaction }) {
        const query = `
            SELECT usuario_id
            FROM usuarios
            WHERE email = LOWER($1)
            LIMIT 1;
        `;

        const rows = await UserModel.getCreated({
            query,
            params: [email],
            transaction
        });

        return rows.length > 0
            ? rows[0].usuario_id
            : null;
    }

    // Verifica si existe un usuario vinculado al UID de Firebase.
    async existsByFirebaseUid({ firebaseUid, transaction }) {
        const usuarioId = await this.getIdByFirebaseUid({
            firebaseUid,
            transaction
        });

        return usuarioId !== null;
    }

    // Obtiene el identificador interno mediante el UID de Firebase.
    async getIdByFirebaseUid({ firebaseUid, transaction }) {
        const query = `
            SELECT usuario_id
            FROM usuarios
            WHERE firebase_uid = $1
            LIMIT 1;
        `;

        const rows = await UserModel.getByFirebaseUid({
            query,
            params: [firebaseUid],
            transaction
        });

        return rows.length > 0
            ? rows[0].usuario_id
            : null;
    }

    // Obtiene el usuario y su avatar mediante el UID de Firebase.
    async getByFirebaseUid({ firebaseUid, transaction }) {
        const query = `
            SELECT
                u.usuario_id,
                u.primer_nombre,
                u.segundo_nombre,
                u.primer_apellido,
                u.segundo_apellido,
                u.pais,
                u.edad,
                u.sexo,
                u.email,
                u.avatar_id,
                u.rol_id,
                u.estado_id,
                a.nombre AS avatar_nombre,
                a.codigo AS avatar_url
            FROM usuarios u
            INNER JOIN avatares a
                ON a.avatar_id = u.avatar_id
            WHERE u.firebase_uid = $1;
        `;

        return UserModel.getByFirebaseUid({
            query,
            params: [firebaseUid],
            transaction
        });
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
    async getCreated({ email, transaction }) {
        const query =
            `
                SELECT
                    u.usuario_id,
                    u.primer_nombre,
                    u.segundo_nombre,
                    u.primer_apellido,
                    u.segundo_apellido,
                    u.pais,
                    u.edad,
                    u.sexo,
                    u.email,
                    u.avatar_id,
                    u.rol_id,
                    u.estado_id,
                    a.nombre AS avatar_nombre,
                    a.codigo AS avatar_url
                FROM usuarios u
                INNER JOIN avatares a
                    ON a.avatar_id = u.avatar_id
                WHERE u.email = LOWER($1)
            `;

        const params = [email];

        return UserModel.getCreated({
            query,
            params,
            transaction
        });
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
                    up.musica,
                    up.efectos_sonido,
                    up.vibracion,
                    up.tema
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
    // La actualización puede ser parcial.
    //
    // Cuando una preferencia no se recibe desde el cliente,
    // JavaScript envía undefined. Antes de ejecutar la consulta
    // convertimos esos valores a null.
    //
    // PostgreSQL utiliza COALESCE para conservar el valor actual
    // cuando el parámetro correspondiente es null.
    //
    // Esto permite, por ejemplo, actualizar únicamente:
    //
    // {
    //     email,
    //     tema
    // }
    //
    // sin modificar recordatorios, mensajes, promociones,
    // música, efectos de sonido ni vibración.
    async updatePreferences({
        email,
        recordatorios,
        mensajes,
        promociones,
        musica,
        efectos_sonido,
        vibracion,
        tema
    }) {

        const query =
            `
                UPDATE usuario_preferencias
                SET
                    recordatorios = COALESCE($1, recordatorios),
                    mensajes = COALESCE($2, mensajes),
                    promociones = COALESCE($3, promociones),
                    musica = COALESCE($4, musica),
                    efectos_sonido = COALESCE($5, efectos_sonido),
                    vibracion = COALESCE($6, vibracion),
                    tema = COALESCE($7, tema)
                WHERE usuario_id = (
                    SELECT usuario_id
                    FROM usuarios
                    WHERE email = LOWER($8)
                )
            `;

        const params = [
            recordatorios ?? null,
            mensajes ?? null,
            promociones ?? null,
            musica ?? null,
            efectos_sonido ?? null,
            vibracion ?? null,
            tema ?? null,
            email
        ];

        return UserModel.update({
            query,
            params
        });
    }
}

module.exports = UserRepository;
