// src/user/schema/user.js
const z = require('zod');

// --------------------------------------
// Helpers comunes
// --------------------------------------

// Email: trata undefined/null como vacío para forzar "required"
const emailRequired = z.preprocess(
  (v) => (v == null ? '' : v),
  z.string({
    required_error: 'User email is required.',
    invalid_type_error: 'User email must be a string'
  })
    .trim()
    .min(1, 'User email is required.')
    .email('User email is invalid.')
);

// Ids numéricos comunes
const idRequired = (name) =>
  z.coerce.number({ required_error: `${name} is required.` })
    .int(`${name} must be an integer.`)
    .min(1, `${name} must be >= 1.`);

// Moneda: código ISO 4217, 3 letras (USD, EUR, PEN, etc.)
const currencyRequired = z.string({
  required_error: 'moneda is required.'
})
  .trim()
  .regex(/^[A-Za-z]{3}$/, 'moneda must be a 3-letter currency code (e.g. USD, EUR, PEN).')
  .transform((s) => s.toUpperCase());

// Monto en centavos/céntimos
const amountCentsRequired = z.coerce.number({
  required_error: 'montoCentavos is required.'
})
  .int('montoCentavos must be an integer.')
  .min(0, 'montoCentavos must be >= 0.');

// País de compra: código ISO 3166-1 alpha-2 (US, PE, ES...). Opcional.
const countryOptional = z.string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, 'paisCompra must be a 2-letter country code (e.g. US, PE, ES).')
  .transform((s) => s.toUpperCase())
  .optional();

// --------------------------------------
// Schemas por endpoint
// --------------------------------------

const createUserMedalSchema = z.object({
  email: emailRequired,
  medalla: idRequired('medalla')
});

const patchUserMedalSchema = z.object({
  email: emailRequired,
  cupcake: idRequired('cupcake').optional(),
  estado:  idRequired('estado').optional(),
  valor:   z.coerce.boolean().optional()
})
.refine(
  (d) => d.cupcake !== undefined || d.estado !== undefined || d.valor !== undefined,
  { message: 'At least one field to update is required.', path: ['update'] }
);

// Adaptado para registrar la compra de paquete con los nuevos campos
const createUserPackageSchema = z.object({
  email: emailRequired,
  paquete: idRequired('paquete'),

  // Nuevos campos para usuario_paquetes
  moneda: currencyRequired,              // NOT NULL en la tabla
  montoCentavos: amountCentsRequired,    // NOT NULL en la tabla

  paisCompra: countryOptional,           // NULL permitido en la tabla

  paymentProvider: z.string()
    .trim()
    .min(1, 'paymentProvider cannot be empty.')
    .max(30, 'paymentProvider must be at most 30 characters.')
    .optional(),

  paymentProviderId: z.string()
    .trim()
    .min(1, 'paymentProviderId cannot be empty.')
    .max(100, 'paymentProviderId must be at most 100 characters.')
    .optional()
});

const createUserSchema = z.object({
  email: emailRequired
});

// --------------------------------------
// Export de validadores (safeParse)
// --------------------------------------

const validateCreateUserMedalLeage  = (o) => createUserMedalSchema.safeParse(o);
const validatePatchUserMedalLeage   = (o) => patchUserMedalSchema.safeParse(o);
const validateCreateUserPackage     = (o) => createUserPackageSchema.safeParse(o);
const validateCreateUser            = (o) => createUserSchema.safeParse(o);

module.exports = {
  validateCreateUserMedalLeage,
  validatePatchUserMedalLeage,
  validateCreateUserPackage,
  validateCreateUser
};
