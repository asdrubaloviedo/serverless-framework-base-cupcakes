"use strict"

const { CategoryModel } = require("@category/models/category");

class CategoryRepository {
    async getAllNameImageCount() {
        const query = 
            `
                SELECT
                    c.categoria_id, c.descripcion, im.codigo,
                    count_items
                FROM(
                    SELECT
                    cc.categoria_id, c.descripcion, imc.imagen_id,
                    COUNT(cc.categoria_id) AS count_items
                    FROM cupcake_categorias AS cc
                    LEFT JOIN categorias AS c ON cc.categoria_id = c.categoria_id
                    LEFT JOIN imagenes_categorias imc ON cc.categoria_id = imc.categoria_id 
                    WHERE imc.main = 1
                    GROUP BY cc.categoria_id, c.descripcion, imc.imagen_id
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id
                GROUP BY c.categoria_id, c.descripcion, im.codigo, count_items;
            `;
        return CategoryModel.getAllNameImageCount({ query }); 
    }

    async getAllNameImageCountWithEmail({ lowerCaseEmail }) {
        const query = 
            `
                SELECT
                    c.categoria_id, c.descripcion, im.codigo,
                    count_items
                FROM (
                    SELECT
                    cc.categoria_id, c.descripcion, imc.imagen_id,
                    COUNT(cc.categoria_id) AS count_items
                    FROM (
                        SELECT *
                        FROM cupcake_categorias AS ccat
                        JOIN (
                            SELECT *
                            FROM cupcakes
                            WHERE paquete_id IN (
                                SELECT up.paquete_id
                                FROM usuario_paquetes AS up,
                                usuarios AS us
                                WHERE us.email = $1 AND up.usuario_id = us.usuario_id
                            )
                        ) AS c ON ccat.cupcake_id = c.cupcake_id
                    ) AS cc
                    LEFT JOIN categorias AS c ON cc.categoria_id = c.categoria_id
                    LEFT JOIN imagenes_categorias imc ON cc.categoria_id = imc.categoria_id 
                    WHERE imc.main = 1
                    GROUP BY cc.categoria_id, c.descripcion, imc.imagen_id
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id
                GROUP BY c.categoria_id, c.descripcion, im.codigo, count_items;
            `;
        const params = [lowerCaseEmail];
        return this.categoryModel.getAllNameImageCountWithEmail({ query, params });
    }
}

module.exports = CategoryRepository;