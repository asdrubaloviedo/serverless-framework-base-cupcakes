"use strict"

const { UserPackageModel } = require("@user/models/user");

class UserPackageRepository {

    async create({
        email,
        paquete,
        moneda,
        montoCentavos,
        paisCompra,
        paymentProvider,
        paymentProviderId
    }) {
        const query = `
            INSERT INTO usuario_paquetes (
                usuario_id,
                paquete_id,
                fecha_compra,
                moneda,
                monto_centavos,
                pais_compra,
                payment_provider,
                payment_provider_id,
                activo,
                fecha_expiracion
            )
            SELECT
                (SELECT us.usuario_id
                FROM usuarios AS us
                WHERE us.email = $1),
                $2,                -- paquete_id
                NOW(),             -- fecha_compra
                $3,                -- moneda
                $4,                -- monto_centavos
                $5,                -- pais_compra
                $6,                -- payment_provider
                $7,                -- payment_provider_id
                TRUE,              -- activo
                NULL               -- fecha_expiracion
            WHERE NOT EXISTS (
                SELECT 1
                FROM usuario_paquetes up
                WHERE up.usuario_id = (
                SELECT us.usuario_id
                FROM usuarios AS us
                WHERE us.email = $1
                )
                AND up.paquete_id = $2
            )
            RETURNING usuario_paquetes_id;
        `;

        const params = [
            email,
            paquete,
            moneda,
            montoCentavos,
            paisCompra,
            paymentProvider,
            paymentProviderId
        ];

        // UserPackageModel.create devuelve directamente rows (array)
        const rows = await UserPackageModel.create({ query, params });

        // Si insertó → hay al menos 1 fila en rows
        const inserted = Array.isArray(rows) && rows.length > 0;
        return inserted;
    }

    async getCreated({ email, paquete }) {
        const query = 
            `
                SELECT *
                FROM usuario_paquetes
                WHERE usuario_id = (
                    SELECT us.usuario_id
                    FROM usuarios AS us
                    WHERE us.email = $1
                ) AND paquete_id = $2
            `
        const params = [email, paquete];
        const result = await UserPackageModel.getCreated({ query, params });
        return result.rows;
    }
}

module.exports = UserPackageRepository;