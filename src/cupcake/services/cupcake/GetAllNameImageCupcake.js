const { CupcakeRepository } = require("@cupcake/repositories");

// GET Nombre e imagen principal de los Registros de la tabla cupcakes bajo diferentes parametros de filtrado
class GetAllNameImageCupcake {
    static async execute({ cupcakeModel, email, estado, categoria, festividad }) {
        try {
            const cupcakeRepository = new CupcakeRepository(cupcakeModel);

            // API: '/name-image/usuario'
            if (email && !estado && !categoria && !festividad) {
                const lowerCaseEmail = email.toLowerCase();
                const cupcakes = await cupcakeRepository.getAllNameImageByUserEmail({ lowerCaseEmail });

                if (cupcakes.length === 0) return [];
                return cupcakes;
            }

            // API: '/name-image-estado'
            if (email && estado && !categoria && !festividad) {
                const lowerCaseEmail = email.toLowerCase();
                const cupcakes = await cupcakeRepository.getAllNameImageByUserEmailAndStatus({ lowerCaseEmail, estado });

                if (cupcakes.length === 0) return [];
                return cupcakes;
            }

            // API: '/name-image-categoria'
            if (!email && categoria) {
                const cupcakes = await cupcakeRepository.getAllNameImageByCategory({ categoria });

                if (cupcakes.length === 0) return [];
                return cupcakes;
            }

            // API: '/name-image-categoria/usuario'
            if (email && categoria) {
                const lowerCaseEmail = email.toLowerCase();
                const cupcakes = await cupcakeRepository.getAllNameImageByUserEmailAndCategory({ lowerCaseEmail, categoria });

                if (cupcakes.length === 0) return [];
                return cupcakes;
            }

            // API: '/name-image-festividad'
            if (!email && festividad) {
                const cupcakes = await cupcakeRepository.getAllNameImageByFestivity({ festividad });

                if (cupcakes.length === 0) return [];
                return cupcakes;
            }

            // API: '/name-image-festividad/usuario'
            if (email && festividad) {
                const lowerCaseEmail = email.toLowerCase();
                const cupcakes = await cupcakeRepository.getAllNameImageByUserEmailAndFestivity({ lowerCaseEmail, festividad });

                if (cupcakes.length === 0) return [];
                return cupcakes;
            }

            // API: '/name-image'
            const cupcakes = await cupcakeRepository.getAllNameImage();
            return cupcakes;
        } catch (err) {
            throw new Error(`[CupcakeService] Fallo en GetAllNameImageCupcake: ${err.message}`);
        }
    }
}

module.exports = GetAllNameImageCupcake;