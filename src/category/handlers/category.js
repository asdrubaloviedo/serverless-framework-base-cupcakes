require('module-alias/register');
const CategoryController = require('@category/controller/category');

const ok = (body, code = 200) => ({ statusCode: code, body: JSON.stringify(body) });
const fail = (err) => ({ statusCode: 500, body: JSON.stringify({ message: 'Error interno del servidor', error: err?.message || String(err) }) });

const withHandler = (fn) => async (event) => {
  try { return ok(await fn(event)); }
  catch (e) { console.error(e); return fail(e); }
};

const handler = withHandler(async (event) => {
  const email = event.queryStringParameters?.email || null;
  const result = await CategoryController.getAllNameImageCount(email);

  return {
    email, result
  };
});

module.exports = {
  handler
};

