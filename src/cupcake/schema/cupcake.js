// Realizaremos las validaciones con Zod
const z = require('zod');

// const cupcakeSchema = z.object({
//   nombre: z.string({
//     invalid_type_error: 'Cupcake nombre must be a string',
//     required_error: 'Cupcake nombre is required.'
//   }),
//   dificultad_id: z.number().int().min(1),
//   colorPredominante: z.string({
//     invalid_type_error: 'Cupcake colorPredominante must be a string',
//     required_error: 'Cupcake colorPredominante is required.'
//   }),
//   colorSecundario: z.string({
//     invalid_type_error: 'Cupcake colorSecundario must be a string',
//     required_error: 'Cupcake colorSecundario is required.'
//   }),
//   porciones: z.number().int().min(1),
//   tiempo: z.number().int().min(1),
//   festividad_id: z.number().int().min(1),
//   pelicula: z.boolean(),
//   cupcake_acceso_id: z.number().int().min(1),
//   paquete_id: z.number().int().min(1)
// });

const emailRequired = z.preprocess(
  (v) => (v === undefined || v === null ? '' : v),
  z.string({
    required_error: 'User email is required.',
    invalid_type_error: 'User email must be a string'
  })
    .trim()
    .min(1, 'User email is required.')
    .email('User email is invalid.')
);


/*
 * =========================================================
 * ESTADOS DE CUPCAKES
 * =========================================================
 */

const cupcakeUserStateSchema = z.object({
  email: emailRequired,

  cupcake: z.coerce
    .number()
    .int()
    .min(1),

  estado: z.coerce
    .number()
    .int()
    .min(1),

  valor: z.coerce
    .boolean()
    .optional()
});

function validateCupcakeUserState(object) {
  return cupcakeUserStateSchema.safeParse(object);
}

function validatePartialCupcakeUserState(object) {
  return cupcakeUserStateSchema
    .partial()
    .safeParse(object);
}


/*
 * =========================================================
 * CALIFICACIONES
 * =========================================================
 */

const cupcakeRatingSchema = z.object({

  email: emailRequired,

  cupcake: z.coerce
    .number()
    .int()
    .min(
      1,
      'Cupcake id must be greater than 0.'
    ),

  calificacion: z.coerce
    .number()
    .int(
      'La calificación debe ser un número entero.'
    )
    .min(
      1,
      'La calificación mínima es 1.'
    )
    .max(
      5,
      'La calificación máxima es 5.'
    ),

  /*
   * El comentario puede estar vacío,
   * pero siempre debe ser texto.
   */
  comentario: z.preprocess(
    (value) => {

      if (value === undefined
          || value === null) {

        return '';
      }

      return value;
    },
    z.string({
      invalid_type_error:
        'El comentario debe ser texto.'
    })
  )
});

function validateCupcakeRating(object) {

  return cupcakeRatingSchema.safeParse(
    object
  );
}


module.exports = {

  validateCupcakeUserState,

  validatePartialCupcakeUserState,

  validateCupcakeRating
};