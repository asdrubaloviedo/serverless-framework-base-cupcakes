"use strict";

const { PackageModel } = require("@package/models/package");

class PackageRepository {
    /**
     * Trae los paquetes que el usuario AÚN NO tiene
     * y resuelve UN SOLO precio por paquete según:
     *
     * 1) pp.pais = $2 AND pp.moneda = $3
     * 2) pp.pais = $2 AND pp.defecto = TRUE
     * 3) pp.pais IS NULL AND pp.defecto = TRUE
     *
     * Parámetros:
     * - lowerCaseEmail: email del usuario en minúsculas
     * - pais: código país (por ejemplo "PE")
     * - moneda: código moneda (por ejemplo "PEN")
     */
    async getAll({ lowerCaseEmail, pais, moneda }) {
        const query = `
            SELECT DISTINCT ON (p.paquete_id)
                   p.paquete_id,
                   p.habilitado,
                   p.descripcion,
                   i.codigo,
                   pp.moneda,
                   pp.monto_centavos
            FROM paquetes AS p
            -- Paquetes que el usuario aún NO tiene
            LEFT JOIN (
                SELECT paquete_id
                FROM usuario_paquetes 
                WHERE usuario_id = (
                    SELECT usuario_id
                    FROM usuarios
                    WHERE LOWER(email) = $1
                )
            ) AS up
              ON p.paquete_id = up.paquete_id

            -- Imagen principal del paquete
            LEFT JOIN imagenes_paquetes AS ip
              ON p.paquete_id = ip.paquete_id
             AND ip.main = 1

            LEFT JOIN imagenes AS i
              ON ip.imagen_id = i.imagen_id

            -- Precios del paquete
            LEFT JOIN paquete_precios AS pp
              ON pp.paquete_id = p.paquete_id

            WHERE up.paquete_id IS NULL  -- solo paquetes que el usuario no tiene

            ORDER BY
              p.paquete_id,
              CASE
                WHEN pp.pais = $2 AND pp.moneda = $3 THEN 1
                WHEN pp.pais = $2 AND pp.defecto = TRUE THEN 2
                WHEN pp.pais IS NULL AND pp.defecto = TRUE THEN 3
                ELSE 99
              END;
        `;

        const params = [
            lowerCaseEmail, // $1
            pais,           // $2
            moneda          // $3
        ];

        return PackageModel.getAll({ query, params });
    }
}

module.exports = PackageRepository;
