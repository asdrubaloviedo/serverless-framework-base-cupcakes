"use strict"

const { CupcakeModel } = require("@cupcake/models/cupcake");

class CupcakeRepository {
    async doTest() {
        return 'Test';
    }

    async getAll() {
        const query = 
            `
                SELECT C.*
                FROM cupcakes as C;
            `;
        return CupcakeModel.getAll({ query });
    }

    async getAllWithFilters({
        tiempo,
        dificultad,
        festividad,
        predominante,
        secundario
    }) {
        let count = 1;

        const parte1 = 
        `
            SELECT c.cupcake_id, c.nombre, im.codigo
            FROM (
                SELECT cu.cupcake_id, cu.nombre, imc.imagen_id
                FROM cupcakes AS cu 
                LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id 
                WHERE 
                (imc.main = 1) 
                AND (cu.tiempo <= $1)
        `;
        let parte2 = '';
        if (dificultad !== undefined && dificultad !== '0') {
            count++;
            parte2 = `AND (cu.dificultad_id = $${count}) `;
        }
        let parte3 = '';
        if (festividad !== undefined && festividad !== '0') {
            count++;
            parte3 = `AND (cu.festividad_id = $${count}) `;
        }
        let parte4 = '';
        if (predominante !== undefined && predominante !== 'todos') {
            count++;
            parte4 = `AND (cu.colorPredominante = $${count}) `;
        }
        let parte5 = '';
        if (secundario !== undefined && secundario !== 'todos') {
            count++;
            parte5 = `AND (cu.colorSecundario = $${count}) `;
        }
        const parte6 = 
            `
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id;
            `;

        const query = parte1 + parte2 + parte3 + parte4 + parte5 + parte6;
        const params = [
            tiempo,
            dificultad,
            festividad,
            predominante,
            secundario
        ];
        return CupcakeModel.getAllWithFilters({ query, params });
    }

    async getAllByUserEmail({ lowerCaseEmail }) {
        const query = 
            `
                SELECT *
                FROM cupcakes
                WHERE paquete_id IN (
                    SELECT up.paquete_id
                    FROM usuario_paquetes AS up,
                    usuarios AS us
                    WHERE us.email = $1 AND up.usuario_id = us.usuario_id
                )
            `;
        const params = [lowerCaseEmail];
        return CupcakeModel.getAllByUserEmail({ query, params });
    }

    async getAllRamdom() {
        const query = 
            `
                SELECT c.cupcake_id
                FROM cupcakes as c
                ORDER BY RANDOM() LIMIT 1 
            `;
        return CupcakeModel.getAllRamdom({ query });
    }

    async getAllNameImage() {
        const query = 
            `
                SELECT c.cupcake_id, c.nombre, im.codigo
                FROM (
                    SELECT cu.cupcake_id, cu.nombre, imc.imagen_id
                    FROM cupcakes AS cu 
                    LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id 
                    WHERE imc.main = 1
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id;
            `;
        return CupcakeModel.getAllNameImage({ query });
    }

    async getAllNameImageByUserEmail({ lowerCaseEmail }) {
        const query = 
            `
                SELECT c.cupcake_id, c.nombre, im.codigo
                FROM (
                    SELECT cu.cupcake_id, cu.nombre, imc.imagen_id
                    FROM (
                            SELECT *
                            FROM cupcakes
                            WHERE paquete_id IN (
                                SELECT up.paquete_id
                                FROM usuario_paquetes AS up,
                                usuarios AS us
                                WHERE us.email = $1 AND up.usuario_id = us.usuario_id
                            )
                    ) AS cu 
                    LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id 
                    WHERE imc.main = 1
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id;
            `;
        const params = [lowerCaseEmail];
        return CupcakeModel.getAllNameImageByUserEmail({ query, params });
    }

