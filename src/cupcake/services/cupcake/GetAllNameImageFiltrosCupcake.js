const { CupcakeRepository } = require("@cupcake/repositories/index");
const {
  allColors,
  MCupcakeColor,
  MCupcakeFestivity,
  MCupcakeDifficulty
} = require('@cupcake/services/cupcake/utilities');

// GET Nombre e imagen principal de los Registros de la tabla cupcakes, para un id de usuario especifico y filtros especificos
class GetAllNameImageFiltrosCupcake {
    // ?tiempo=150&dificultad=todas&festividad=todas&colorpredominante=todos&colorsecundario=todos
    static async execute({ tiempo, dificultad, festividad, colorpredominante, colorsecundario }) {
        const cupcakeRepository = new CupcakeRepository();

        // API: '/name-image-filtros'
        let arrayDificultad = [];
        let arrayFestividad = [];
        let arrayColorPredominante = [];
        let arrayColorSecundario = [];

        const lowerCaseDificultad = dificultad.toLowerCase();
        const lowerCaseFestividad = festividad.toLowerCase();
        const lowerCaseColorPredominante = colorpredominante.toLowerCase();
        const lowerCaseColorSecundario = colorsecundario.toLowerCase();

        // Buscamos la opcion seleccionada, si esta no esta en la lista de opciones aceptadas de su respectivo Mapa devolvera undefined
        const dificultadSeleccionada = MCupcakeDifficulty[lowerCaseDificultad];
        const festividadSeleccionada = MCupcakeFestivity[lowerCaseFestividad];
        const colorPredominante = MCupcakeColor[lowerCaseColorPredominante];
        const colorSecundario = MCupcakeColor[lowerCaseColorSecundario];

        // Array con las opciones deseadas, si le damos un undefined devolvera un array con todos las opciones posibles
        arrayDificultad = dificultadSeleccionada
        ? [dificultadSeleccionada]
        : Object.values(MCupcakeDifficulty);
        arrayFestividad = festividadSeleccionada
        ? [festividadSeleccionada]
        : Object.values(MCupcakeFestivity);
        arrayColorPredominante = colorPredominante
        ? [colorPredominante]
        : allColors;
        arrayColorSecundario = colorSecundario ? [colorSecundario] : allColors;
        
        const cupcakes = await cupcakeRepository.getAllNameImageFiltros({
            tiempo,
            arrayDificultad,
            arrayFestividad,
            arrayColorPredominante,
            arrayColorSecundario
        });

        if (cupcakes.length === 0) return [];
        return cupcakes;
    }
}

module.exports = GetAllNameImageFiltrosCupcake;