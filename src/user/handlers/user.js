require('module-alias/register');
const UserController = require('@user/controller/user');
const {
  validateCreateUserMedalLeage,
  validatePatchUserMedalLeage,
  validateCreateUserPackage,
  validateCreateUser
} = require('@user/schema/user');

const ok = (body, code = 200) => ({ statusCode: code, body: JSON.stringify(body) });
const fail = (err) => {
  const code = Number(err?.statusCode) || 500;
  return { statusCode: code, body: JSON.stringify({ message: err?.message || 'Error interno del servidor' }) };
};
const withHandler = (fn) => async (event) => { try { return ok(await fn(event)); } catch (e) { console.error(e); return fail(e); } };
const methodOf = (e) => (e.httpMethod || e.requestContext?.http?.method || 'GET').toUpperCase();

const ensureSlash = (s) => (s ? (s.startsWith('/') ? s : `/${s}`) : '');
const strip = (p, pref) => {
  if (!pref) return p;
  if (p === pref) return '/';
  if (p.startsWith(pref + '/')) return p.slice(pref.length);
  return p;
};

const normalize = (event) => {
  let p = event.rawPath || event.path || '/';

  // 1) stage por ambiente
  const stage = event.requestContext?.stage ? `/${event.requestContext.stage}` : '';
  p = strip(p, stage);

  // 2) endpoint root (ej: /cupcakeslife)
  const root = ensureSlash(process.env.ENDPOINT_ROOT);
  p = strip(p, root);

  // 3) módulo usuarios (ej: /usuarios)
  const mod = ensureSlash(process.env.USER_MODULE || 'usuarios');
  p = strip(p, mod);

  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
};

const qs = (e) => e.queryStringParameters || {};

const json = (e) => {
  if (!e?.body) return {};
  try { return typeof e.body === 'string' ? JSON.parse(e.body) : e.body; }
  catch { throw { statusCode: 400, message: 'JSON inválido' }; }
};

// helper para el uso de validaciones con ZOD
const validBody = (e, validator) => {
  const data = json(e);
  const res = validator(data);
  if (!res.success) {
    const i = res.error.issues?.[0];
    const field = i?.path?.join('.');
    // Uniforma mensajes "undefined"
    const msg = (i?.code === 'invalid_type' && i?.received === 'undefined')
      ? (field === 'email' ? 'User email is required.' : 'Field is required.')
      : (i?.message || 'Parámetros inválidos');
    throw { statusCode: 400, message: msg, field };
  }
  return res.data; // datos saneados
};

const routes = {
  'POST /insertar-usuario-medalla':     (e) => UserController.createOneUserMedalLeage(validBody(e, validateCreateUserMedalLeage)),
  'PATCH /actualizar-usuario-medalla':  (e) => UserController.patchOneUserMedalLeage(validBody(e, validatePatchUserMedalLeage)),
  'POST /insertar-usuario-paquete':     (e) => UserController.createOneUserPackage(validBody(e, validateCreateUserPackage)),
  'POST /insertar-usuario-nuevo':       (e) => UserController.createOneUser(validBody(e, validateCreateUser)),
};

const handler = withHandler(async (event) => {
  const key = `${methodOf(event)} ${normalize(event)}`;
  const fn = routes[key];
  if (!fn) return ok({ message: 'Not Found', pathTried: key }, 404);
  return fn(event);
});

module.exports = { handler };
