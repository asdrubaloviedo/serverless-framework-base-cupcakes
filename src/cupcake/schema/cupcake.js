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
//   // Todos los campos que no se especifican seran ignorados para evitar inyeccion de sql e intentos de modificacion del id
// });

// function validateCupcake(object) {
//   // "safeParse" utiliza el objeto cupcakeSchema para validar todas las reglas establecidas
//   return cupcakeSchema.safeParse(object);
// }

// function validatePartialCupcake(object) {
//   // "partial" hace que los campos de cupcakeSchema no sean requeridos(Excelente para los Patch)
//   return cupcakeSchema.partial().safeParse(object);
// }

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

const cupcakeUserStateSchema = z.object({
  email: emailRequired,
  cupcake: z.coerce.number().int().min(1),
  estado:  z.coerce.number().int().min(1),
  valor:   z.coerce.boolean().optional()
});

function validateCupcakeUserState(object) {
  return cupcakeUserStateSchema.safeParse(object);
}

function validatePartialCupcakeUserState(object) {
  return cupcakeUserStateSchema.partial().safeParse(object);
}

module.exports = {
  // validateCupcake,
  // validatePartialCupcake,
  validateCupcakeUserState,
  validatePartialCupcakeUserState
};
