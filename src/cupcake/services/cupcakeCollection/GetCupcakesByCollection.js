"use strict";

const {
    CupcakeCollectionRepository
} = require("@cupcake/repositories/index");

class GetCupcakesByCollection {

    static async execute({
        email,
        collection
    }) {

        /*
         * =====================================================
         * EMAIL
         * =====================================================
         */

        if (
            !email
            || typeof email !== "string"
            || email.trim().length === 0
        ) {

            throw new Error(
                "El email es requerido"
            );
        }

        const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

        /*
         * =====================================================
         * COLLECTION
         * =====================================================
         */

        const collectionNumero =
                Number(
                    collection
                );

        if (
            !Number.isInteger(
                collectionNumero
            )
            || collectionNumero <= 0
        ) {

            throw new Error(
                "La colección debe ser un identificador válido"
            );
        }

        /*
         * =====================================================
         * REPOSITORY
         * =====================================================
         */

        const cupcakeCollectionRepository =
                new CupcakeCollectionRepository();

        const result =
                await cupcakeCollectionRepository
                    .getCupcakesByCollection({
                        email:
                            normalizedEmail,

                        collection:
                            collectionNumero
                    });

        return result || [];
    }
}

module.exports =
    GetCupcakesByCollection;