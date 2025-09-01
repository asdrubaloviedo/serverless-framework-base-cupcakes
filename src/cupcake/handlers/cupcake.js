require('module-alias/register');
const CupcakeController = require('@cupcake/controller/cupcake');

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

  // 3) módulo cupcakes (ej: /cupcakes)
  const mod = ensureSlash(process.env.CUPCAKE_MODULE || 'cupcakes');
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

const routes = {
  'GET /test':                          (e) => CupcakeController.doTest(null),
  'GET /':                              (e) => CupcakeController.getAll(qs(e)),
  'GET /usuario':                       (e) => CupcakeController.getAll(qs(e)),
  'GET /busqueda':                      (e) => CupcakeController.getAll(qs(e)),
  'GET /name-image':                    (e) => CupcakeController.getAllNameImage(qs(e)),
  'GET /name-image-categoria':          (e) => CupcakeController.getAllNameImage(qs(e)),
  'GET /name-image-categoria/usuario':  (e) => CupcakeController.getAllNameImage(qs(e)),
  'GET /name-image-estado':             (e) => CupcakeController.getAllNameImage(qs(e)),
  'GET /name-image/usuario':            (e) => CupcakeController.getAllNameImage(qs(e)),
  'GET /name-image-festividad':         (e) => CupcakeController.getAllNameImage(qs(e)),
  'GET /name-image-festividad/usuario': (e) => CupcakeController.getAllNameImage(qs(e)),
  'GET /name-image-peliculas':          (e) => CupcakeController.getAllNameImageMovies(qs(e)),
  'GET /name-image-peliculas/usuario':  (e) => CupcakeController.getAllNameImageMovies(qs(e)),
  'GET /cupcake':                       (e) => CupcakeController.getById(qs(e)),
  'GET /busqueda/usuario':              (e) => CupcakeController.getById(qs(e)),
  'GET /ramdom/usuario':                (e) => CupcakeController.getById(qs(e)),
  'GET /all-image':                     (e) => CupcakeController.getByIdInfoImage(qs(e)),
  'GET /estados':                       (e) => CupcakeController.getByIdCupcakeUserState(qs(e)),
  'GET /logros':                        (e) => CupcakeController.getByIdCupcakeUserState(qs(e)),
  'POST /insertar-cupcake-estados':     (e) => CupcakeController.createOneCupcakeUserState(json(e)),
  'PATCH /actualizar-cupcake-estados':  (e) => CupcakeController.patchOneCupcakeUserState(json(e)),
  'GET /ramdom':                        (e) => CupcakeController.getAllRamdom(qs(e)),
  'GET /name-image-filtros':            (e) => CupcakeController.getAllNameImageFiltros(qs(e)),
};

const handler = withHandler(async (event) => {
  const key = `${methodOf(event)} ${normalize(event)}`;
  const fn = routes[key];
  if (!fn) return ok({ message: 'Not Found', pathTried: key }, 404);
  return fn(event);
});

module.exports = { handler };
