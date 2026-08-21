"use strict";

const {
    CupcakeRatingRepository
} = require("@cupcake/repositories/index");

class GetCupcakeRating {

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

        const cupcakeRatingRepository =
                new CupcakeRatingRepository();

        const result =
                await cupcakeRatingRepository
                        .getByUserEmailAndCupcakeId({
                            email,
                            cupcake
                        });

        /*
         * En este proyecto db.query()
         * devuelve directamente un array.
         */
        return result || [];
    }
}

module.exports =
    GetCupcakeRating;