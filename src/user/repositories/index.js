
"use strict";

const UserRepository = require("@user/repositories/UserRepository");
const UserMedalLeageRepository = require("@user/repositories/UserMedalLeageRepository");
const UserPackageRepository = require("@user/repositories/UserPackageRepository");
const LegalDocumentRepository = require("@user/repositories/LegalDocumentRepository");
const UserLegalAcceptanceRepository = require("@user/repositories/UserLegalAcceptanceRepository");

module.exports = {
    UserRepository,
    UserMedalLeageRepository,
    UserPackageRepository,
    LegalDocumentRepository,
    UserLegalAcceptanceRepository
}
