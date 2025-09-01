const { FestivityRepository } = require("@festivity/repositories/index");

// GET Nombre, imagen principal y cantidad de los Registros de las festividades bajo diferentes parametros de filtrado
class GetAllNameImageCountFestivity {
    static async execute(email) {
        const festivityRepository = new FestivityRepository();

        // API: '/festividades-imagen-cantidad'
        if (email) {
            const lowerCaseEmail = email.toLowerCase();
            const categories = await festivityRepository.getAllNameImageCountByUserEmail({ lowerCaseEmail });

            if (categories.length === 0) return [];
            return categories;
        }

        // API: '/festividades-imagen-cantidad/usuario'
        const categories = await festivityRepository.getAllNameImageCount();

        if (categories.length === 0) return null;
        return categories;
    }
}

module.exports = GetAllNameImageCountFestivity;