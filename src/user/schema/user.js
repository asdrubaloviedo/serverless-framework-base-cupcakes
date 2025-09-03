// src/user/schema/user.js
const z = require('zod');

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

// -------- Schemas por endpoint --------
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

const createUserPackageSchema = z.object({
  email: emailRequired,
  paquete: idRequired('paquete')
});

const createUserSchema = z.object({
  email: emailRequired
});

// -------- Export de validadores (safeParse) --------
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
