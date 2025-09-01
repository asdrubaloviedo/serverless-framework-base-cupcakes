"use strict"

const { FestivityModel } = require("@festivity/models/festivity");

class FestivityRepository {
    async getAllNameImageCount() {
        const query = 
            `
                SELECT
                    c.festividad_id, c.descripcion, im.codigo,
                    count_items
                FROM(
                    SELECT
                    cup.festividad_id, f.descripcion, imc.imagen_id,
                    COUNT(cup.festividad_id) AS count_items
                    FROM cupcakes AS cup
                    LEFT JOIN festividades AS f ON cup.festividad_id = f.festividad_id
                    LEFT JOIN imagenes_festividades imc ON cup.festividad_id = imc.festividad_id 
                    WHERE imc.main = 1
                    GROUP BY
                    cup.festividad_id, f.descripcion, imc.imagen_id
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id
                GROUP BY
                    c.festividad_id, c.descripcion, im.codigo, count_items;
            `;
        return FestivityModel.getAllNameImageCount({ query }); 
    }

    async getAllNameImageCountByUserEmail({ lowerCaseEmail }) {
        const query = 
            `
                SELECT c.festividad_id, c.descripcion, im.codigo, count_items
                FROM(
                    SELECT 
                        cup.festividad_id, f.descripcion, imc.imagen_id,
                        COUNT(cup.festividad_id) AS count_items
                    FROM (
                        SELECT *
                        FROM cupcakes
                        WHERE paquete_id IN (
                            SELECT up.paquete_id
                            FROM usuario_paquetes AS up,
                            usuarios AS us
                            WHERE us.email = $1 AND up.usuario_id = us.usuario_id	
                        )
                    ) AS cup
                    LEFT JOIN festividades AS f ON cup.festividad_id = f.festividad_id
                    LEFT JOIN imagenes_festividades imc ON cup.festividad_id = imc.festividad_id 
                    WHERE imc.main = 1
                    GROUP BY cup.festividad_id, f.descripcion, imc.imagen_id
                ) AS c
                LEFT JOIN imagenes im ON c.imagen_id = im.imagen_id
                GROUP BY c.festividad_id, c.descripcion, im.codigo, count_items; 
            `;
        const params = [lowerCaseEmail];
        return FestivityModel.getAllNameImageCountByUserEmail({ query, params });
    }
}

module.exports = FestivityRepository;