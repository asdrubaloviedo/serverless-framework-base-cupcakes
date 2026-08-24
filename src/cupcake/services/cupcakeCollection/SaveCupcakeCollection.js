"use strict";

const {
    CupcakeCollectionRepository
} = require("@cupcake/repositories/index");

class SaveCupcakeCollection {

    static async execute({
        email,
        collection,
        cupcake
    }) {

        if (!email) {

            throw new Error(
                "El email es requerido"
            );
        }

        if (!collection) {

            throw new Error(
                "La collection es requerida"
            );
        }

        if (!cupcake) {

            throw new Error(
                "El cupcake es requerido"
            );
        }

        const collectionNumero =
                Number(
                    collection
                );

        const cupcakeNumero =
                Number(
                    cupcake
                );

        if (
            !Number.isInteger(
                collectionNumero
            )
            || collectionNumero <= 0
        ) {

            throw new Error(
                "La collection debe ser un identificador válido"
            );
        }

        if (
            !Number.isInteger(
                cupcakeNumero
            )
            || cupcakeNumero <= 0
        ) {

            throw new Error(
                "El cupcake debe ser un identificador válido"
            );
        }

        const cupcakeCollectionRepository =
                new CupcakeCollectionRepository();

        const result =
                await cupcakeCollectionRepository
                        .saveCupcake({
                            email,
                            collection:
                                collectionNumero,
                            cupcake:
                                cupcakeNumero
                        });

        /*
         * Si devuelve [], normalmente significa
         * que la collection no pertenece al usuario
         * o que el cupcake ya estaba guardado.
         *
         * Por ahora dejamos la operación idempotente.
         */
        return result || [];
    }
}

module.exports =
    SaveCupcakeCollection;