"use strict"

const { PackageModel } = require("@package/models/package");

class PackageRepository {
    async getAll({ lowerCaseEmail }) {
        const query =
            `
                SELECT final.paquete_id, final.habilitado, final.descripcion, i.codigo, pp.moneda, pp.monto_centavos
                FROM (
                    SELECT info.paquete_id, info.habilitado, info.descripcion, ip.imagen_id
                    FROM (
                        SELECT p.paquete_id, p.habilitado, p.descripcion
                        FROM paquetes AS p
                        LEFT JOIN (
                            SELECT paquete_id
                            FROM usuario_paquetes 
                            WHERE usuario_id = (
                                SELECT usuario_id
                                FROM usuarios
                                WHERE email = $1
                            )
                        ) AS up ON p.paquete_id = up.paquete_id WHERE up.paquete_id IS NULL
                    ) AS info
                    LEFT JOIN imagenes_paquetes AS ip ON info.paquete_id = ip.paquete_id AND ip.main = 1
                ) AS final
                LEFT JOIN imagenes AS i ON final.imagen_id = i.imagen_id
                LEFT JOIN paquete_precios AS pp ON pp.paquete_id = final.paquete_id AND pp.defecto = TRUE;
            `;
        
        const params = [lowerCaseEmail];
        return PackageModel.getAll({ query, params });
    }
}

module.exports = PackageRepository;