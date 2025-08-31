"use strict"

const { CupcakeUserStateModel } = require("@cupcake/models/cupcake");

class CupcakeUserStateRepository {
    async create({ email, cupcake, estado }) {
        const query = 
            `
                INSERT INTO cupcake_usuario_estados (usuario_id, cupcake_id, estado_id, valor)
                SELECT (
                SELECT us.usuario_id
                    FROM usuarios AS us
                    WHERE us.email = $1
                ), $2, $3, TRUE
                WHERE NOT EXISTS (
                    SELECT usuario_id, cupcake_id, estado_id
                    FROM cupcake_usuario_estados
                    WHERE usuario_id = (
                        SELECT us.usuario_id
                        FROM usuarios AS us
                        WHERE us.email = $1
                    ) AND cupcake_id = $2 AND estado_id = $3
                );
            `;
        const params = [email, cupcake, estado];
        return CupcakeUserStateModel.create({ query, params });
    }

    async getByUserEmailAndIdAndState({ email, cupcake, estado }) {
        const query = 
            `
                SELECT usuario_id, cupcake_id, estado_id
                FROM cupcake_usuario_estados
                WHERE usuario_id = (
                    SELECT us.usuario_id
                    FROM usuarios AS us
                    WHERE us.email = $1
                ) AND cupcake_id = $2 AND estado_id = $3
            `
        const params = [email, cupcake, estado];
        return CupcakeUserStateModel.getByUserEmailAndIdAndState({ query, params });
    }

    async getByUserEmail({ lowerCaseEmail }) {
        const query = 
            `
                WITH
                    hechos AS (
                    SELECT cu.*
                    FROM cupcakes AS cu 
                    LEFT JOIN cupcake_usuario_estados cue ON cu.cupcake_id = cue.cupcake_id
                    WHERE
                        cue.usuario_id = (
                        SELECT us.usuario_id
                        FROM usuarios AS us
                        WHERE us.email = $1
                        ) AND
                        cue.estado_id = 2 AND
                        cue.valor = true
                    )
                SELECT
                    COUNT(hu.cupcake_id) hechos_count,
                    (
                    SELECT COUNT (hu.cupcake_id)
                    FROM hechos AS hu
                    WHERE hu.dificultad_id >= 4 
                    ) AS dificiles_count,
                    (
                    SELECT COUNT (hu.cupcake_id)
                    FROM hechos AS hu
                    WHERE hu.festividad_id <> 1 
                    ) AS festivos_count,
                    (
                    SELECT COUNT (hu.cupcake_id)
                    FROM hechos AS hu
                    WHERE hu.pelicula = true
                    ) AS pelicula_count,
                    (
                    SELECT SUM (hu.porciones)
                    FROM hechos AS hu
                    ) AS porciones_sum,
                    (
                    SELECT SUM (hu.tiempo)
                    FROM hechos AS hu
                    ) AS tiempo_sum
                FROM hechos AS hu;
            `
        const params = [lowerCaseEmail];
        return CupcakeUserStateModel.getByUserEmail({ query, params });
    }

    async getByUserEmailAndId({ lowerCaseEmail, id }) {
        const query = 
            `
                SELECT cue.usuario_id, cue.cupcake_id, cue.estado_id, cue.valor
                FROM cupcake_usuario_estados AS cue
                WHERE 
                    cue.usuario_id = (
                    SELECT us.usuario_id
                    FROM usuarios AS us
                    WHERE us.email = $1
                    ) AND
                    cue.cupcake_id = $2
                ORDER BY cue.estado_id
            `
        const params = [lowerCaseEmail, id];
        return CupcakeUserStateModel.getByUserEmailAndId({ query, params });
    }

    async update({ email, cupcake, estado, valor }) {
        const query = 
            `
                UPDATE cupcake_usuario_estados
                SET valor = $4
                WHERE
                usuario_id = (
                    SELECT us.usuario_id
                    FROM usuarios AS us
                    WHERE us.email = $1
                ) AND
                cupcake_id = $2 AND 
                estado_id = $3;
            `
        const params = [email, cupcake, estado, valor];
        return CupcakeUserStateModel.update({ query, params });
    }

