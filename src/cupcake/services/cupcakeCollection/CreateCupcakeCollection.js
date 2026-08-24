"use strict";

const {
    CupcakeCollectionRepository
} = require("@cupcake/repositories/index");

class CreateCupcakeCollection {

    static async execute({
        email,
        nombre
    }) {

        if (!email) {

            throw new Error(
                "El email es requerido"
            );
        }

        if (
            !nombre
            || String(nombre).trim().length === 0
        ) {

            throw new Error(
                "El nombre de la collection es requerido"
            );
        }

        const nombreFinal =
                String(
                    nombre
                ).trim();

        if (nombreFinal.length > 100) {

            throw new Error(
                "El nombre de la collection no puede superar los 100 caracteres"
            );
        }

        const cupcakeCollectionRepository =
                new CupcakeCollectionRepository();

        const result =
                await cupcakeCollectionRepository
                        .create({
                            email,
                            nombre:
                                nombreFinal
                        });

        return result || [];
    }
}

module.exports =
    CreateCupcakeCollection;