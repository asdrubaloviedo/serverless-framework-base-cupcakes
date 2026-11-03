
const { test, expect } = require('@playwright/test');
const { modules } = require('./config/environments');

function validarEstructuraCupcakes(cupcakes) {
  expect(Array.isArray(cupcakes)).toBe(true);
  expect(cupcakes.length).toBeGreaterThan(0);

  for (const cupcake of cupcakes) {
    expect(cupcake).toEqual(
      expect.objectContaining({
        cupcake_id: expect.any(Number),
        nombre: expect.any(String),
        colorpredominante: expect.any(String),
        colorsecundario: expect.any(String),
        porciones: expect.any(Number),
        tiempo: expect.any(Number),
        pelicula: expect.any(Boolean),
        festividad_id: expect.any(Number),
        dificultad_id: expect.any(Number),
        cupcake_acceso_id: expect.any(Number),
        paquete_id: expect.any(Number),
      })
    );
  }
}

test.describe('API - Cupcakes', () => {
  test('GET test - verifica el funcionamiento del módulo', async ({ request }) => {
    const response = await request.get(
      `${modules.cupcake}/test`
    );

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();

    expect(body).toBe('Test');
  });

  test('GET cupcakes - consulta todos los registros', async ({ request }) => {
    const response = await request.get(
      modules.cupcake
    );

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();

    validarEstructuraCupcakes(body);
  });

  test('GET cupcakes disponibles para un usuario', async ({ request }) => {
    const response = await request.get(
      `${modules.cupcake}/usuario`,
      {
        params: {
          email: process.env.TEST_USER_EMAIL || 'asdrubaloviedo@gmail.com',
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();

    validarEstructuraCupcakes(body);
  });
  
    test('GET cupcakes - búsqueda con filtros', async ({ request }) => {
        const response = await request.get(
            `${modules.cupcake}/busqueda`,
            {
            params: {
                tiempo: 33,
                dificultad: 1,
                festividad: 1,
                predominante: 'rosado',
                secundario: 'azul',
            },
            }
        );

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');

        const body = await response.json();

        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);

        for (const cupcake of body) {
            expect(cupcake).toEqual(
            expect.objectContaining({
                cupcake_id: expect.any(Number),
                nombre: expect.any(String),
                codigo: expect.any(String),
            })
            );

            expect(cupcake.cupcake_id).toBeGreaterThan(0);
            expect(cupcake.nombre.trim().length).toBeGreaterThan(0);
            expect(cupcake.codigo).toMatch(/^https?:\/\//);
        }
    });

});