    // static async getByIdCupcakeUserState({ email, id }) {
    //   const lowerCaseEmail = email.toLowerCase();
    //   // API: '/cupcakes/logros'
    //   if (email && !id) {
    //     const cupcakeUserStates = await db.query(
    //       `
    //       WITH
    //         hechos AS (
    //           SELECT cu.*
    //           FROM cupcakes AS cu
    //           LEFT JOIN cupcake_usuario_estados cue ON cu.cupcake_id = cue.cupcake_id
    //           WHERE
    //             cue.usuario_id = (
    //               SELECT us.usuario_id
    //               FROM usuarios AS us
    //               WHERE us.email = $1
    //             ) AND
    //             cue.estado_id = 2 AND
    //             cue.valor = true
    //         )
    //       SELECT
    //         COUNT(hu.cupcake_id) hechos_count,
    //         (
    //           SELECT COUNT (hu.cupcake_id)
    //           FROM hechos AS hu
    //           WHERE hu.dificultad_id >= 4
    //         ) AS dificiles_count,
    //         (
    //           SELECT COUNT (hu.cupcake_id)
    //           FROM hechos AS hu
    //           WHERE hu.festividad_id <> 1
    //         ) AS festivos_count,
    //         (
    //           SELECT COUNT (hu.cupcake_id)
    //           FROM hechos AS hu
    //           WHERE hu.pelicula = true
    //         ) AS pelicula_count,
    //         (
    //           SELECT SUM (hu.porciones)
    //           FROM hechos AS hu
    //         ) AS porciones_sum,
    //         (
    //           SELECT SUM (hu.tiempo)
    //           FROM hechos AS hu
    //         ) AS tiempo_sum
    //       FROM hechos AS hu;
    //       `,
    //       [lowerCaseEmail]
    //     );

    //     if (cupcakeUserStates.length === 0) return null;
    //     return cupcakeUserStates;
    //   }
    //   // API: '/cupcakes/cupcake/estados'
    //   const cupcakeUserStates = await db.query(
    //     `
    //     SELECT cue.usuario_id, cue.cupcake_id, cue.estado_id, cue.valor
    //     FROM cupcake_usuario_estados AS cue
    //     WHERE
    //       cue.usuario_id = (
    //         SELECT us.usuario_id
    //         FROM usuarios AS us
    //         WHERE us.email = $1
    //       ) AND
    //       cue.cupcake_id = $2
    //     ORDER BY cue.estado_id
    //     `,
    //     [lowerCaseEmail, id]
    //   );

    //   if (cupcakeUserStates.length === 0) return null;
    //   return cupcakeUserStates;
    // }

    // static async update({ id, email, cupcake, estado, valor }) {
    //   // API: '/cupcakes/cupcake/actualizar-cupcake-estados'
    //   try {
    //     await db.query(
    //       `
    //       UPDATE cupcake_usuario_estados
    //       SET valor = $4
    //       WHERE
    //         usuario_id = (
    //           SELECT us.usuario_id
    //           FROM usuarios AS us
    //           WHERE us.email = $1
    //         ) AND
    //         cupcake_id = $2 AND
    //         estado_id = $3;
    //       `,
    //       [email, cupcake, estado, valor]
    //     );
    //   } catch (e) {
    //     // No enviar el error al usuario
    //     throw new Error('Error updating the cupcake user state');
    //   }

    //   const cupcakeUserState = await db.query(
    //     `
    //     SELECT usuario_id, cupcake_id, estado_id
    //     FROM cupcake_usuario_estados
    //     WHERE usuario_id = (
    //       SELECT us.usuario_id
    //       FROM usuarios AS us
    //       WHERE us.email = $1
    //     ) AND cupcake_id = $2 AND estado_id = $3
    //     `,
    //     [email, cupcake, estado]
    //   );
    //   return cupcakeUserState;
    // }
}

module.exports = CupcakeUserStateRepository;