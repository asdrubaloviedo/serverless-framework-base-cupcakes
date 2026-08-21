"use strict";

const {
    CupcakeRatingRepository
} = require("@cupcake/repositories/index");

class SaveCupcakeRating {

    static async execute({
        email,
        cupcake,
        calificacion,
        comentario
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

        if (
            calificacion === undefined
            || calificacion === null
        ) {

            throw new Error(
                "La calificación es requerida"
            );
        }

        const calificacionNumero =
                Number(
                    calificacion
                );

        if (
            !Number.isInteger(
                calificacionNumero
            )
            || calificacionNumero < 1
            || calificacionNumero > 5
        ) {

            throw new Error(
                "La calificación debe estar entre 1 y 5"
            );
        }

        const cupcakeRatingRepository =
                new CupcakeRatingRepository();

        /*
         * Verificamos que el cupcake esté
         * marcado como hecho.
         *
         * IMPORTANTE:
         * db.query() devuelve directamente:
         *
         * [
         *     {
         *         hecho: true
         *     }
         * ]
         */
        const estadoResult =
                await cupcakeRatingRepository
                        .isCupcakeDone({
                            email,
                            cupcake
                        });

        const hecho =
                Array.isArray(
                    estadoResult
                )
                && estadoResult.length > 0
                && estadoResult[0].hecho === true;

        if (!hecho) {

            throw new Error(
                "Debes marcar como hecho el cupcake antes de poder calificarlo"
            );
        }

        const comentarioFinal =
                comentario == null
                    ? ""
                    : String(
                            comentario
                    ).trim();

        /*
         * INSERT o UPDATE según corresponda.
         */
        const result =
                await cupcakeRatingRepository
                        .save({
                            email,
                            cupcake,
                            calificacion:
                                calificacionNumero,
                            comentario:
                                comentarioFinal
                        });

        /*
         * Igual que arriba:
         * db.query() ya devuelve las filas.
         */
        return result || [];
    }
}

module.exports =
    SaveCupcakeRating;