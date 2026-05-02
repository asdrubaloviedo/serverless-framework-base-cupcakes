const { CupcakeRepository } = require("@cupcake/repositories/index");

// GET Nombre, imagen principal, estado Hecho, tiempo y porciones
class GetAllNameImageInfoCupcake {
  static async execute({ email, tipo }) {
    if (!email) return [];

    const cupcakeRepository = new CupcakeRepository();

    const lowerCaseEmail = email.toLowerCase();

    // API: '/name-image-info/paquetes/usuario'
    if (tipo === 'paquetes') {
      const cupcakes = await cupcakeRepository.getAllNameImageInfoPackagesByUserEmail({
        lowerCaseEmail
      });

      if (cupcakes.length === 0) return [];

      const packagesMap = new Map();

      cupcakes.forEach(({ paquete_id, paquete, total_cupcakes, ...cupcake }) => {
        if (!packagesMap.has(paquete_id)) {
          packagesMap.set(paquete_id, {
            paquete,
            total_cupcakes: Number(total_cupcakes),
            cupcakes: [],
          });
        }

        packagesMap.get(paquete_id).cupcakes.push(cupcake);
      });

      return Array.from(packagesMap.values());
    }

    // API: '/name-image-info/usuario'
    const cupcakes = await cupcakeRepository.getAllNameImageInfoByUserEmail({
      lowerCaseEmail
    });

    if (cupcakes.length === 0) {
      return {
        paquete: 'Pack Personal',
        total_cupcakes: 0,
        cupcakes: []
      };
    }

    return {
      paquete: 'Pack Personal',
      total_cupcakes: Number(cupcakes[0].total_cupcakes),
      cupcakes: cupcakes.map(({ total_cupcakes, ...cupcake }) => cupcake)
    };
  }
}

module.exports = GetAllNameImageInfoCupcake;