    async getAllNameImageByUserEmailAndStatus({ lowerCaseEmail, estado }) {
        const query = 
            `
                SELECT 
                    c.cupcake_id, c.nombre, im.codigo
                FROM(
                    SELECT cu.cupcake_id, cu.nombre, imc.imagen_id
                    FROM cupcakes AS cu 
                    LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id
                    LEFT JOIN cupcake_usuario_estados cue ON cu.cupcake_id = cue.cupcake_id
                    WHERE
                        imc.main = 1 AND
                        cue.usuario_id = (
                            SELECT us.usuario_id
                            FROM usuarios AS us
                            WHERE us.email = $1
                        ) AND
                        cue.estado_id = $2 AND
                        cue.valor = true
                    ORDER BY cu.cupcake_id
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id
                GROUP BY 
                    c.cupcake_id, c.nombre, im.codigo;
            `;
        const params = [lowerCaseEmail, estado];
        return CupcakeModel.getAllNameImageByUserEmailAndStatus({ query, params });
    }

    async getAllNameImageByCategory({ categoria }) {
        const query = 
            `
                SELECT 
                    c.cupcake_id, c.nombre, im.codigo
                FROM(
                    SELECT cu.cupcake_id, cu.nombre, imc.imagen_id
                    FROM cupcakes AS cu 
                    LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id
                    LEFT JOIN cupcake_categorias cc ON cu.cupcake_id = cc.cupcake_id
                    WHERE
                        imc.main = 1 AND
                        cc.categoria_id = $1
                    ORDER BY cu.cupcake_id
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id
                GROUP BY 
                    c.cupcake_id, c.nombre, im.codigo;
            `;
        const params = [categoria];
        return CupcakeModel.getAllNameImageByCategory({ query, params });
    }

    async getAllNameImageByUserEmailAndCategory({ lowerCaseEmail, categoria }) {
        const query = 
            `
                SELECT 
                    c.cupcake_id, c.nombre, im.codigo
                FROM(
                    SELECT cu.cupcake_id, cu.nombre, imc.imagen_id
                    FROM (
                        SELECT *
                        FROM cupcakes
                        WHERE paquete_id IN (
                            SELECT up.paquete_id
                            FROM usuario_paquetes AS up,
                            usuarios AS us
                            WHERE us.email = $1 AND up.usuario_id = us.usuario_id
                        )
                    ) AS cu 
                    LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id
                    LEFT JOIN cupcake_categorias cc ON cu.cupcake_id = cc.cupcake_id
                    WHERE
                        imc.main = 1 AND
                        cc.categoria_id = $2
                    ORDER BY cu.cupcake_id
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id
                GROUP BY 
                    c.cupcake_id, c.nombre, im.codigo;
            `;
        const params = [lowerCaseEmail, categoria];
        return CupcakeModel.getAllNameImageByUserEmailAndCategory({ query, params });
    }

    async getAllNameImageByFestivity({ festividad }) {
        const query = 
            `
                SELECT 
                    c.cupcake_id, c.nombre, im.codigo
                FROM(
                    SELECT cu.cupcake_id, cu.nombre, imc.imagen_id
                    FROM cupcakes AS cu 
                    LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id
                    WHERE
                    imc.main = 1 AND
                    cu.festividad_id = $1
                    ORDER BY cu.cupcake_id
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id
                GROUP BY 
                    c.cupcake_id, c.nombre, im.codigo;
            `;
        const params = [festividad];
        return CupcakeModel.getAllNameImageByFestivity({ query, params });
    }

    async getAllNameImageByUserEmailAndFestivity({ lowerCaseEmail, festividad }) {
        const query = 
            `
                SELECT c.cupcake_id, c.nombre, im.codigo
                FROM (
                    SELECT cu.cupcake_id, cu.nombre, imc.imagen_id
                    FROM (
                    SELECT *
                    FROM cupcakes
                    WHERE paquete_id IN (
                        SELECT up.paquete_id
                        FROM usuario_paquetes AS up,
                        usuarios AS us
                        WHERE
                        us.email = $1 AND
                        up.usuario_id = us.usuario_id
                    )
                    ) AS cu 
                    LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id
                    WHERE
                    imc.main = 1 AND
                    cu.festividad_id = $2
                    ORDER BY cu.cupcake_id
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id
                GROUP BY c.cupcake_id, c.nombre, im.codigo;
            `;
        const params = [lowerCaseEmail, festividad];
        return CupcakeModel.getAllNameImageByUserEmailAndFestivity({ query, params });
    }

