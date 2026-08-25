"use strict";

const {
    CupcakeRepository
} = require("@cupcake/repositories/index");

// GET Info del cupcake por id.
class GetByIdCupcake {

    static async execute({
        email,
        id,
        tiempo,
        dificultad,
        festividad,
        predominante,
        secundario
    }) {

        const cupcakeRepository =
                new CupcakeRepository();

        /*
         * =====================================================
         * API: /cupcake?id=X&email=...
         * =====================================================
         *
         * Este caso debe evaluarse ANTES de /ramdom/usuario.
         *
         * Antes, cualquier request que tuviera email y no
         * tuviera filtros terminaba entrando en random,
         * ignorando completamente el id.
         */
        if (
            email
            && id
        ) {

            const lowerCaseEmail =
                    email
                            .trim()
                            .toLowerCase();

            const cupcakes =
                    await cupcakeRepository
                            .getByIdAndUserEmail({
                                id,
                                lowerCaseEmail
                            });

            if (
                !cupcakes
                || cupcakes.length === 0
            ) {

                return null;
            }

            return cupcakes;
        }

        /*
         * =====================================================
         * API: /ramdom/usuario
         * =====================================================
         */
        if (
            email
            && !id
            && !tiempo
            && !dificultad
            && !festividad
            && !predominante
            && !secundario
        ) {

            const lowerCaseEmail =
                    email
                            .trim()
                            .toLowerCase();

            const cupcakes =
                    await cupcakeRepository
                            .getRandomByUserEmail({
                                lowerCaseEmail
                            });

            if (
                !cupcakes
                || cupcakes.length === 0
            ) {

                return [];
            }

            return cupcakes;
        }

        /*
         * =====================================================
         * API: /busqueda/usuario
         * =====================================================
         */
        if (
            email
            && (
                tiempo
                || dificultad
                || festividad
                || predominante
                || secundario
            )
        ) {

            const cupcakes =
                    await cupcakeRepository
                            .getByFilters({
                                email,
                                tiempo,
                                dificultad,
                                festividad,
                                predominante,
                                secundario
                            });

            if (
                !cupcakes
                || cupcakes.length === 0
            ) {

                return [];
            }

            return cupcakes;
        }

        /*
         * =====================================================
         * API: /cupcake?id=X
         * =====================================================
         */
        const cupcake =
                await cupcakeRepository
                        .getById({
                            id
                        });

        if (
            !cupcake
            || cupcake.length === 0
        ) {

            return null;
        }

        return cupcake;
    }
}

module.exports =
    GetByIdCupcake;