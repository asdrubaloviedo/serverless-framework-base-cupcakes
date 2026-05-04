const z = require('zod');

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

const paisOptional = z.preprocess(
  (v) => (v == null || v === '' ? 'PER' : v),
  z.string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, 'User pais must be a 3-letter country code.')
    .transform((value) => value.toUpperCase())
);

const idRequired = (name) =>
  z.coerce.number({ required_error: `${name} is required.` })
    .int(`${name} must be an integer.`)
    .min(1, `${name} must be >= 1.`);

const currencyRequired = z.string({
  required_error: 'moneda is required.'
})
  .trim()
  .regex(/^[A-Za-z]{3}$/, 'moneda must be a 3-letter currency code (e.g. USD, EUR, PEN).')
  .transform((s) => s.toUpperCase());

const amountCentsRequired = z.coerce.number({
  required_error: 'montoCentavos is required.'
})
  .int('montoCentavos must be an integer.')
  .min(0, 'montoCentavos must be >= 0.');

const countryOptional = z.string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, 'paisCompra must be a 2-letter country code (e.g. US, PE, ES).')
  .transform((s) => s.toUpperCase())
  .optional();

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
    (d) => d.cupcake !== undefined || d.estado !== undefined || d.valor !== undefined,
    { message: 'At least one field to update is required.', path: ['update'] }
  );

const createUserPackageSchema = z.object({
  email: emailRequired,
  paquete: idRequired('paquete'),
  moneda: currencyRequired,
  montoCentavos: amountCentsRequired,
  paisCompra: countryOptional,
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
  nombre: nameRequired,
  email: emailRequired,
  pais: paisOptional.default('PER')
}).strict();

const validateCreateUserMedalLeage = (o) => createUserMedalSchema.safeParse(o);
const validatePatchUserMedalLeage = (o) => patchUserMedalSchema.safeParse(o);
const validateCreateUserPackage = (o) => createUserPackageSchema.safeParse(o);
const validateCreateUser = (o) => createUserSchema.safeParse(o);

module.exports = {
  validateCreateUserMedalLeage,
  validatePatchUserMedalLeage,
  validateCreateUserPackage,
  validateCreateUser
};