    async getAllNameImageInfoPublicPackageByUserEmail({ lowerCaseEmail }) {
        const query = `
            SELECT
                p.paquete_id,
                p.descripcion AS paquete,
                cu.cupcake_id,
                cu.nombre,
                im.codigo,

                COALESCE(cue_hecho.valor, FALSE) AS hecho,
                COALESCE(cue_favorito.valor, FALSE) AS favorito,

                cu.tiempo,
                cu.porciones,

                COUNT(cu.cupcake_id) OVER(
                    PARTITION BY p.paquete_id
                ) AS total_cupcakes

            FROM paquetes p

            INNER JOIN cupcakes cu
                ON cu.paquete_id = p.paquete_id

            LEFT JOIN imagenes_cupcakes imc
                ON cu.cupcake_id = imc.cupcake_id
                AND imc.main = 1

            LEFT JOIN imagenes im
                ON imc.imagen_id = im.imagen_id

            LEFT JOIN usuarios us
                ON LOWER(us.email) = $1

            LEFT JOIN cupcake_usuario_estados cue_hecho
                ON cue_hecho.cupcake_id = cu.cupcake_id
                AND cue_hecho.usuario_id = us.usuario_id
                AND cue_hecho.estado_id = 2

            LEFT JOIN cupcake_usuario_estados cue_favorito
                ON cue_favorito.cupcake_id = cu.cupcake_id
                AND cue_favorito.usuario_id = us.usuario_id
                AND cue_favorito.estado_id = 1

            WHERE p.paquete_id = 1
                AND p.habilitado = TRUE

            ORDER BY cu.cupcake_id;
        `;

        const params = [
            lowerCaseEmail
        ];

        return CupcakeModel.getAllNameImageInfoPackagesByUserEmail({
            query,
            params,
        });
    }

    async getAllNameImageInfoByUserEmail({ lowerCaseEmail }) {
        const query = `
            SELECT
                cu.cupcake_id,
                cu.nombre,
                im.codigo,
                COALESCE(cue.valor, FALSE) AS hecho,
                cu.tiempo,
                cu.porciones,
                COUNT(*) OVER() AS total_cupcakes
            FROM usuarios us
            INNER JOIN usuario_paquetes up
                ON up.usuario_id = us.usuario_id
            INNER JOIN cupcakes cu
                ON cu.paquete_id = up.paquete_id
            LEFT JOIN imagenes_cupcakes imc
                ON cu.cupcake_id = imc.cupcake_id
                AND imc.main = 1
            LEFT JOIN imagenes im
                ON imc.imagen_id = im.imagen_id
            LEFT JOIN cupcake_usuario_estados cue
                ON cue.cupcake_id = cu.cupcake_id
                AND cue.usuario_id = us.usuario_id
                AND cue.estado_id = 2
            WHERE us.email = $1
            ORDER BY cu.cupcake_id;
        `;

        const params = [lowerCaseEmail];
        return CupcakeModel.getAllNameImageInfoByUserEmail({ query, params });
    }

    async getAllNameImageInfoPackagesByUserEmail({ lowerCaseEmail }) {
        const query = `
            SELECT
                p.paquete_id,
                p.descripcion AS paquete,
                cu.cupcake_id,
                cu.nombre,
                im.codigo,

                COALESCE(cue_hecho.valor, FALSE) AS hecho,
                COALESCE(cue_favorito.valor, FALSE) AS favorito,

                cu.tiempo,
                cu.porciones,

                COUNT(cu.cupcake_id) OVER(
                    PARTITION BY p.paquete_id
                ) AS total_cupcakes

            FROM usuarios us

            INNER JOIN usuario_paquetes up
                ON up.usuario_id = us.usuario_id

            INNER JOIN paquetes p
                ON p.paquete_id = up.paquete_id

            INNER JOIN cupcakes cu
                ON cu.paquete_id = p.paquete_id

            LEFT JOIN imagenes_cupcakes imc
                ON cu.cupcake_id = imc.cupcake_id
                AND imc.main = 1

            LEFT JOIN imagenes im
                ON imc.imagen_id = im.imagen_id

            LEFT JOIN cupcake_usuario_estados cue_hecho
                ON cue_hecho.cupcake_id = cu.cupcake_id
                AND cue_hecho.usuario_id = us.usuario_id
                AND cue_hecho.estado_id = 2

            LEFT JOIN cupcake_usuario_estados cue_favorito
                ON cue_favorito.cupcake_id = cu.cupcake_id
                AND cue_favorito.usuario_id = us.usuario_id
                AND cue_favorito.estado_id = 1

            WHERE LOWER(us.email) = $1
                AND p.paquete_id <> 1
                AND up.activo = TRUE
                AND p.habilitado = TRUE

            ORDER BY
                p.paquete_id,
                cu.cupcake_id;
        `;

        const params = [
            lowerCaseEmail
        ];

        return CupcakeModel.getAllNameImageInfoPackagesByUserEmail({
            query,
            params,
        });
    }

