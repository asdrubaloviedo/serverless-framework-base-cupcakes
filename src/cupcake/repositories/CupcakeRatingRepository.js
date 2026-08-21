"use strict";

const {
    CupcakeRatingModel
} = require("@cupcake/models/cupcake");

class CupcakeRatingRepository {

    /*
     * Obtiene la calificación existente
     * de un usuario para un cupcake.
     */
    async getByUserEmailAndCupcakeId({
        email,
        cupcake
    }) {

        const query =
            `
                SELECT
                    cc.cupcake_calificacion_id,
                    cc.usuario_id,
                    cc.cupcake_id,
                    cc.calificacion,
                    cc.comentario,
                    cc.fecha_creacion,
                    cc.fecha_actualizacion
                FROM cupcake_calificaciones AS cc
                WHERE
                    cc.usuario_id = (
                        SELECT us.usuario_id
                        FROM usuarios AS us
                        WHERE LOWER(us.email) = LOWER($1)
                    )
                    AND cc.cupcake_id = $2;
            `;

        const params = [
            email,
            cupcake
        ];

        return CupcakeRatingModel.getByUserEmailAndCupcakeId({
            query,
            params
        });
    }

    /*
     * Verifica si el cupcake está marcado
     * como hecho por ese usuario.
     *
     * estado_id = 2  -> Hechos
     * valor = TRUE   -> Ya realizado
     */
    async isCupcakeDone({
        email,
        cupcake
    }) {

        const query =
            `
                SELECT
                    EXISTS (
                        SELECT 1
                        FROM cupcake_usuario_estados AS cue
                        WHERE
                            cue.usuario_id = (
                                SELECT us.usuario_id
                                FROM usuarios AS us
                                WHERE LOWER(us.email) = LOWER($1)
                            )
                            AND cue.cupcake_id = $2
                            AND cue.estado_id = 2
                            AND cue.valor = TRUE
                    ) AS hecho;
            `;

        const params = [
            email,
            cupcake
        ];

        return CupcakeRatingModel.isCupcakeDone({
            query,
            params
        });
    }

    /*
     * Crea una calificación nueva o actualiza
     * la existente para el mismo usuario/cupcake.
     *
     * Esto funciona gracias al UNIQUE:
     *
     * UNIQUE (usuario_id, cupcake_id)
     */
    async save({
        email,
        cupcake,
        calificacion,
        comentario
    }) {

        const query =
            `
                INSERT INTO cupcake_calificaciones (
                    usuario_id,
                    cupcake_id,
                    calificacion,
                    comentario
                )
                VALUES (
                    (
                        SELECT us.usuario_id
                        FROM usuarios AS us
                        WHERE LOWER(us.email) = LOWER($1)
                    ),
                    $2,
                    $3,
                    $4
                )

                ON CONFLICT (
                    usuario_id,
                    cupcake_id
                )

                DO UPDATE SET
                    calificacion = EXCLUDED.calificacion,
                    comentario = EXCLUDED.comentario,
                    fecha_actualizacion = NOW()

                RETURNING
                    cupcake_calificacion_id,
                    usuario_id,
                    cupcake_id,
                    calificacion,
                    comentario,
                    fecha_creacion,
                    fecha_actualizacion;
            `;

        const params = [
            email,
            cupcake,
            calificacion,
            comentario
        ];

        return CupcakeRatingModel.save({
            query,
            params
        });
    }
}

module.exports =
    CupcakeRatingRepository;