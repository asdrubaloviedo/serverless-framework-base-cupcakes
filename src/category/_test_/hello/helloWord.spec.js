const { hello } = require('@category/handlers/helloWord');

describe('helloWord handler', () => {
  test('retorna 200 y mensaje', async () => {
    const res = await hello();
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.message.startsWith('Hola mundo - ')).toBe(true);
  });
});