    async getAllNameImageInfoMissingPackagesByUserEmail({ lowerCaseEmail }) {
        const query = `
            WITH usuario_actual AS (
                SELECT
                    usuario_id,
                    pais
                FROM usuarios
                WHERE email = LOWER($1)
                LIMIT 1
            )

            SELECT
                p.paquete_id,
                p.descripcion AS paquete,

                pp.moneda,
                pp.monto_centavos,

                cu.cupcake_id,
                cu.nombre,
                im.codigo,

                FALSE AS hecho,
                FALSE AS favorito,

                cu.tiempo,
                cu.porciones,

                COUNT(cu.cupcake_id) OVER(
                    PARTITION BY p.paquete_id
                ) AS total_cupcakes

            FROM usuario_actual ua

            CROSS JOIN paquetes p

            INNER JOIN cupcakes cu
                ON cu.paquete_id = p.paquete_id

            LEFT JOIN LATERAL (
                SELECT
                    pp.moneda,
                    pp.monto_centavos

                FROM paquete_precios pp

                WHERE pp.paquete_id = p.paquete_id
                    AND (
                        pp.pais = ua.pais
                        OR pp.defecto = TRUE
                    )

                ORDER BY
                    CASE
                        WHEN pp.pais = ua.pais THEN 1
                        WHEN pp.defecto = TRUE THEN 2
                        ELSE 3
                    END

                LIMIT 1
            ) pp
                ON TRUE

            LEFT JOIN imagenes_cupcakes imc
                ON cu.cupcake_id = imc.cupcake_id
                AND imc.main = 1

            LEFT JOIN imagenes im
                ON imc.imagen_id = im.imagen_id

            WHERE p.paquete_id <> 1
                AND p.habilitado = TRUE

                AND NOT EXISTS (
                    SELECT 1

                    FROM usuario_paquetes up

                    WHERE up.usuario_id = ua.usuario_id
                        AND up.paquete_id = p.paquete_id
                )

            ORDER BY
                p.paquete_id,
                cu.cupcake_id;
        `;

        const params = [
            lowerCaseEmail
        ];

        return CupcakeModel.getAllNameImageInfoMissingPackagesByUserEmail({
            query,
            params,
        });
    }

    async getAllNameImageMovies() {
        const query = 
            `
                SELECT 
                    c.cupcake_id, c.nombre, im.codigo
                FROM(
                    SELECT cu.cupcake_id, cu.nombre, imc.imagen_id
                    FROM cupcakes AS cu 
                    LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id
                    WHERE
                        imc.main = 1 AND
                        cu.pelicula = TRUE
                    ORDER BY cu.cupcake_id
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id
                GROUP BY 
                    c.cupcake_id, c.nombre, im.codigo;
            `;
        return CupcakeModel.getAllNameImageMovies({ query });
    }

    async getAllNameImageMoviesByUserEmail({ lowerCaseEmail }) {
        const query = 
            `
                SELECT c.cupcake_id, c.nombre, im.codigo
                FROM(
                    SELECT cu.cupcake_id, cu.nombre, imc.imagen_id
                    FROM (
                    SELECT *
                    FROM cupcakes
                    WHERE paquete_id IN (
                        SELECT up.paquete_id
                        FROM usuario_paquetes AS up,
                        usuarios AS us
                        WHERE us.email = $1 AND up.usuario_id = us.usuario_id
                    ) 
                    ) AS cu 
                    LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id
                    WHERE
                    imc.main = 1 AND
                    cu.pelicula = TRUE
                    ORDER BY cu.cupcake_id
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id
                GROUP BY c.cupcake_id, c.nombre, im.codigo; 
            `;
        const params = [lowerCaseEmail];
        return CupcakeModel.getAllNameImageMoviesByUserEmail({ query, params });
    }

