
"use strict";

const LegalAcceptanceService = require(
    "@user/services/user/LegalAcceptanceService"
);

// POST: /consultar-aceptaciones-legales
class GetPendingLegalAcceptances {

    static async execute({ firebaseUid }) {

        return LegalAcceptanceService.getPendingAcceptances({
            firebaseUid
        });
    }
}

module.exports = GetPendingLegalAcceptances;
