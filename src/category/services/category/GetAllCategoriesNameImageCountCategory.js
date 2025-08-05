const { CategoryRepository } = require("@category/repositories/index");

// GET Nombre, imagen principal y cantidad de los Registros de las categorias bajo diferentes parametros de filtrado
class GetAllCategoriesNameImageCountCategory {
    static async execute(email) {
        const categoryRepository = new CategoryRepository();

        // // API: '/categorias-imagen-cantidad/usuario'
        // if (email) {
        //     const lowerCaseEmail = email.toLowerCase();

        //     const categories = await categoryRepository.getAllNameImageCountWithEmail({ lowerCaseEmail });

        //     if (categories.length === 0) return [];
        //     return categories;
        // }

        // API: '/categorias-imagen-cantidad'
        const categories = await categoryRepository.getAllNameImageCount();
        // return 'test 2';

        if (categories.length === 0) return null;
        return categories;
    }
}

module.exports = GetAllCategoriesNameImageCountCategory;