    async getAllNameImageFiltros({
        tiempo,
        arrayDificultad,
        arrayFestividad,
        arrayColorPredominante,
        arrayColorSecundario
    }) {
        const query = 
            `
                SELECT cu.cupcake_id, cu.nombre, i.codigo
                FROM cupcakes AS cu
                INNER JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id AND imc.main = 1
                INNER JOIN imagenes i ON imc.imagen_id = i.imagen_id
                WHERE
                    cu.tiempo <= $1 AND
                    cu.dificultad_id = ANY ($2) AND
                    cu.festividad_id = ANY ($3) AND
                    cu.colorPredominante = ANY ($4::varchar[]) AND
                    cu.colorSecundario = ANY ($5::varchar[])
                ORDER BY cu.cupcake_id;
            `;
        const params = [
            tiempo,
            arrayDificultad,
            arrayFestividad,
            arrayColorPredominante,
            arrayColorSecundario
        ];
        return CupcakeModel.getAllNameImageFiltros({ query, params });
    }

    async getById({ id }) {
        const query = 
            `
                SELECT c.*
                FROM cupcakes as C
                WHERE C.cupcake_id = $1
            `;
        const params = [id];
        return CupcakeModel.getById({ query, params });
    }

    async getByIdAndUserEmail({
        id,
        lowerCaseEmail
    }) {

        const query = `
            SELECT
                cu.cupcake_id,
                cu.nombre,
                im.codigo,
                cu.tiempo,
                cu.porciones,

                COALESCE(
                    cue_hecho.valor,
                    FALSE
                ) AS hecho,

                COALESCE(
                    cue_favorito.valor,
                    FALSE
                ) AS favorito,

                CASE
                    /*
                    * Paquete 1 = Público.
                    *
                    * Siempre está disponible,
                    * aunque el usuario no tenga
                    * registro en usuario_paquetes.
                    */
                    WHEN cu.paquete_id = 1
                        THEN TRUE

                    /*
                    * Para paquetes de pago,
                    * comprobamos que el usuario
                    * tenga el paquete activo.
                    */
                    WHEN EXISTS (
                        SELECT 1

                        FROM usuario_paquetes up

                        WHERE up.usuario_id =
                            us.usuario_id

                            AND up.paquete_id =
                                cu.paquete_id

                            AND up.activo = TRUE
                    )
                        THEN TRUE

                    ELSE FALSE
                END AS disponible,

                p.descripcion AS paquete

            FROM cupcakes cu

            INNER JOIN paquetes p
                ON p.paquete_id =
                    cu.paquete_id

            LEFT JOIN imagenes_cupcakes imc
                ON imc.cupcake_id =
                    cu.cupcake_id

                AND imc.main = 1

            LEFT JOIN imagenes im
                ON im.imagen_id =
                    imc.imagen_id

            /*
            * El usuario se incorpora mediante LEFT JOIN
            * para que el cupcake pueda encontrarse aunque
            * no tenga comprado el paquete.
            */
            LEFT JOIN usuarios us
                ON LOWER(us.email) =
                    $2

            LEFT JOIN cupcake_usuario_estados cue_hecho
                ON cue_hecho.usuario_id =
                    us.usuario_id

                AND cue_hecho.cupcake_id =
                    cu.cupcake_id

                AND cue_hecho.estado_id = 2

            LEFT JOIN cupcake_usuario_estados cue_favorito
                ON cue_favorito.usuario_id =
                    us.usuario_id

                AND cue_favorito.cupcake_id =
                    cu.cupcake_id

                AND cue_favorito.estado_id = 1

            WHERE cu.cupcake_id =
                $1

            LIMIT 1;
        `;

        const params = [
            id,
            lowerCaseEmail
        ];

        return CupcakeModel.getById({
            query,
            params
        });
    }

