"use strict";

const {
    CupcakeCollectionModel
} = require("@cupcake/models/cupcake");

class CupcakeCollectionRepository {

    /*
     * =========================================================
     * GET COLLECTIONS BY USER
     * =========================================================
     *
     * Devuelve todas las collections del usuario.
     *
     * Además:
     * - total_recetas
     * - si el cupcake actual ya pertenece a la collection
     * - una imagen principal para usar como portada
     *
     * Si la collection está vacía:
     * imagen = null
     */

    async getByUserEmail({
        email,
        cupcake
    }) {

        const query =
            `
                SELECT
                    c.coleccion_id AS collection_id,
                    c.nombre,
                    COUNT(
                        DISTINCT cc.cupcake_id
                    )::INTEGER AS total_recetas,

                    EXISTS (
                        SELECT 1

                        FROM coleccion_cupcakes AS cc_selected

                        WHERE
                            cc_selected.coleccion_id =
                                c.coleccion_id

                            AND cc_selected.cupcake_id =
                                $2
                    ) AS seleccionada,

                    (
                        SELECT
                            i.codigo

                        FROM coleccion_cupcakes AS cc_image

                        INNER JOIN imagenes_cupcakes AS ic
                            ON ic.cupcake_id =
                                cc_image.cupcake_id

                            AND ic.main = 1

                        INNER JOIN imagenes AS i
                            ON i.imagen_id =
                                ic.imagen_id

                        WHERE
                            cc_image.coleccion_id =
                                c.coleccion_id

                        ORDER BY
                            cc_image.fecha_creacion ASC

                        LIMIT 1
                    ) AS imagen

                FROM colecciones AS c

                LEFT JOIN coleccion_cupcakes AS cc
                    ON cc.coleccion_id =
                        c.coleccion_id

                WHERE
                    c.usuario_id = (
                        SELECT
                            us.usuario_id

                        FROM usuarios AS us

                        WHERE
                            LOWER(us.email) =
                                LOWER($1)
                    )

                GROUP BY
                    c.coleccion_id,
                    c.nombre,
                    c.fecha_creacion

                ORDER BY
                    c.fecha_creacion ASC;
            `;

        const params = [
            email,
            cupcake
        ];

        return CupcakeCollectionModel
            .getByUserEmail({
                query,
                params
            });
    }


    /*
     * =========================================================
     * GET CUPCAKES BY COLLECTION
     * =========================================================
     *
     * Devuelve los cupcakes pertenecientes
     * a una collection.
     *
     * IMPORTANTE:
     *
     * La consulta comprueba que la collection
     * realmente pertenece al usuario indicado.
     *
     * De esta forma un usuario no puede consultar
     * los cupcakes de una collection de otro usuario
     * simplemente conociendo su ID.
     *
     * La respuesta está diseñada para poder reutilizar
     * CupcakesNameImage en Android:
     *
     * {
     *   cupcake_id,
     *   nombre,
     *   codigo
     * }
     */

    async getCupcakesByCollection({
        email,
        collection
    }) {

        const query =
            `
                SELECT
                    cu.cupcake_id,
                    cu.nombre,

                    (
                        SELECT
                            i.codigo

                        FROM imagenes_cupcakes AS ic

                        INNER JOIN imagenes AS i
                            ON i.imagen_id =
                                ic.imagen_id

                        WHERE
                            ic.cupcake_id =
                                cu.cupcake_id

                            AND ic.main = 1

                        LIMIT 1
                    ) AS codigo

                FROM coleccion_cupcakes AS cc

                INNER JOIN colecciones AS c
                    ON c.coleccion_id =
                        cc.coleccion_id

                INNER JOIN cupcakes AS cu
                    ON cu.cupcake_id =
                        cc.cupcake_id

                WHERE
                    c.coleccion_id =
                        $2

                    AND c.usuario_id = (
                        SELECT
                            us.usuario_id

                        FROM usuarios AS us

                        WHERE
                            LOWER(us.email) =
                                LOWER($1)
                    )

                ORDER BY
                    cc.fecha_creacion ASC;
            `;

        const params = [
            email,
            collection
        ];

        return CupcakeCollectionModel
            .getByUserEmail({
                query,
                params
            });
    }


    /*
     * =========================================================
     * CREATE COLLECTION
     * =========================================================
     */

    async create({
        email,
        nombre
    }) {

        const query =
            `
                INSERT INTO colecciones (
                    usuario_id,
                    nombre
                )

                VALUES (
                    (
                        SELECT
                            us.usuario_id

                        FROM usuarios AS us

                        WHERE
                            LOWER(us.email) =
                                LOWER($1)
                    ),
                    $2
                )

                RETURNING
                    coleccion_id AS collection_id,
                    usuario_id,
                    nombre,
                    fecha_creacion,
                    fecha_actualizacion;
            `;

        const params = [
            email,
            nombre
        ];

        return CupcakeCollectionModel
            .create({
                query,
                params
            });
    }


    /*
     * =========================================================
     * SAVE CUPCAKE IN COLLECTION
     * =========================================================
     *
     * La comprobación de usuario es importante:
     * un usuario no puede guardar un cupcake dentro
     * de una collection que pertenece a otro usuario.
     *
     * ON CONFLICT evita duplicar el mismo cupcake
     * dentro de una collection.
     */

    async saveCupcake({
        email,
        collection,
        cupcake
    }) {

        const query =
            `
                INSERT INTO coleccion_cupcakes (
                    coleccion_id,
                    cupcake_id
                )

                SELECT
                    c.coleccion_id,
                    $3

                FROM colecciones AS c

                WHERE
                    c.coleccion_id =
                        $2

                    AND c.usuario_id = (
                        SELECT
                            us.usuario_id

                        FROM usuarios AS us

                        WHERE
                            LOWER(us.email) =
                                LOWER($1)
                    )

                ON CONFLICT (
                    coleccion_id,
                    cupcake_id
                )

                DO NOTHING

                RETURNING
                    coleccion_cupcake_id,
                    coleccion_id AS collection_id,
                    cupcake_id,
                    fecha_creacion;
            `;

        const params = [
            email,
            collection,
            cupcake
        ];

        return CupcakeCollectionModel
            .saveCupcake({
                query,
                params
            });
    }
}

module.exports =
    CupcakeCollectionRepository;