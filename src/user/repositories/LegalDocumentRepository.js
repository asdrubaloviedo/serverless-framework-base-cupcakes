
"use strict";

const { LegalDocumentModel } = require("@user/models/legal");

class LegalDocumentRepository {

    // Obtiene todos los documentos legales vigentes.
    async getActive({ transaction, lock = false } = {}) {

        const query =
            `
                SELECT
                    documento_legal_id,
                    tipo,
                    version,
                    url,
                    vigente
                FROM documentos_legales
                WHERE vigente = TRUE
                ORDER BY documento_legal_id
                ${lock ? 'FOR SHARE' : ''};
            `;

        const params = [];

        return LegalDocumentModel.get({
            query,
            params,
            transaction
        });
    }

    // Obtiene los documentos legales pendientes de un usuario.
    async getPendingByUserId({ usuarioId, transaction }) {

        const query =
            `
                SELECT
                    dl.documento_legal_id,
                    dl.tipo,
                    dl.version,
                    dl.url
                FROM documentos_legales dl
                WHERE dl.vigente = TRUE
                AND NOT EXISTS (
                    SELECT 1
                    FROM usuario_aceptaciones_legales ual
                    WHERE ual.documento_legal_id = dl.documento_legal_id
                    AND ual.usuario_id = $1
                )
                ORDER BY dl.documento_legal_id;
            `;

        const params = [usuarioId];

        return LegalDocumentModel.get({
            query,
            params,
            transaction
        });
    }
}

module.exports = LegalDocumentRepository;
