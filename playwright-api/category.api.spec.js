
const { test, expect } = require('@playwright/test');
const { modules } = require('./config/environments');

function validarEstructuraCategorias(categorias) {
  expect(Array.isArray(categorias)).toBe(true);

  for (const categoria of categorias) {
    expect(categoria).toEqual(
      expect.objectContaining({
        categoria_id: expect.any(Number),
        descripcion: expect.any(String),
        codigo: expect.any(String),
        count_items: expect.any(String),
      })
    );

    expect(categoria.categoria_id).toBeGreaterThan(0);
    expect(categoria.descripcion.trim().length).toBeGreaterThan(0);
    expect(categoria.codigo).toMatch(/^https?:\/\//);
    expect(categoria.count_items).toMatch(/^\d+$/);
  }
}

test.describe('API - Categorías', () => {
  test('GET categorías - responde correctamente', async ({ request }) => {
    const response = await request.get(
      `${modules.category}/categorias-imagen-cantidad`
    );

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();

    validarEstructuraCategorias(body);
  });

  test('GET categorías disponibles para un usuario', async ({ request }) => {
    const response = await request.get(
      `${modules.category}/categorias-imagen-cantidad/usuario`,
      {
        params: {
          email: process.env.TEST_USER_EMAIL || 'asdrubaloviedo@gmail.com',
        },
      }
    );

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();

    validarEstructuraCategorias(body);
  });

  
    test('GET categorías disponibles para un usuario sin email', async ({ request }) => {
        const response = await request.get(
            `${modules.category}/categorias-imagen-cantidad/usuario`
        );

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');

        const body = await response.json();

        validarEstructuraCategorias(body);
    });
    
    test('GET categorías para un usuario inexistente', async ({ request }) => {
        const response = await request.get(
            `${modules.category}/categorias-imagen-cantidad/usuario`,
            {
            params: {
                email: 'usuario-inexistente-qa@example.com',
            },
            }
        );

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');

        const body = await response.json();

        expect(body).toEqual([]);
    });
});