    async getRandomByUserEmail({ lowerCaseEmail }) {
        const query = 
            `
                SELECT c.cupcake_id
                FROM (
                    SELECT *
                    FROM cupcakes
                    WHERE paquete_id IN (
                        SELECT up.paquete_id
                        FROM usuario_paquetes AS up,
                        usuarios AS us
                        WHERE us.email = $1 AND up.usuario_id = us.usuario_id
                    )
                ) as c
                ORDER BY RANDOM() LIMIT 1;
            `;
        const params = [lowerCaseEmail];
        return CupcakeModel.getRandomByUserEmail({ query, params });
    }

    async getByFilters({ email, tiempo, dificultad, festividad, predominante, secundario }) {
        // params siempre debe seguir el mismo orden que los $n del query
        const params = [email, tiempo]; // $1, $2
        let count = params.length;      // ahora count = 2

        const parte1 = `
            SELECT c.cupcake_id, c.nombre, im.codigo
            FROM (
                SELECT cu.cupcake_id, cu.nombre, imc.imagen_id
                FROM (
                    SELECT *
                    FROM cupcakes
                    WHERE paquete_id IN (
                        SELECT up.paquete_id
                        FROM usuario_paquetes AS up,
                            usuarios AS us
                        WHERE us.email = $1 AND up.usuario_id = us.usuario_id
                    )
                ) AS cu 
                LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id 
                WHERE 
                    (imc.main = 1) 
                    AND (cu.tiempo <= $2)
        `;

        // -------------------- DIFICULTAD --------------------
        let parte2 = '';
        if (dificultad !== undefined && dificultad !== null) {
            const difNum = parseInt(dificultad, 10);
            if (!Number.isNaN(difNum) && difNum !== 0) {
                count++;
                parte2 = `AND (cu.dificultad_id = $${count}) `;
                params.push(difNum);
            }
        }

        // -------------------- FESTIVIDAD --------------------
        let parte3 = '';
        if (festividad !== undefined && festividad !== null) {
            const festNum = parseInt(festividad, 10);

            if (!Number.isNaN(festNum)) {
                // 0 => sin filtro (no hacemos nada)
                if (festNum === 1) {
                    // 1 => festividades 1 a 6
                    // No usamos parámetros, se hardcodean los IDs
                    parte3 = `AND (cu.festividad_id IN (1, 2, 3, 4, 5, 6)) `;
                } else if (festNum >= 2 && festNum <= 7) {
                    // 2 => festividad con el id 1
                    // 3 => festividad con el id 2
                    // 4 => festividad con el id 3
                    // 5 => festividad con el id 4
                    // 6 => festividad con el id 5
                    // 7 => festividad con el id 6
                    const mapping = {
                        2: 1,
                        3: 2,
                        4: 3,
                        5: 4,
                        6: 5,
                        7: 6,
                    };
                    const targetFestividad = mapping[festNum];

                    if (targetFestividad !== undefined) {
                        count++;
                        parte3 = `AND (cu.festividad_id = $${count}) `;
                        params.push(targetFestividad);
                    }
                }
            }
        }

        // -------------------- COLOR PREDOMINANTE --------------------
        let parte4 = '';
        if (predominante !== undefined && predominante !== 'todos') {
            count++;
            parte4 = `AND (cu.colorPredominante = $${count}) `;
            params.push(predominante);
        }

        // -------------------- COLOR SECUNDARIO --------------------
        let parte5 = '';
        if (secundario !== undefined && secundario !== 'todos') {
            count++;
            parte5 = `AND (cu.colorSecundario = $${count}) `;
            params.push(secundario);
        }

        const parte6 = `
            ) AS c
            LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id;
        `;

        const query = parte1 + parte2 + parte3 + parte4 + parte5 + parte6;

        return CupcakeModel.getByFilters({ query, params });
    }

    async getByIdInfoImage({ id }) {
        const query = 
            `
                SELECT c.*, im.codigo 
                FROM (
                    SELECT cu.*, imc.imagen_id
                    FROM cupcakes AS cu 
                    LEFT JOIN imagenes_cupcakes imc ON cu.cupcake_id = imc.cupcake_id 
                    WHERE imc.main = 1 AND cu.cupcake_id = $1
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id;
            `;
        const params = [id];
        return CupcakeModel.getByIdInfoImage({ query, params });
    }
}

module.exports = CupcakeRepository;