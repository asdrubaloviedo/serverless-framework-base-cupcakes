# CupcakesLife — Backend Serverless

Backend de CupcakesLife desarrollado con Node.js, Serverless Framework y AWS Lambda.

## Tabla de contenidos

1. [Descripción](#descripción)
2. [Requisitos](#requisitos)
3. [Instalación](#instalación)
4. [Ambientes](#ambientes)
5. [Runtimes](#runtimes)
6. [Comandos](#comandos)
7. [Levantamiento](#levantamiento)
8. [Variables de entorno](#variables-de-entorno)
9. [Pruebas y CI](#pruebas-y-ci)
10. [Seguridad](#seguridad)
11. [Notas](#notas)
12. [Contenido](#contenido)
13. [Autores](#autores)

---

## Descripción

CupcakesLife utiliza una arquitectura serverless sobre AWS.

El backend incluye:

- API Gateway y AWS Lambda.
- PostgreSQL, con soporte para ejecución local y AWS RDS.
- Arquitectura modular por dominios: categorías, cupcakes, festividades, ingredientes, paquetes, recetas y usuarios.
- Integración con Firebase Admin.
- Amazon SES para el envío de correos electrónicos.
- Configuración diferenciada para los entornos `local`, `dev` y `prod`.
- Gestión de secretos mediante variables de entorno y AWS Systems Manager Parameter Store.
- Pruebas unitarias automatizadas con Jest y cobertura de código.
- Pruebas automatizadas de API con Playwright (97 casos validados contra `dev`).
- Dos workflows independientes de integración continua mediante GitHub Actions: Jest + Serverless y Playwright API Testing.

### Estado de los entornos

| Entorno | Estado |
|---|---|
| `local` | Serverless Offline inicia correctamente. La conexión a PostgreSQL local está pendiente de configuración. |
| `dev` | Backend desplegado y conexión a AWS validada. |
| `prod` | Configuración preparada; despliegue e infraestructura pendientes de validación completa. |

## Requisitos

- Node.js 20 para ejecución local.
- Node.js 22 para desarrollo y despliegue en AWS.
- npm compatible con la versión de Node.js utilizada.
- Serverless Framework 3.
- Git.
- AWS CLI y credenciales autorizadas para operaciones en AWS.
- PostgreSQL para pruebas de integración locales que requieran base de datos.

Para ejecutar Serverless Offline y pruebas que no dependan de PostgreSQL, no es obligatorio instalar una base de datos local.

## Instalación

Clonar el repositorio y situarse en su directorio.

Instalar las dependencias utilizando el archivo `package-lock.json`:

```bash
npm ci
```

Verificar la versión de Node.js:

```bash
node -v
npm -v
```

Validar que la versión sea compatible:

```bash
npm run check:node
```

Ejecutar las pruebas existentes:

```bash
npm test
```

No es necesario modificar `package.json` ni reinstalar dependencias globales para utilizar los scripts definidos en el proyecto.

## Ambientes

### Local

El entorno `local` utiliza Serverless Offline y Node.js 20.

La configuración de PostgreSQL se obtiene mediante variables de entorno:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<contraseña-local>
DB_NAME=cupcakes
PGSSLMODE=disable
```

Los valores anteriores son ilustrativos. Deben ajustarse a la instalación correspondiente y mantenerse fuera del repositorio.

Las variables se referencian desde `serverless.yml`, sin almacenar allí directamente las credenciales de conexión.

Firebase utiliza el archivo:

```text
config/firebase.local.yml
```

Este archivo contiene referencias a las variables:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Los valores reales deben estar disponibles como variables de entorno.

### Desarrollo (`dev`)

El entorno `dev` utiliza Node.js 22 y AWS.

La configuración de PostgreSQL se obtiene desde AWS Systems Manager Parameter Store mediante el prefijo:

```text
/cupcakes/dev/
```

Parámetros de base de datos:

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
PGSSLMODE
```

Firebase utiliza:

```text
config/firebase.dev.yml
```

Este archivo contiene referencias a los parámetros de AWS SSM correspondientes a Firebase.

### Producción (`prod`)

El entorno `prod` está configurado para Node.js 22.

La configuración de PostgreSQL utiliza el prefijo:

```text
/cupcakes/prod/
```

Firebase utiliza:

```text
config/firebase.prod.yml
```

La configuración de producción está separada de la de desarrollo, pero el despliegue y la infraestructura de producción todavía requieren validación.

El script `deploy:prod` se encuentra bloqueado intencionalmente.

## Runtimes

El runtime depende del entorno:

| Stage | Runtime |
|---|---|
| `local` | `nodejs20.x` |
| `dev` | `nodejs22.x` |
| `prod` | `nodejs22.x` |

El proyecto utiliza Node.js 20 para ejecutar Serverless Offline localmente, debido a la compatibilidad de la versión instalada de `serverless-offline`.

Los entornos AWS están configurados con Node.js 22.

### NVM for Windows y Git Bash

El proyecto contiene archivos `.nvmrc` y `.node-version`. Dependiendo de la configuración de NVM, la versión activa dentro del directorio puede ser diferente de la versión predeterminada.

Antes de iniciar el backend local, verificar:

```bash
node -v
```

Si aparece Node.js 24, seleccionar Node.js 20 mediante NVM.

En el entorno de desarrollo utilizado para este proyecto, puede priorizarse temporalmente la instalación de Node.js 20 en Git Bash ajustando `PATH` a la ruta de instalación correspondiente.

Esta modificación afecta únicamente a la sesión de terminal y no requiere cambiar los archivos de configuración del proyecto.

## Comandos

### Validación de Node.js

```bash
npm run check:node
npm run check:node:local
npm run check:node:dev
```

### Pruebas automatizadas

```bash
# Jest: pruebas unitarias
npm test

# Jest: cobertura
npm run test:coverage

# Jest: modo observación
npm run test:watch

# Playwright: API desplegada en AWS dev
npm run playwright:api:dev

# Playwright: API local (requiere backend local disponible y configuración adecuada)
npm run playwright:api:local

# Playwright: usa la configuración y el entorno predeterminado de Playwright
npm run playwright:api

# Abrir el último reporte HTML de Playwright
npm run playwright:api:report

# Ejecutar Jest con cobertura y luego Playwright API en dev
npm run general:tests
```

`general:tests` utiliza `&&`: Playwright solo se ejecuta si Jest termina correctamente. Las pruebas de API contra `dev` interactúan con el backend desplegado y pueden afectar datos de prueba según los casos implementados.

### Ejecución local

```bash
npm run start:local
```

El script `npm start` también ejecuta el arranque local.

### Despliegue en desarrollo

```bash
npm run deploy:dev
```

### Eliminación del despliegue de desarrollo

```bash
npm run remove:dev
```

### Configuración de Serverless

```bash
npm run print
npm run print:local
npm run print:dev
npm run print:prod
```

**Advertencia:** los comandos `print` pueden mostrar valores sensibles resueltos, incluidas credenciales. No compartir sus salidas completas ni almacenarlas en registros públicos.

### Dominios

```bash
npm run create-domain:dev
npm run delete-domain:dev
```

### Logs

```bash
npm run logs:cupcake
```

### Producción

El comando:

```bash
npm run deploy:prod
```

Está bloqueado intencionalmente y no debe habilitarse sin validar previamente la configuración y la infraestructura de producción.

## Levantamiento

### Ejecución local

1. Seleccionar Node.js 20.
2. Instalar dependencias con `npm ci`.
3. Configurar las variables locales de PostgreSQL, Firebase y las demás variables requeridas.
4. Cargar las variables en la terminal cuando corresponda.
5. Iniciar Serverless Offline.

En Git Bash, para un archivo `.env.local` compatible con sintaxis Bash:

```bash
set -a
source .env.local
set +a
```

Este procedimiento debe utilizarse únicamente con archivos confiables, porque `source` ejecuta su contenido como instrucciones de shell.

Iniciar el servidor:

```bash
npm run start:local
```

Cuando el arranque sea correcto, Serverless Offline mostrará las rutas disponibles y un mensaje similar a:

```text
Server ready: http://localhost:3000
```

Endpoint básico para verificar el servidor:

```http
GET http://localhost:3000/local/hello
```

El arranque correcto del servidor no garantiza que PostgreSQL esté disponible. Los endpoints que consulten la base de datos requieren una conexión válida.

### Ejecución en AWS `dev`

El entorno `dev` utiliza los recursos y parámetros configurados en AWS.

Para desplegar:

```bash
npm run deploy:dev
```

El despliegue requiere Node.js 22 y credenciales AWS con los permisos correspondientes.

Las rutas HTTP publicadas pueden probarse mediante REST Client, utilizando los archivos `.http` existentes en los módulos del proyecto.

### REST Client

El proyecto contiene archivos de solicitudes HTTP dentro de las carpetas `rest-client` de varios módulos, entre ellos:

```text
src/category/rest-client/category.http
src/cupcake/rest-client/cupcake.http
src/festivity/rest-client/festivity.http
src/ingredient/rest-client/ingredient.http
src/package/rest-client/package.http
src/recipe/rest-client/recipe.http
src/user/rest-client/user.http
```

Con la extensión REST Client de Visual Studio Code, las solicitudes pueden ejecutarse mediante la opción **Send Request**.

Estas pruebas son manuales y no sustituyen las pruebas automatizadas.

## Variables de entorno

### PostgreSQL

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
PGSSLMODE
```

### Firebase

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

### Correo electrónico

```text
SES_FROM_EMAIL
```

### Configuración de módulos

```text
ENDPOINT_ROOT
CATEGORY_MODULE
CUPCAKE_MODULE
FESTIVITY_MODULE
INGREDIENT_MODULE
PACKAGE_MODULE
RECIPE_MODULE
USER_MODULE
```

Las variables de módulos disponen de valores predeterminados en `serverless.yml`.

### Separación de credenciales

La configuración de Firebase está dividida en tres archivos:

```text
config/
├── firebase.local.yml
├── firebase.dev.yml
└── firebase.prod.yml
```

Serverless selecciona el archivo correspondiente al stage activo.

- `local`: utiliza variables de entorno.
- `dev`: utiliza AWS SSM.
- `prod`: utiliza AWS SSM.

La configuración de PostgreSQL local utiliza variables de entorno, mientras que los entornos AWS mantienen sus referencias a SSM.

Los archivos de configuración versionados deben contener referencias, nunca claves privadas ni contraseñas reales.

## Pruebas y CI

### Jest: pruebas unitarias

Jest ejecuta las pruebas unitarias del backend. Su configuración está en `jest.config.js` y excluye el directorio `playwright-api/` para evitar que Jest intente interpretar las pruebas de Playwright.

```bash
npm test
npm run test:coverage
npm run test:watch
```

El proyecto dispone de umbrales de cobertura definidos en `jest.config.js`. El workflow de CI ejecuta Jest con cobertura.

### Playwright: pruebas automatizadas de API

Se implementaron **97 pruebas automatizadas de API** con Playwright, validadas contra el backend desplegado en AWS `dev`. Las pruebas permiten comprobar respuestas HTTP, códigos de estado, estructuras JSON y comportamientos de los endpoints.

Archivos y carpetas principales:

```text
playwright-api/
playwright.config.js
.github/workflows/playwright-api.yml
```

Ejecutar contra AWS `dev`:

```bash
npm run playwright:api:dev
```

Ejecutar contra el entorno local:

```bash
npm run playwright:api:local
```

Para las pruebas locales, el backend debe estar iniciado y el entorno de Playwright debe apuntar a la URL local correcta. No se garantiza que todos los casos puedan ejecutarse sin configurar PostgreSQL y los servicios dependientes.

Ejecutar Playwright con la configuración predeterminada:

```bash
npm run playwright:api
```

Este último script **no establece `TEST_ENV`**: utiliza el valor predeterminado definido por la configuración de Playwright. Para elegir explícitamente el entorno, usar `playwright:api:dev` o `playwright:api:local`.

Abrir el reporte HTML generado por la ejecución más reciente:

```bash
npm run playwright:api:report
```

### Ejecutar todas las pruebas desde la terminal

```bash
npm run general:tests
```

Este script ejecuta primero `npm run test:coverage` y, si termina correctamente, continúa con `npm run playwright:api:dev`. No incluye un despliegue.

### GitHub Actions: integración continua

El repositorio tiene **dos workflows independientes**:

| Workflow | Archivo | Validaciones |
|---|---|---|
| CI – Serverless (Node + Jest) | `.github/workflows/ci.yml` | Dependencias, Node.js 22, Jest con cobertura, Serverless print y package para `local`. |
| CI – Playwright API Testing | `.github/workflows/playwright-api.yml` | Instalación de dependencias, pruebas Playwright API contra `dev` y publicación del reporte como artifact. |

Los workflows se ejecutan automáticamente ante cambios en las ramas y pull requests configurados en sus respectivos archivos YAML. El workflow de Serverless también admite ejecución manual mediante `workflow_dispatch`.

Ambos workflows finalizaron correctamente en GitHub Actions para el commit `10b5ca8` de `development`.

**Importante:** el workflow de Serverless valida la configuración y genera un paquete, pero **no despliega automáticamente** a AWS. La publicación de reportes de Playwright permite descargar evidencias de cada ejecución desde GitHub Actions.

El workflow de Serverless utiliza valores ficticios de entorno exclusivos para CI, necesarios para resolver la configuración local. Estos valores no son credenciales reales ni sustituyen los secretos de un entorno de despliegue.

### Recomendaciones de ejecución

- Durante el desarrollo, ejecutar Jest para validar cambios de lógica y Playwright para comprobar la API desplegada.
- Antes de integrar cambios importantes, utilizar `npm run general:tests` cuando el entorno `dev` esté disponible y los datos de prueba sean adecuados.
- Revisar los logs y artifacts de GitHub Actions cuando falle una ejecución.
- No ejecutar pruebas que modifiquen datos contra producción sin una estrategia específica de aislamiento y limpieza.

## Seguridad

Los archivos `.env` y sus variantes no deben incluirse en commits ni compartirse dentro de archivos ZIP.

El archivo `.gitignore` contempla exclusiones para archivos de entorno y claves privadas.

Antes de compartir el proyecto, excluir:

```text
.git/
node_modules/
.env
.env.*
.serverless/
coverage/
playwright-report/
test-results/
dist/
```

También deben excluirse certificados, claves privadas, archivos de cuentas de servicio y cualquier archivo con credenciales reales.

Eliminar un archivo sensible del seguimiento de Git no elimina automáticamente sus versiones anteriores del historial. Si alguna credencial estuvo expuesta, debe evaluarse su rotación.

No utilizar `serverless print` para generar evidencias públicas sin eliminar previamente los valores sensibles.

## Notas

- Serverless Framework está fijado en la versión 3.40.0.
- `serverless-offline` está fijado en la versión 13.6.0.
- No actualizar estas dependencias sin comprobar su compatibilidad.
- No ejecutar `npm audit fix --force` sin revisar previamente las consecuencias.
- El entorno `local` utiliza Node.js 20.
- Los entornos `dev` y `prod` utilizan Node.js 22.
- AWS `dev` es el entorno utilizado para las pruebas API automatizadas con Playwright.
- Los dos workflows de CI fueron validados correctamente en GitHub Actions para el commit `10b5ca8`.
- El despliegue de producción continúa pendiente de validación.
- No modificar la lógica de los endpoints existentes como parte de la configuración inicial de pruebas automatizadas.

## Contenido

Tecnologías principales:

Node.js, JavaScript, Serverless Framework, AWS Lambda, API Gateway, PostgreSQL, AWS RDS, AWS Systems Manager Parameter Store, Firebase Admin, Amazon SES, Jest, Playwright, GitHub Actions, Joi y Zod.

## Autores

Asdrúbal Oviedo
