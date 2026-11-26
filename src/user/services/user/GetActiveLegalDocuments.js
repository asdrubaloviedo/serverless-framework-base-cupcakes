
"use strict";

const LegalAcceptanceService = require(
    "@user/services/user/LegalAcceptanceService"
);

// GET: /documentos-legales-vigentes
class GetActiveLegalDocuments {

    static async execute() {

        const documentos =
            await LegalAcceptanceService.getActiveDocuments();

        return {
            success: true,
            documentos
        };
    }
}

module.exports = GetActiveLegalDocuments;
