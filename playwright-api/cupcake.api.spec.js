
const { test, expect } = require('@playwright/test');
const { modules } = require('./config/environments');

const BASE = modules.cupcake;

const EMAIL_USUARIO =
  process.env.TEST_USER_EMAIL || 'asdrubaloviedo@gmail.com';

const EMAIL_INEXISTENTE = 'usuario-inexistente-qa@example.com';

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
      const body = await consultarCupcakes(
        request,
        `${BASE}/test`
      );

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
        email: 'asdrubaloviedo2@gmail.com',
      });

      const paquete = validarPaquetePublico(body);

      expect(paquete.cupcakes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            cupcake_id: 1,
            hecho: true,
            favorito: false,
          }),
        ])
      );
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
        email: 'asdrubaloviedo2@gmail.com',
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
        email: 'asdrubaloviedo2@gmail.com',
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

        // Validación de los cupcakes del paquete
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
        email: 'asdrubaloviedo2@gmail.com',
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

});
