const z = require('zod');


/*
 * =========================================================
 * CAMPOS REUTILIZABLES
 * =========================================================
 */

/*
 * Email obligatorio.
 *
 * Se reutiliza en los diferentes schemas de usuario para:
 * - Validar que exista.
 * - Eliminar espacios al inicio y al final.
 * - Validar el formato del correo.
 * - Convertirlo a minúsculas.
 */
const emailRequired = z.preprocess(
  (v) => (v == null ? '' : v),
  z.string({
    required_error: 'User email is required.',
    invalid_type_error: 'User email must be a string'
  })
    .trim()
    .min(1, 'User email is required.')
    .email('User email is invalid.')
    .transform((value) => value.toLowerCase())
);


/*
 * Nombre obligatorio del usuario.
 */
const nameRequired = z.preprocess(
  (v) => (v == null ? '' : v),
  z.string({
    required_error: 'User nombre is required.',
    invalid_type_error: 'User nombre must be a string.'
  })
    .trim()
    .min(2, 'User nombre must have at least 2 characters.')
    .max(50, 'User nombre must be at most 50 characters.')
    .transform((value) => value.replace(/\s+/g, ' '))
);


/*
 * País del usuario.
 *
 * Si no se recibe ninguno, se utiliza PER por defecto.
 */
const paisOptional = z.preprocess(
  (v) => (v == null || v === '' ? 'PER' : v),
  z.string()
    .trim()
    .regex(
      /^[A-Za-z]{3}$/,
      'User pais must be a 3-letter country code.'
    )
    .transform((value) => value.toUpperCase())
);


/*
 * ID numérico obligatorio.
 */
const idRequired = (name) =>
  z.coerce.number({
    required_error: `${name} is required.`
  })
    .int(`${name} must be an integer.`)
    .min(1, `${name} must be >= 1.`);


/*
 * Moneda obligatoria.
 */
const currencyRequired = z.string({
  required_error: 'moneda is required.'
})
  .trim()
  .regex(
    /^[A-Za-z]{3}$/,
    'moneda must be a 3-letter currency code (e.g. USD, EUR, PEN).'
  )
  .transform((s) => s.toUpperCase());


/*
 * Monto en centavos obligatorio.
 */
const amountCentsRequired = z.coerce.number({
  required_error: 'montoCentavos is required.'
})
  .int('montoCentavos must be an integer.')
  .min(0, 'montoCentavos must be >= 0.');


/*
 * País donde se realizó la compra.
 */
const countryOptional = z.string()
  .trim()
  .regex(
    /^[A-Za-z]{2}$/,
    'paisCompra must be a 2-letter country code (e.g. US, PE, ES).'
  )
  .transform((s) => s.toUpperCase())
  .optional();


/*
 * =========================================================
 * USER MEDAL
 * =========================================================
 */

const createUserMedalSchema = z.object({
  email: emailRequired,
  medalla: idRequired('medalla')
});


const patchUserMedalSchema = z.object({
  email: emailRequired,
  cupcake: idRequired('cupcake').optional(),
  estado: idRequired('estado').optional(),
  valor: z.coerce.boolean().optional()
})
  .refine(
    (d) =>
      d.cupcake !== undefined ||
      d.estado !== undefined ||
      d.valor !== undefined,
    {
      message: 'At least one field to update is required.',
      path: ['update']
    }
  );


/*
 * =========================================================
 * USER PACKAGE
 * =========================================================
 */

const createUserPackageSchema = z.object({
  email: emailRequired,
  paquete: idRequired('paquete'),
  moneda: currencyRequired,
  montoCentavos: amountCentsRequired,
  paisCompra: countryOptional,

  paymentProvider: z.string()
    .trim()
    .min(1, 'paymentProvider cannot be empty.')
    .max(
      30,
      'paymentProvider must be at most 30 characters.'
    )
    .optional(),

  paymentProviderId: z.string()
    .trim()
    .min(1, 'paymentProviderId cannot be empty.')
    .max(
      100,
      'paymentProviderId must be at most 100 characters.'
    )
    .optional()
});


