const { CupcakeRepository } = require("@cupcake/repositories/index");

/*
 * GET paquete destacado para un usuario.
 *
 * Obtiene el paquete marcado como:
 *
 * paquete_destacado = TRUE
 *
 * El repository devuelve ahora el paquete destacado
 * independientemente de si el usuario ya lo posee.
 *
 * Además devuelve:
 *
 * comprado = true
 * comprado = false
 *
 * según exista un registro activo en usuario_paquetes.
 */
class GetFeaturedPackageByUserEmail {

  static async execute({ email }) {

    /*
     * Si no recibimos email, no podemos determinar
     * el usuario ni su país para obtener el precio.
     */
    if (!email) {
      return [];
    }

    const cupcakeRepository =
      new CupcakeRepository();

    /*
     * Los emails se manejan en minúsculas
     * para mantener el mismo comportamiento
     * utilizado por los demás servicios.
     */
    const lowerCaseEmail =
      email.toLowerCase();

    /*
     * Consulta el paquete destacado junto con:
     *
     * - precio
     * - cupcakes
     * - imagen principal
     * - tiempo
     * - porciones
     * - estado de compra del usuario
     */
    const cupcakes =
      await cupcakeRepository.getFeaturedPackageByUserEmail({
        lowerCaseEmail,
      });

    /*
     * Si no existe paquete destacado,
     * devolvemos un arreglo vacío.
     *
     * IMPORTANTE:
     *
     * Que el usuario ya posea el paquete YA NO provoca
     * que lleguemos aquí con un arreglo vacío.
     *
     * En ese caso el repository devuelve igualmente
     * el paquete con:
     *
     * comprado = true
     */
    if (!cupcakes || cupcakes.length === 0) {
      return [];
    }

    /*
     * Todos los registros pertenecen al mismo
     * paquete destacado.
     *
     * Tomamos el primero para obtener
     * la información general.
     */
    const {
      paquete_id,
      paquete,
      paquete_destacado,
      fecha_creacion,
      comprado,
      moneda,
      monto_centavos,
      total_cupcakes,
    } = cupcakes[0];

    const montoCentavos =
      monto_centavos === null ||
      monto_centavos === undefined
        ? null
        : Number(monto_centavos);

    /*
     * Construimos una sola respuesta de paquete,
     * con todos sus cupcakes dentro.
     */
    return {
      paquete_id,
      paquete,
      paquete_destacado,
      fecha_creacion,

      /*
       * Estado de adquisición del paquete destacado.
       *
       * Boolean(...) garantiza que la respuesta final
       * siempre sea true o false.
       */
      comprado: Boolean(comprado),

      precio: {
        moneda: moneda || null,
        monto_centavos: montoCentavos,
        monto:
          montoCentavos === null
            ? null
            : montoCentavos / 100,
      },

      total_cupcakes:
        Number(total_cupcakes),

      cupcakes: cupcakes.map(
        ({
          paquete_id,
          paquete,
          paquete_destacado,
          fecha_creacion,
          comprado,
          moneda,
          monto_centavos,
          total_cupcakes,
          ...cupcake
        }) => cupcake
      ),
    };
  }
}

module.exports = GetFeaturedPackageByUserEmail;