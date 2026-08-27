"use strict";

const {
    CupcakeCollectionRepository
} = require("@cupcake/repositories/index");

class GetCupcakeCollections {

    static async execute({
        email,
        cupcake
    }) {

        /*
         * =====================================================
         * EMAIL
         * =====================================================
         */

        if (!email) {

            throw new Error(
                "El email es requerido"
            );
        }

        /*
         * =====================================================
         * CUPCAKE OPCIONAL
         * =====================================================
         *
         * Si viene desde DetalleCupcakeActivity:
         *
         * cupcake > 0
         *
         * y podremos indicar en qué collection
         * está guardado.
         *
         * Si viene desde Perfil -> Mis colecciones:
         *
         * cupcake no es necesario.
         *
         * En ese caso utilizamos null.
         */

        let cupcakeNumero =
                null;

        if (
            cupcake !== undefined
            && cupcake !== null
            && cupcake !== ""
            && Number(cupcake) > 0
        ) {

            cupcakeNumero =
                    Number(
                        cupcake
                    );

            if (
                !Number.isInteger(
                    cupcakeNumero
                )
            ) {

                throw new Error(
                    "El cupcake debe ser un identificador válido"
                );
            }
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