/*
 * =========================================================
 * CREATE USER
 * =========================================================
 */

const createUserSchema = z.object({
  nombre: nameRequired,
  email: emailRequired,
  pais: paisOptional.default('PER')
}).strict();


/*
 * =========================================================
 * UPDATE USER
 * =========================================================
 *
 * Para actualizar el perfil necesitamos:
 * - nombre
 * - email
 * - avatarId
 *
 * El email identifica al usuario.
 * avatarId debe corresponder a un avatar existente en
 * la tabla avatares.
 */
const updateUserSchema = z.object({
  nombre: nameRequired,
  email: emailRequired,
  avatarId: idRequired('avatarId')
}).strict();


/*
 * =========================================================
 * USER PREFERENCES
 * =========================================================
 */

/*
 * Para consultar las preferencias únicamente necesitamos
 * identificar al usuario mediante su email.
 *
 * .strict() evita aceptar campos adicionales que no formen
 * parte de esta operación.
 */
const getUserPreferencesSchema = z.object({
  email: emailRequired
}).strict();


/*
 * Para actualizar las preferencias recibimos siempre el estado
 * completo de las seis opciones mostradas en la aplicación.
 *
 * Utilizamos z.boolean() intencionalmente para exigir booleanos
 * JSON reales:
 *
 * true
 * false
 *
 * No convertimos strings como "true" o "false".
 */
const updateUserPreferencesSchema = z.object({
  email: emailRequired,
  recordatorios: z.boolean(),
  mensajes: z.boolean(),
  promociones: z.boolean(),
  musica: z.boolean(),
  efectos_sonido: z.boolean(),
  vibracion: z.boolean()
}).strict();


/*
 * =========================================================
 * PASSWORD RESET
 * =========================================================
 *
 * Para solicitar una recuperación de contraseña solamente
 * necesitamos recibir el correo electrónico del usuario.
 *
 * Reutilizamos emailRequired para mantener exactamente las
 * mismas reglas de validación que utiliza el resto del módulo.
 *
 * .strict() evita aceptar accidentalmente otros campos que no
 * formen parte de esta operación.
 */
const sendPasswordResetEmailSchema = z.object({
  email: emailRequired
}).strict();


/*
 * =========================================================
 * VALIDADORES
 * =========================================================
 */

const validateCreateUserMedalLeage = (o) =>
  createUserMedalSchema.safeParse(o);

const validatePatchUserMedalLeage = (o) =>
  patchUserMedalSchema.safeParse(o);

const validateCreateUserPackage = (o) =>
  createUserPackageSchema.safeParse(o);

const validateCreateUser = (o) =>
  createUserSchema.safeParse(o);

const validateUpdateUser = (o) =>
  updateUserSchema.safeParse(o);


/*
 * Valida los parámetros recibidos cuando se consultan
 * las preferencias del usuario.
 */
const validateGetUserPreferences = (o) =>
  getUserPreferencesSchema.safeParse(o);


/*
 * Valida el body recibido cuando se actualizan
 * las preferencias del usuario.
 */
const validateUpdateUserPreferences = (o) =>
  updateUserPreferencesSchema.safeParse(o);


/*
 * Valida el body recibido cuando el usuario solicita
 * recuperar su contraseña.
 */
const validateSendPasswordResetEmail = (o) =>
  sendPasswordResetEmailSchema.safeParse(o);


/*
 * =========================================================
 * EXPORTS
 * =========================================================
 */
module.exports = {
  validateCreateUserMedalLeage,
  validatePatchUserMedalLeage,
  validateCreateUserPackage,
  validateCreateUser,
  validateUpdateUser,

  // Preferencias del usuario.
  validateGetUserPreferences,
  validateUpdateUserPreferences,

  // Recuperación de contraseña.
  validateSendPasswordResetEmail
};