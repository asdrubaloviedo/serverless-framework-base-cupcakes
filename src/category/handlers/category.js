// src/category/handlers/category.handler.js
require('module-alias/register');
const CategoryController = require('@category/controller/category');

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

  // 3) módulo categorías (ej: /categorias)
  const mod = ensureSlash(process.env.CATEGORY_MODULE || 'categorias');
  p = strip(p, mod);

  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
};

const routes = {
  'GET /categorias-imagen-cantidad': () => CategoryController.getAllNameImageCount(),
  'GET /categorias-imagen-cantidad/usuario': (e) => {
    const email = e.queryStringParameters?.email;
    if (!email) throw { statusCode: 400, message: 'email requerido' };
    return CategoryController.getAllNameImageCount(email);
  },
};

const handler = withHandler(async (event) => {
  const key = `${methodOf(event)} ${normalize(event)}`;
  const fn = routes[key];
  if (!fn) return ok({ message: 'Not Found', pathTried: key }, 404);
  return fn(event);
});

module.exports = { handler };
