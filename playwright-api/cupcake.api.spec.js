
const { test, expect } = require('@playwright/test');
const { modules } = require('./config/environments');

const BASE = modules.cupcake;

const EMAIL_USUARIO =
  process.env.TEST_USER_EMAIL || 'asdrubaloviedo@gmail.com';

const EMAIL_INEXISTENTE = 'usuario-inexistente-qa@example.com';

// Usuario con paquetes para los escenarios que los requieren.
const EMAIL_USUARIO_PAQUETES =
  process.env.TEST_PACKAGES_USER_EMAIL || 'asdrubaloviedo2@gmail.com';

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function validarRespuestaJSON(response) {
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
}

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

function validarEstructuraNombreImagen(cupcakes) {
  expect(Array.isArray(cupcakes)).toBe(true);
  expect(cupcakes.length).toBeGreaterThan(0);

  for (const cupcake of cupcakes) {
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
}

async function consultarCupcakes(request, endpoint, params) {
  const options = params === undefined ? {} : { params };
  const response = await request.get(endpoint, options);

  validarRespuestaJSON(response);

  return response.json();
}

// ============================================================
// API - CUPCAKES
// ============================================================

test.describe('API - Cupcakes', () => {

  // ==========================================================
  // GET /test
  // ==========================================================

  test.describe('GET /test', () => {
    test('verifica el funcionamiento del módulo', async ({ request }) => {
      const body = await consultarCupcakes(request, `${BASE}/test`);
      expect(body).toBe('Test');
    });
  });

  // ==========================================================
  // GET /
  // ==========================================================

  test.describe('GET /', () => {
    test('consulta todos los registros', async ({ request }) => {
      const body = await consultarCupcakes(request, BASE);
      validarEstructuraCupcakes(body);
    });
  });

  // ==========================================================
  // GET /usuario
  // ==========================================================

  test.describe('GET /usuario', () => {
    const endpoint = `${BASE}/usuario`;

    test('consulta cupcakes disponibles para un usuario', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
      });

      validarEstructuraCupcakes(body);
    });

    test('consulta sin parámetro email', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      validarEstructuraCupcakes(body);
    });

    test('consulta con email vacío', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: '',
      });

      validarEstructuraCupcakes(body);
    });

    test('consulta con email inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
      });

      expect(body).toEqual([]);
    });
  });

  // ==========================================================
  // GET /busqueda
  // ==========================================================

  test.describe('GET /busqueda', () => {
    const endpoint = `${BASE}/busqueda`;

    test('búsqueda con todos los filtros', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        tiempo: 33,
        dificultad: 1,
        festividad: 1,
        predominante: 'rosado',
        secundario: 'azul',
      });

      validarEstructuraNombreImagen(body);
    });

    test('búsqueda sin filtros', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      validarEstructuraCupcakes(body);
    });

    test('búsqueda filtrada solo por tiempo', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        tiempo: 33,
      });

      validarEstructuraNombreImagen(body);
    });

    test.describe('Filtros individuales', () => {
      const filtrosIndividuales = [
        { nombre: 'dificultad', valor: 1 },
        { nombre: 'festividad', valor: 1 },
        { nombre: 'predominante', valor: 'rosado' },
        { nombre: 'secundario', valor: 'azul' },
      ];

      for (const filtro of filtrosIndividuales) {
        test(`búsqueda solo por ${filtro.nombre}`, async ({ request }) => {
          const body = await consultarCupcakes(request, endpoint, {
            [filtro.nombre]: filtro.valor,
          });

          expect(body).toEqual([]);
        });
      }
    });
  });

  // ==========================================================
  // GET /name-image
  // ==========================================================

  test.describe('GET /name-image', () => {
    test('consulta nombres e imágenes', async ({ request }) => {
      const body = await consultarCupcakes(
        request,
        `${BASE}/name-image`
      );

      validarEstructuraNombreImagen(body);
    });
  });

  // ==========================================================
  // GET /name-image-categoria
  // ==========================================================

  test.describe('GET /name-image-categoria', () => {
    const endpoint = `${BASE}/name-image-categoria`;

    test('consulta por categoría válida', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        categoria: 4,
      });

      validarEstructuraNombreImagen(body);
    });

    test('consulta sin categoría', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      validarEstructuraNombreImagen(body);
    });

    test('consulta con categoría inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        categoria: 9999,
      });

      expect(body).toEqual([]);
    });
  });

  // ==========================================================
  // GET /name-image-categoria/usuario
  // ==========================================================

  test.describe('GET /name-image-categoria/usuario', () => {
    const endpoint = `${BASE}/name-image-categoria/usuario`;

    test('consulta por categoría y usuario existentes', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
        categoria: 4,
      });

      validarEstructuraNombreImagen(body);
    });

    test('consulta por categoría con usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
        categoria: 4,
      });

      expect(body).toEqual([]);
    });

    test('consulta por categoría sin correo', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        categoria: 4,
      });

      validarEstructuraNombreImagen(body);
    });

    test('consulta por usuario sin categoría', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
      });

      validarEstructuraNombreImagen(body);
    });

    test('consulta sin parámetros', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      validarEstructuraNombreImagen(body);
    });
  });

  // ==========================================================
  // GET /name-image-estado
  // ==========================================================

  test.describe('GET /name-image-estado', () => {
    const endpoint = `${BASE}/name-image-estado`;

    test('consulta nombres e imágenes por estado', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
        estado: 3,
      });

      validarEstructuraNombreImagen(body);
    });

    test('consulta por estado con usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
        estado: 3,
      });

      expect(body).toEqual([]);
    });

    test('consulta por estado sin correo', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        estado: 3,
      });

      validarEstructuraNombreImagen(body);
    });

    test('consulta por usuario sin parámetro estado', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
      });

      validarEstructuraNombreImagen(body);
    });

    test('consulta sin parámetros', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      validarEstructuraNombreImagen(body);
    });
  });

  // ==========================================================
  // GET /name-image/usuario
  // ==========================================================

  test.describe('GET /name-image/usuario', () => {
    const endpoint = `${BASE}/name-image/usuario`;

    test('consulta nombres e imágenes por usuario', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
      });

      validarEstructuraNombreImagen(body);
    });

    test('consulta con usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
      });

      expect(body).toEqual([]);
    });

    test('consulta sin parámetros', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      validarEstructuraNombreImagen(body);
    });
  });

  // ==========================================================
  // GET /name-image-festividad
  // ==========================================================

  test.describe('GET /name-image-festividad', () => {
    const endpoint = `${BASE}/name-image-festividad`;

    test('consulta nombres e imágenes por festividad', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        festividad: 4,
      });

      validarEstructuraNombreImagen(body);
    });

    test('consulta con festividad inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        festividad: 9999,
      });

      expect(body).toEqual([]);
    });

    test('consulta sin festividad', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      validarEstructuraNombreImagen(body);
    });
  });

  // ==========================================================
  // GET /name-image-festividad/usuario
  // ==========================================================

  test.describe('GET /name-image-festividad/usuario', () => {
    const endpoint = `${BASE}/name-image-festividad/usuario`;

    test('usuario existente y festividad válida', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
        festividad: 4,
      });

      validarEstructuraNombreImagen(body);
    });

    test('solo festividad válida', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        festividad: 4,
      });

      validarEstructuraNombreImagen(body);
    });

    test('solo usuario existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
      });

      validarEstructuraNombreImagen(body);
    });

    test('sin parámetros', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      validarEstructuraNombreImagen(body);
    });

    test('usuario inexistente y festividad válida', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
        festividad: 4,
      });

      expect(body).toEqual([]);
    });

    test('usuario existente y festividad inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
        festividad: 9999,
      });

      expect(body).toEqual([]);
    });
  });

  // ==========================================================
  // GET /name-image-peliculas
  // ==========================================================

  test.describe('GET /name-image-peliculas', () => {
    const endpoint = `${BASE}/name-image-peliculas`;

    test('consulta cupcakes de películas sin usuario', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      validarEstructuraNombreImagen(body);
    });

    test('consulta cupcakes de películas con usuario existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
      });

      validarEstructuraNombreImagen(body);
    });

    test('consulta cupcakes de películas con usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
      });

      expect(body).toEqual([]);
    });
  });

  // ==========================================================
  // GET /name-image-info/publico/usuario
  // ==========================================================

  test.describe('GET /name-image-info/publico/usuario', () => {
    const endpoint = `${BASE}/name-image-info/publico/usuario`;

    function validarPaquetePublico(body) {
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);

      const paquete = body[0];

      expect(paquete).toEqual(
        expect.objectContaining({
          paquete: 'Publico',
          total_cupcakes: expect.any(Number),
          cupcakes: expect.any(Array),
        })
      );

      expect(paquete.total_cupcakes).toBeGreaterThan(0);
      expect(paquete.cupcakes.length).toBe(paquete.total_cupcakes);

      for (const cupcake of paquete.cupcakes) {
        expect(cupcake).toEqual(
          expect.objectContaining({
            cupcake_id: expect.any(Number),
            nombre: expect.any(String),
            codigo: expect.any(String),
            hecho: expect.any(Boolean),
            favorito: expect.any(Boolean),
            tiempo: expect.any(Number),
            porciones: expect.any(Number),
          })
        );

        expect(cupcake.cupcake_id).toBeGreaterThan(0);
        expect(cupcake.nombre.trim().length).toBeGreaterThan(0);
        expect(cupcake.codigo).toMatch(/^https?:\/\//);
        expect(cupcake.tiempo).toBeGreaterThanOrEqual(0);
        expect(cupcake.porciones).toBeGreaterThanOrEqual(0);
      }

      return paquete;
    }

    test('consulta paquete público de usuario existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO_PAQUETES,
      });

      // Los estados hecho y favorito pueden cambiar.
      // validarPaquetePublico comprueba sus tipos.
      validarPaquetePublico(body);
    });

    test('consulta paquete público con usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
      });

      const paquete = validarPaquetePublico(body);

      for (const cupcake of paquete.cupcakes) {
        expect(cupcake.hecho).toBe(false);
        expect(cupcake.favorito).toBe(false);
      }
    });

    test('consulta sin parámetro email', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      expect(body).toEqual([]);
    });
  });

  // ==========================================================
  // GET /name-image-info/usuario
  // ==========================================================

  test.describe('GET /name-image-info/usuario', () => {
    const endpoint = `${BASE}/name-image-info/usuario`;

    function validarEstructuraPackPersonal(body) {
      expect(body).toEqual(
        expect.objectContaining({
          paquete: 'Pack Personal',
          total_cupcakes: expect.any(Number),
          cupcakes: expect.any(Array),
        })
      );

      expect(body.total_cupcakes).toBeGreaterThanOrEqual(0);
      expect(body.cupcakes.length).toBe(body.total_cupcakes);

      for (const cupcake of body.cupcakes) {
        expect(cupcake).toEqual(
          expect.objectContaining({
            cupcake_id: expect.any(Number),
            nombre: expect.any(String),
            codigo: expect.any(String),
            hecho: expect.any(Boolean),
            tiempo: expect.any(Number),
            porciones: expect.any(Number),
          })
        );

        expect(cupcake.cupcake_id).toBeGreaterThan(0);
        expect(cupcake.nombre.trim().length).toBeGreaterThan(0);
        expect(cupcake.codigo).toMatch(/^https?:\/\//);
        expect(cupcake.tiempo).toBeGreaterThanOrEqual(0);
        expect(cupcake.porciones).toBeGreaterThanOrEqual(0);
      }
    }

    test('consulta Pack Personal de usuario existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO_PAQUETES,
      });

      validarEstructuraPackPersonal(body);
      expect(body.total_cupcakes).toBeGreaterThan(0);
    });

    test('consulta Pack Personal de usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
      });

      validarEstructuraPackPersonal(body);
      expect(body.total_cupcakes).toBe(0);
      expect(body.cupcakes).toEqual([]);
    });

    test('consulta sin parámetro email', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      expect(body).toEqual([]);
    });
  });

  // ==========================================================
  // GET /name-image-info/paquetes/usuario
  // ==========================================================

  test.describe('GET /name-image-info/paquetes/usuario', () => {
    const endpoint = `${BASE}/name-image-info/paquetes/usuario`;

    function validarEstructuraPaquetes(body) {
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      for (const paquete of body) {
        expect(paquete).toEqual(
          expect.objectContaining({
            paquete: expect.any(String),
            total_cupcakes: expect.any(Number),
            cupcakes: expect.any(Array),
          })
        );

        expect(paquete.paquete.trim().length).toBeGreaterThan(0);
        expect(paquete.total_cupcakes).toBeGreaterThanOrEqual(0);
        expect(paquete.cupcakes.length).toBe(paquete.total_cupcakes);

        for (const cupcake of paquete.cupcakes) {
          expect(cupcake).toEqual(
            expect.objectContaining({
              cupcake_id: expect.any(Number),
              nombre: expect.any(String),
              codigo: expect.any(String),
              hecho: expect.any(Boolean),
              favorito: expect.any(Boolean),
              tiempo: expect.any(Number),
              porciones: expect.any(Number),
            })
          );

          expect(cupcake.cupcake_id).toBeGreaterThan(0);
          expect(cupcake.nombre.trim().length).toBeGreaterThan(0);
          expect(cupcake.codigo).toMatch(/^https?:\/\//);
          expect(cupcake.tiempo).toBeGreaterThanOrEqual(0);
          expect(cupcake.porciones).toBeGreaterThanOrEqual(0);
        }
      }
    }

    test('consulta paquetes de usuario existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO_PAQUETES,
      });

      validarEstructuraPaquetes(body);
    });

    test('consulta paquetes de usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
      });

      expect(body).toEqual([]);
    });

    test('consulta paquetes sin parámetro email', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      expect(body).toEqual([]);
    });
  });

  // ==========================================================
  // GET /name-image-info/paquetes-faltantes/usuario
  // ==========================================================

  test.describe('GET /name-image-info/paquetes-faltantes/usuario', () => {
    const endpoint = `${BASE}/name-image-info/paquetes-faltantes/usuario`;

    function validarEstructuraPaquetesFaltantes(body) {
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      for (const paquete of body) {
        expect(paquete).toEqual(
          expect.objectContaining({
            paquete: expect.any(String),
            precio: expect.objectContaining({
              moneda: expect.any(String),
              monto_centavos: expect.any(Number),
              monto: expect.any(Number),
            }),
            total_cupcakes: expect.any(Number),
            cupcakes: expect.any(Array),
          })
        );

        expect(paquete.paquete.trim().length).toBeGreaterThan(0);
        expect(paquete.total_cupcakes).toBeGreaterThanOrEqual(0);
        expect(paquete.cupcakes.length).toBe(paquete.total_cupcakes);

        // Validación del precio
        expect(paquete.precio.moneda).toMatch(/^[A-Z]{3}$/);
        expect(Number.isInteger(paquete.precio.monto_centavos)).toBe(true);
        expect(paquete.precio.monto_centavos).toBeGreaterThanOrEqual(0);
        expect(paquete.precio.monto).toBeGreaterThanOrEqual(0);

        expect(
          Math.round(paquete.precio.monto * 100)
        ).toBe(paquete.precio.monto_centavos);

        // Validación de cupcakes
        for (const cupcake of paquete.cupcakes) {
          expect(cupcake).toEqual(
            expect.objectContaining({
              cupcake_id: expect.any(Number),
              nombre: expect.any(String),
              codigo: expect.any(String),
              hecho: expect.any(Boolean),
              favorito: expect.any(Boolean),
              tiempo: expect.any(Number),
              porciones: expect.any(Number),
            })
          );

          expect(cupcake.cupcake_id).toBeGreaterThan(0);
          expect(cupcake.nombre.trim().length).toBeGreaterThan(0);
          expect(cupcake.codigo).toMatch(/^https?:\/\//);
          expect(cupcake.tiempo).toBeGreaterThanOrEqual(0);
          expect(cupcake.porciones).toBeGreaterThanOrEqual(0);
        }
      }
    }

    test('consulta paquetes faltantes de usuario existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO_PAQUETES,
      });

      validarEstructuraPaquetesFaltantes(body);
    });

    test('consulta paquetes faltantes de usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
      });

      expect(body).toEqual([]);
    });

    test('consulta paquetes faltantes sin parámetro email', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);
      expect(body).toEqual([]);
    });
  });

  // ==========================================================
  // GET /cupcake
  // ==========================================================

  test.describe('GET /cupcake', () => {
    const endpoint = `${BASE}/cupcake`;

    test('consulta cupcake con ID existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        id: 1,
      });

      validarEstructuraCupcakes(body);
      expect(body).toHaveLength(1);
      expect(body[0].cupcake_id).toBe(1);
    });

    test('consulta cupcake con ID inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        id: 999999,
      });

      expect(body).toEqual({
        message: 'Cupcake not found',
      });
    });

    test('consulta cupcake sin parámetro ID', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);

      expect(body).toEqual({
        message: 'Cupcake not found',
      });
    });

    test('consulta cupcake con ID y usuario existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        id: 1,
        email: EMAIL_USUARIO,
      });

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);

      expect(body[0]).toEqual(
        expect.objectContaining({
          cupcake_id: 1,
          nombre: expect.any(String),
          codigo: expect.any(String),
          tiempo: expect.any(Number),
          porciones: expect.any(Number),
          hecho: expect.any(Boolean),
          favorito: expect.any(Boolean),
          disponible: expect.any(Boolean),
          paquete: expect.any(String),
        })
      );

      expect(body[0].codigo).toMatch(/^https?:\/\//);
      expect(body[0].paquete).toBe('Publico');
    });

    test('consulta cupcake con ID y usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        id: 1,
        email: EMAIL_INEXISTENTE,
      });

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);

      expect(body[0]).toEqual(
        expect.objectContaining({
          cupcake_id: 1,
          nombre: expect.any(String),
          codigo: expect.any(String),
          tiempo: expect.any(Number),
          porciones: expect.any(Number),
          hecho: false,
          favorito: false,
          disponible: true,
          paquete: 'Publico',
        })
      );
    });

    test('consulta cupcake inexistente con usuario', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        id: 999999,
        email: EMAIL_USUARIO,
      });

      expect(body).toEqual({
        message: 'Cupcake not found',
      });
    });

    test('consulta solo con email, sin ID', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
      });

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);

      expect(body[0]).toEqual({
        cupcake_id: expect.any(Number),
      });

      expect(body[0].cupcake_id).toBeGreaterThan(0);
    });
  });
  
  // ==========================================================
  // GET /busqueda/usuario
  // ==========================================================

  test.describe('GET /busqueda/usuario', () => {

    const endpoint = `${BASE}/busqueda/usuario`;

    const filtros = {
      tiempo: 33,
      dificultad: 1,
      festividad: 1,
      predominante: 'rosado',
      secundario: 'azul',
    };

    test('búsqueda con usuario existente y todos los filtros', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
        ...filtros,
      });

      validarEstructuraNombreImagen(body);
    });

    test('búsqueda con usuario inexistente y todos los filtros', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
        ...filtros,
      });

      expect(body).toEqual([]);
    });

    test('búsqueda sin email y con todos los filtros', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, filtros);

      expect(body).toEqual({
        message: 'Cupcake not found',
      });
    });

    test('búsqueda sin ningún parámetro', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);

      expect(body).toEqual({
        message: 'Cupcake not found',
      });
    });

  });
  
  // ==========================================================
  // GET /ramdom/usuario
  // ==========================================================

  test.describe('GET /ramdom/usuario', () => {

    const endpoint = `${BASE}/ramdom/usuario`;

    test('consulta cupcake aleatorio con usuario existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
      });

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);

      expect(body[0]).toEqual({
        cupcake_id: expect.any(Number),
      });

      expect(body[0].cupcake_id).toBeGreaterThan(0);
    });

    test('consulta cupcake aleatorio con usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
      });

      expect(body).toEqual([]);
    });

    test('consulta cupcake aleatorio sin parámetros', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);

      expect(body).toEqual({
        message: 'Cupcake not found',
      });
    });

  });
  
  // ==========================================================
  // GET /all-image
  // ==========================================================

  test.describe('GET /all-image', () => {

    const endpoint = `${BASE}/all-image`;

    test('consulta información e imagen de cupcake existente', async ({ request }) => {
      const id = 1;

      const body = await consultarCupcakes(request, endpoint, {
        id,
      });

      expect(Array.isArray(body)).toBe(true);
      expect(body).not.toHaveLength(0);

      for (const cupcake of body) {
        expect(cupcake).toEqual(
          expect.objectContaining({
            cupcake_id: id,
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
            imagen_id: expect.any(Number),
            codigo: expect.any(String),
          })
        );

        expect(cupcake.nombre.trim().length).toBeGreaterThan(0);
        expect(cupcake.porciones).toBeGreaterThanOrEqual(0);
        expect(cupcake.tiempo).toBeGreaterThanOrEqual(0);

        expect(cupcake.imagen_id).toBeGreaterThan(0);
        expect(cupcake.codigo).toMatch(/^https?:\/\//);
      }
    });

    test('consulta información e imagen de cupcake inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        id: 999999,
      });

      expect(body).toEqual({
        message: 'Info and image not found',
      });
    });

    test('consulta información e imagen sin parámetro ID', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);

      expect(body).toEqual({
        message: 'Info and image not found',
      });
    });

  });
  
  // ==========================================================
  // GET /estados
  // ==========================================================

  test.describe('GET /estados', () => {

    const endpoint = `${BASE}/estados`;

    test('consulta estados de cupcake y usuario existentes', async ({ request }) => {
      const id = 1;

      const body = await consultarCupcakes(request, endpoint, {
        id,
        email: EMAIL_USUARIO,
      });

      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      for (const estado of body) {
        expect(estado).toEqual(
          expect.objectContaining({
            usuario_id: expect.any(Number),
            cupcake_id: id,
            estado_id: expect.any(Number),
            valor: expect.any(Boolean),
          })
        );

        expect(estado.usuario_id).toBeGreaterThan(0);
        expect(estado.estado_id).toBeGreaterThan(0);
      }

      // Los valores true/false pueden cambiar según el usuario.
      // No fijamos estados concretos.
    });

    test('consulta estados con usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        id: 1,
        email: EMAIL_INEXISTENTE,
      });

      expect(body).toEqual({
        message: 'Cupcake user states were not found',
      });
    });

    test('consulta estados con cupcake inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        id: 999999,
        email: EMAIL_USUARIO,
      });

      expect(body).toEqual({
        message: 'Cupcake user states were not found',
      });
    });

    test('consulta estadísticas del usuario sin ID', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
      });

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);

      const estadisticas = body[0];

      const campos = [
        'hechos_count',
        'dificiles_count',
        'festivos_count',
        'pelicula_count',
        'porciones_sum',
        'tiempo_sum',
      ];

      for (const campo of campos) {
        expect(estadisticas).toHaveProperty(campo);
        expect(estadisticas[campo]).toEqual(expect.any(String));
        expect(estadisticas[campo]).toMatch(/^\d+$/);
      }
    });

    // ========================================================
    // Comportamiento actual del backend: HTTP 500 sin email
    // Estos casos documentan un defecto conocido.
    // ========================================================

    test('consulta solo con ID, sin email - defecto conocido', async ({ request }) => {
      const response = await request.get(endpoint, {
        params: {
          id: 1,
        },
      });

      expect(response.status()).toBe(500);
      expect(response.headers()['content-type']).toContain('application/json');

      const body = await response.json();

      expect(body).toEqual({
        message: "Cannot read properties of undefined (reading 'toLowerCase')",
      });
    });

    test('consulta sin parámetros - defecto conocido', async ({ request }) => {
      const response = await request.get(endpoint);

      expect(response.status()).toBe(500);
      expect(response.headers()['content-type']).toContain('application/json');

      const body = await response.json();

      expect(body).toEqual({
        message: "Cannot read properties of undefined (reading 'toLowerCase')",
      });
    });

  });
  
  // ==========================================================
  // GET /logros
  // ==========================================================

  test.describe('GET /logros', () => {

    const endpoint = `${BASE}/logros`;

    function validarEstructuraLogros(body) {
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);

      const logros = body[0];

      const contadores = [
        'hechos_count',
        'dificiles_count',
        'festivos_count',
        'pelicula_count',
      ];

      for (const campo of contadores) {
        expect(logros).toHaveProperty(campo);
        expect(logros[campo]).toEqual(expect.any(String));
        expect(logros[campo]).toMatch(/^\d+$/);
      }

      const sumas = [
        'porciones_sum',
        'tiempo_sum',
      ];

      for (const campo of sumas) {
        expect(logros).toHaveProperty(campo);

        if (logros[campo] !== null) {
          expect(logros[campo]).toEqual(expect.any(String));
          expect(logros[campo]).toMatch(/^\d+$/);
        }
      }

      return logros;
    }

    test('consulta logros de usuario existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
      });

      validarEstructuraLogros(body);
    });

    test('consulta logros de usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
      });

      const logros = validarEstructuraLogros(body);

      expect(logros).toEqual({
        hechos_count: '0',
        dificiles_count: '0',
        festivos_count: '0',
        pelicula_count: '0',
        porciones_sum: null,
        tiempo_sum: null,
      });
    });

    // Comportamiento actual del backend: error 500 sin email.
    // Defecto conocido pendiente de corrección.

    test('consulta logros sin email - defecto conocido', async ({ request }) => {
      const response = await request.get(endpoint);

      expect(response.status()).toBe(500);
      expect(response.headers()['content-type']).toContain('application/json');

      const body = await response.json();

      expect(body).toEqual({
        message: "Cannot read properties of undefined (reading 'toLowerCase')",
      });
    });

  });
  
  // ==========================================================
  // GET /ramdom
  // ==========================================================

  test.describe('GET /ramdom', () => {

    const endpoint = `${BASE}/ramdom`;

    test('consulta un cupcake aleatorio', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint);

      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);

      expect(body[0]).toEqual({
        cupcake_id: expect.any(Number),
      });

      expect(body[0].cupcake_id).toBeGreaterThan(0);
    });

  });
  
  // ==========================================================
  // GET /name-image-filtros
  // ==========================================================

  test.describe('GET /name-image-filtros', () => {

    const endpoint = `${BASE}/name-image-filtros`;

    test('consulta cupcakes con todos los filtros', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        tiempo: 150,
        dificultad: 'todas',
        festividad: 'todas',
        colorpredominante: 'todos',
        colorsecundario: 'todos',
      });

      validarEstructuraNombreImagen(body);
    });

    // Defecto conocido: el backend devuelve HTTP 500
    // cuando se consulta sin parámetros.

    test('consulta sin parámetros - defecto conocido', async ({ request }) => {
      const response = await request.get(endpoint);

      expect(response.status()).toBe(500);
      expect(response.headers()['content-type']).toContain('application/json');

      const body = await response.json();

      expect(body).toEqual({
        message: "Cannot read properties of undefined (reading 'toLowerCase')",
      });
    });

  });
  
  // ==========================================================
  // GET /collections
  // ==========================================================

  test.describe('GET /collections', () => {

    const endpoint = `${BASE}/collections`;

    test('consulta colecciones de usuario existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
      });

      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      for (const collection of body) {
        expect(collection).toEqual(
          expect.objectContaining({
            collection_id: expect.any(Number),
            nombre: expect.any(String),
            total_recetas: expect.any(Number),
            seleccionada: expect.any(Boolean),
          })
        );

        expect(collection).toHaveProperty('imagen');

        expect(collection.collection_id).toBeGreaterThan(0);
        expect(collection.nombre.trim().length).toBeGreaterThan(0);
        expect(collection.total_recetas).toBeGreaterThanOrEqual(0);

        if (collection.imagen !== null) {
          expect(collection.imagen).toEqual(expect.any(String));
          expect(collection.imagen).toMatch(/^https?:\/\//);
        }
      }
    });

    test('consulta colecciones de usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
      });

      expect(body).toEqual([]);
    });

    // Defecto conocido: el backend devuelve HTTP 500
    // cuando falta el email, aunque devuelve un mensaje
    // de validación controlado.

    test('consulta colecciones sin email - defecto conocido', async ({ request }) => {
      const response = await request.get(endpoint);

      expect(response.status()).toBe(500);
      expect(response.headers()['content-type']).toContain('application/json');

      const body = await response.json();

      expect(body).toEqual({
        message: 'El email es requerido',
      });
    });
    
    test('consulta colecciones con cupcake existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
        cupcake: 1,
      });

      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      for (const collection of body) {
        expect(collection).toEqual(
          expect.objectContaining({
            collection_id: expect.any(Number),
            nombre: expect.any(String),
            total_recetas: expect.any(Number),
            seleccionada: expect.any(Boolean),
          })
        );

        expect(collection).toHaveProperty('imagen');
        expect(collection.collection_id).toBeGreaterThan(0);
        expect(collection.total_recetas).toBeGreaterThanOrEqual(0);

        if (collection.imagen !== null) {
          expect(collection.imagen).toEqual(expect.any(String));
          expect(collection.imagen).toMatch(/^https?:\/\//);
        }
      }
    });

    test('consulta colecciones con cupcake inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
        cupcake: 999999,
      });

      expect(Array.isArray(body)).toBe(true);

      for (const collection of body) {
        expect(collection).toEqual(
          expect.objectContaining({
            collection_id: expect.any(Number),
            nombre: expect.any(String),
            total_recetas: expect.any(Number),
            seleccionada: false,
          })
        );
      }
    });

    test('consulta colecciones con cupcake pero sin email - defecto conocido', async ({ request }) => {
      const response = await request.get(endpoint, {
        params: {
          cupcake: 1,
        },
      });

      expect(response.status()).toBe(500);
      expect(response.headers()['content-type']).toContain('application/json');

      const body = await response.json();

      expect(body).toEqual({
        message: 'El email es requerido',
      });
    });
  });
  
  // ==========================================================
  // GET /collections/cupcakes
  // ==========================================================

  test.describe('GET /collections/cupcakes', () => {

    const endpoint = `${BASE}/collections/cupcakes`;

    test('consulta cupcakes de una colección existente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
        collection: 1,
      });

      validarEstructuraNombreImagen(body);
    });

    test('consulta cupcakes de una colección inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_USUARIO,
        collection: 999999,
      });

      expect(body).toEqual([]);
    });

    test('consulta cupcakes de una colección con usuario inexistente', async ({ request }) => {
      const body = await consultarCupcakes(request, endpoint, {
        email: EMAIL_INEXISTENTE,
        collection: 1,
      });

      expect(body).toEqual([]);
    });

    // Defecto conocido: HTTP 500 cuando falta el email.

    test('consulta cupcakes de una colección sin email - defecto conocido', async ({ request }) => {
      const response = await request.get(endpoint, {
        params: {
          collection: 1,
        },
      });

      expect(response.status()).toBe(500);
      expect(response.headers()['content-type']).toContain('application/json');

      const body = await response.json();

      expect(body).toEqual({
        message: 'El email es requerido',
      });
    });

  });

});
