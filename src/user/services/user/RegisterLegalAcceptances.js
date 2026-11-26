
"use strict";

const LegalAcceptanceService = require(
    "@user/services/user/LegalAcceptanceService"
);

// POST: /registrar-aceptaciones-legales
class RegisterLegalAcceptances {

    static async execute({
        firebaseUid,
        documentoLegalIds
    }) {

        return LegalAcceptanceService.registerPendingAcceptances({
            firebaseUid,
            documentoLegalIds
        });
    }
}

module.exports = RegisterLegalAcceptances;
