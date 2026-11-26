
"use strict";

const db = require("@db/db");

const {
    UserRepository,
    LegalDocumentRepository,
    UserLegalAcceptanceRepository
} = require("@user/repositories");

const REQUIRED_DOCUMENT_TYPES = [
    "terminos_condiciones",
    "politica_privacidad"
];

const REGISTRATION_METHODS = [
    "tradicional",
    "google"
];

class LegalAcceptanceService {

    // Obtiene y valida los documentos legales vigentes.
    static async getActiveDocuments({
        transaction,
        lock = false
    } = {}) {

        const repository = new LegalDocumentRepository();

        const documents = await repository.getActive({
            transaction,
            lock
        });

        const validDocuments =
            documents.length === REQUIRED_DOCUMENT_TYPES.length &&
            REQUIRED_DOCUMENT_TYPES.every(tipo =>
                documents.filter(document =>
                    document.tipo === tipo
                ).length === 1
            );

        if (!validDocuments) {
            throw {
                statusCode: 503,
                message: "Documentos legales obligatorios no disponibles"
            };
        }

        return documents;
    }

    // Valida los identificadores recibidos desde la aplicacion.
    static validateDocumentIds(documentoLegalIds) {

        if (
            !Array.isArray(documentoLegalIds) ||
            documentoLegalIds.length === 0 ||
            documentoLegalIds.length > REQUIRED_DOCUMENT_TYPES.length ||
            documentoLegalIds.some(id =>
                !Number.isSafeInteger(id) || id <= 0
            ) ||
            new Set(documentoLegalIds).size !== documentoLegalIds.length
        ) {
            throw {
                statusCode: 400,
                message: "Documentos legales aceptados no válidos"
            };
        }
    }

    // Valida el UID obtenido desde una identidad autenticada.
    static validateFirebaseUid(firebaseUid) {

        if (
            typeof firebaseUid !== "string" ||
            !firebaseUid.trim() ||
            firebaseUid.length > 128
        ) {
            throw {
                statusCode: 401,
                message: "Identidad de usuario no válida"
            };
        }
    }

    // Valida que durante el registro se acepten todos
    // los documentos legales vigentes.
    static async validateRegistrationDocuments({
        documentoLegalIds,
        transaction
    }) {

        this.validateDocumentIds(documentoLegalIds);

        if (!transaction) {
            throw new Error("Se requiere una transacción");
        }

        const documents = await this.getActiveDocuments({
            transaction,
            lock: true
        });

        const activeIds = documents.map(document =>
            document.documento_legal_id
        );

        const completeAcceptance =
            documentoLegalIds.length === activeIds.length &&
            activeIds.every(id =>
                documentoLegalIds.includes(id)
            );

        if (!completeAcceptance) {
            throw {
                statusCode: 409,
                message: "Debe aceptar todos los documentos legales vigentes"
            };
        }

        return documents;
    }

    // Registra las aceptaciones durante la creacion
    // de un usuario tradicional o de Google.
    static async registerInitialAcceptances({
        usuarioId,
        documentoLegalIds,
        metodoAceptacion,
        transaction
    }) {

        if (!transaction) {
            throw new Error("Se requiere una transacción");
        }

        if (
            !Number.isSafeInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            throw new Error("Identificador de usuario no válido");
        }

        if (!REGISTRATION_METHODS.includes(metodoAceptacion)) {
            throw new Error("Método de registro no válido");
        }

        const documents = await this.validateRegistrationDocuments({
            documentoLegalIds,
            transaction
        });

        const repository = new UserLegalAcceptanceRepository();

        for (const document of documents) {

            const rows = await repository.create({
                usuarioId,
                documentoLegalId: document.documento_legal_id,
                metodoAceptacion,
                transaction
            });

            if (rows.length !== 1) {
                throw {
                    statusCode: 409,
                    message: "No fue posible registrar las aceptaciones iniciales"
                };
            }
        }
    }

    // Consulta los documentos vigentes pendientes de aceptacion.
    // El UID debe proceder de una identidad Firebase verificada.
    static async getPendingAcceptances({ firebaseUid }) {

        this.validateFirebaseUid(firebaseUid);

        const userRepository = new UserRepository();
        const legalRepository = new LegalDocumentRepository();

        return db.tx(async transaction => {

            const usuarioId = await userRepository.getIdByFirebaseUid({
                firebaseUid,
                transaction
            });

            if (usuarioId === null) {
                throw {
                    statusCode: 404,
                    message: "Usuario no registrado"
                };
            }

            await this.getActiveDocuments({
                transaction,
                lock: true
            });

            const pendingDocuments =
                await legalRepository.getPendingByUserId({
                    usuarioId,
                    transaction
                });

            return {
                success: true,
                aceptaciones_completas: pendingDocuments.length === 0,
                documentos_pendientes: pendingDocuments
            };
        });
    }

    // Registra aceptaciones posteriores al registro.
    // El UID debe proceder de una identidad Firebase verificada.
    static async registerPendingAcceptances({
        firebaseUid,
        documentoLegalIds
    }) {

        this.validateFirebaseUid(firebaseUid);
        this.validateDocumentIds(documentoLegalIds);

        const userRepository = new UserRepository();
        const legalRepository = new LegalDocumentRepository();
        const acceptanceRepository = new UserLegalAcceptanceRepository();

        return db.tx(async transaction => {

            const usuarioId = await userRepository.getIdByFirebaseUid({
                firebaseUid,
                transaction
            });

            if (usuarioId === null) {
                throw {
                    statusCode: 404,
                    message: "Usuario no registrado"
                };
            }

            const activeDocuments = await this.getActiveDocuments({
                transaction,
                lock: true
            });

            const activeIds = activeDocuments.map(document =>
                document.documento_legal_id
            );

            const validDocuments = documentoLegalIds.every(id =>
                activeIds.includes(id)
            );

            if (!validDocuments) {
                throw {
                    statusCode: 409,
                    message: "Los documentos legales vigentes han cambiado"
                };
            }

            const pendingDocuments =
                await legalRepository.getPendingByUserId({
                    usuarioId,
                    transaction
                });

            const pendingIds = pendingDocuments.map(document =>
                document.documento_legal_id
            );

            const completeAcceptance = pendingIds.every(id =>
                documentoLegalIds.includes(id)
            );

            if (!completeAcceptance) {
                throw {
                    statusCode: 409,
                    message: "Debe aceptar todos los documentos legales pendientes"
                };
            }

            for (const documentoLegalId of documentoLegalIds) {

                await acceptanceRepository.create({
                    usuarioId,
                    documentoLegalId,
                    metodoAceptacion: "actualizacion",
                    transaction
                });
            }

            const remainingDocuments =
                await legalRepository.getPendingByUserId({
                    usuarioId,
                    transaction
                });

            if (remainingDocuments.length > 0) {
                throw {
                    statusCode: 409,
                    message: "Existen documentos legales pendientes de aceptación"
                };
            }

            return {
                success: true,
                aceptaciones_completas: true,
                documentos_pendientes: []
            };
        });
    }
}

module.exports = LegalAcceptanceService;
