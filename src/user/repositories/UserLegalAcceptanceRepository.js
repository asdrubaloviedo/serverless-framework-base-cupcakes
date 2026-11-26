
"use strict";

const {
    UserLegalAcceptanceModel
} = require("@user/models/legal");

class UserLegalAcceptanceRepository {

    // Registra la aceptacion de un documento legal.
    async create({
        usuarioId,
        documentoLegalId,
        metodoAceptacion,
        transaction
    }) {

        const query =
            `
                INSERT INTO usuario_aceptaciones_legales (
                    usuario_id,
                    documento_legal_id,
                    metodo_aceptacion
                )
                VALUES ($1, $2, $3)
                ON CONFLICT (
                    usuario_id,
                    documento_legal_id
                ) DO NOTHING
                RETURNING
                    usuario_aceptacion_legal_id,
                    usuario_id,
                    documento_legal_id,
                    fecha_aceptacion,
                    metodo_aceptacion;
            `;

        const params = [
            usuarioId,
            documentoLegalId,
            metodoAceptacion
        ];

        return UserLegalAcceptanceModel.create({
            query,
            params,
            transaction
        });
    }

    // Obtiene el historial de aceptaciones de un usuario.
    async getByUserId({ usuarioId, transaction }) {

        const query =
            `
                SELECT
                    ual.usuario_aceptacion_legal_id,
                    ual.usuario_id,
                    ual.documento_legal_id,
                    dl.tipo,
                    dl.version,
                    dl.url,
                    dl.vigente,
                    ual.fecha_aceptacion,
                    ual.metodo_aceptacion
                FROM usuario_aceptaciones_legales ual
                INNER JOIN documentos_legales dl
                    ON dl.documento_legal_id =
                       ual.documento_legal_id
                WHERE ual.usuario_id = $1
                ORDER BY
                    ual.fecha_aceptacion DESC,
                    ual.usuario_aceptacion_legal_id DESC;
            `;

        const params = [usuarioId];

        return UserLegalAcceptanceModel.get({
            query,
            params,
            transaction
        });
    }
}

module.exports = UserLegalAcceptanceRepository;
