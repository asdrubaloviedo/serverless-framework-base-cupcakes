"use strict";

const {
    CupcakeCollectionRepository
} = require("@cupcake/repositories/index");

class GetCupcakeCollections {

    static async execute({
        email,
        cupcake
    }) {

        if (!email) {

            throw new Error(
                "El email es requerido"
            );
        }

        if (!cupcake) {

            throw new Error(
                "El cupcake es requerido"
            );
        }

        const cupcakeNumero =
                Number(
                    cupcake
                );

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
                        .getByUserEmail({
                            email,
                            cupcake:
                                cupcakeNumero
                        });

        return result || [];
    }
}

module.exports =
    GetCupcakeCollections;