const { CupcakeRepository } = require("@cupcake/repositories/index");

// GET Nombre, imagen principal, estado Hecho, tiempo y porciones
class GetAllNameImageInfoCupcake {

  static async execute({ email, tipo }) {
    if (!email) return [];

    const cupcakeRepository = new CupcakeRepository();

    const lowerCaseEmail = email.toLowerCase();

    // API: '/name-image-info/publico/usuario'
    // GET cupcakes pertenecientes al paquete público (paquete_id = 1).
    // El email se utiliza para conocer el estado "Hecho" de cada cupcake.
    if (tipo === 'publico') {
      const cupcakes =
        await cupcakeRepository.getAllNameImageInfoPublicPackageByUserEmail({
          lowerCaseEmail
        });

      return this.groupPackages(cupcakes);
    }

    // API: '/name-image-info/paquetes/usuario'
    // GET paquetes adquiridos por el usuario.
    // El paquete público (paquete_id = 1) continúa excluido de este endpoint.
    if (tipo === 'paquetes') {
      const cupcakes =
        await cupcakeRepository.getAllNameImageInfoPackagesByUserEmail({
          lowerCaseEmail
        });

      return this.groupPackages(cupcakes);
    }

    // API: '/name-image-info/paquetes-faltantes/usuario'
    // GET paquetes que el usuario todavía no posee.
    // Incluye información de precio.
    if (tipo === 'paquetes-faltantes') {
      const cupcakes =
        await cupcakeRepository.getAllNameImageInfoMissingPackagesByUserEmail({
          lowerCaseEmail,
        });

      if (cupcakes.length === 0) return [];

      const packagesMap = new Map();

      cupcakes.forEach(
        ({
          paquete_id,
          paquete,
          moneda,
          monto_centavos,
          total_cupcakes,
          ...cupcake
        }) => {

          if (!packagesMap.has(paquete_id)) {

            const montoCentavos =
              monto_centavos === null || monto_centavos === undefined
                ? null
                : Number(monto_centavos);

            packagesMap.set(paquete_id, {
              paquete,
              precio: {
                moneda: moneda || null,
                monto_centavos: montoCentavos,
                monto:
                  montoCentavos === null
                    ? null
                    : montoCentavos / 100,
              },
              total_cupcakes: Number(total_cupcakes),
              cupcakes: [],
            });
          }

          packagesMap
            .get(paquete_id)
            .cupcakes
            .push(cupcake);
        }
      );

      return Array.from(packagesMap.values());
    }

    // API: '/name-image-info/usuario'
    // Comportamiento original:
    // GET todos los cupcakes disponibles para el usuario como "Pack Personal".
    const cupcakes =
      await cupcakeRepository.getAllNameImageInfoByUserEmail({
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
      total_cupcakes: Number(
        cupcakes[0].total_cupcakes
      ),
      cupcakes: cupcakes.map(
        ({
          total_cupcakes,
          ...cupcake
        }) => cupcake
      )
    };
  }

  /*
   * Agrupa resultados provenientes de:
   *
   * API: '/name-image-info/publico/usuario'
   *      -> paquete público (paquete_id = 1)
   *
   * API: '/name-image-info/paquetes/usuario'
   *      -> paquetes adquiridos por el usuario
   */
  static groupPackages(cupcakes) {

    if (!cupcakes || cupcakes.length === 0) {
      return [];
    }

    const packagesMap = new Map();

    cupcakes.forEach(
      ({
        paquete_id,
        paquete,
        total_cupcakes,
        ...cupcake
      }) => {

        if (!packagesMap.has(paquete_id)) {

          packagesMap.set(
            paquete_id,
            {
              paquete,
              total_cupcakes: Number(
                total_cupcakes
              ),
              cupcakes: [],
            }
          );
        }

        packagesMap
          .get(paquete_id)
          .cupcakes
          .push(cupcake);
      }
    );

    return Array.from(
      packagesMap.values()
    );
  }
}

module.exports = GetAllNameImageInfoCupcake;