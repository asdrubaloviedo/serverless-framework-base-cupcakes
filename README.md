[![CI](https://github.com/<TU_ORG>/<TU_REPO>/actions/workflows/ci.yml/badge.svg?branch=development)](https://github.com/<TU_ORG>/<TU_REPO>/actions/workflows/ci.yml)

## Tabla de Contenidos

1. [Descripción](#descripción)
2. [Requisitos](#requisitos)
3. [Instalación](#instalación)
4. [Ambientes](#ambientes)
5. [Runtimes](#runtimes)
6. [Comandos](#comandos)
7. [Levantamiento](#levantamiento)
8. [Variables](#variables)
9. [Notas](#notas)
10. [Contenido](#contenido)
11. [Autores](#autores)

---

## Descripción

Backend serverless de CupcakesLife construido con Serverless Framework sobre AWS Lambda.

Incluye:
    - API Gateway + Lambda
    - Conexión a PostgreSQL (local y RDS)
    - Arquitectura modular por dominios (categorías, cupcakes, ingredientes, etc.)
    - Soporte de múltiples ambientes (local, dev, prod), todo lo referente a prod aun esta por probarse.
    - Runtime moderno (nodejs22.x) en AWS
    - Despliegues reproducibles
    - Separación de secretos por ambiente usando AWS Systems Manager Parameter Store para `dev` y `prod`

Estado actual del proyecto:
    - `local`: validado
    - `dev`: validado y funcionando con SSM
    - `prod`: preparado a nivel de configuración, pendiente de pruebas reales de infraestructura y despliegue

---

## Requisitos

- Node local: 22.22.0
- npm compatible con Node 22
- Serverless Framework v3
- AWS CLI configurado
- Credenciales de AWS activas

---

## Instalación

Instalamos dependencias con el metodo antiguo de node
    - npm install --legacy-peer-deps

Luego validamos la version de node
    - npm run check:node

Si bien actualmente se usa este comando, lo ideal es que al final se haga una revision para poder instalar todo con un simple
    - npm install

---

## Ambientes

El proyecto usa configuración separada por stage.

- Local usa valores definidos dentro de serverless.yml:
    DB_HOST=127.0.0.1
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=postgres
    DB_NAME=cupcakes
    PGSSLMODE=disable
- Dev obtiene secretos desde AWS Systems Manager Parameter Store usando este prefijo:
    /cupcakes/dev/
    Parámetros esperados:
        /cupcakes/dev/DB_HOST
        /cupcakes/dev/DB_PORT
        /cupcakes/dev/DB_USER
        /cupcakes/dev/DB_PASSWORD
        /cupcakes/dev/DB_NAME
        /cupcakes/dev/PGSSLMODE
    Además, el ambiente usa variables complementarias como:
        ENDPOINT_ROOT=cupcakeslife
        CATEGORY_MODULE=categorias
        CUPCAKE_MODULE=cupcakes
        FESTIVITY_MODULE=festividades
        INGREDIENT_MODULE=ingredientes
        PACKAGE_MODULE=paquetes
        RECIPE_MODULE=recipes
        USER_MODULE=usuarios
- prod obtiene secretos desde AWS Systems Manager Parameter Store usando este prefijo:
    /cupcakes/prod/
    Parámetros esperados:
        /cupcakes/prod/DB_HOST
        /cupcakes/prod/DB_PORT
        /cupcakes/prod/DB_USER
        /cupcakes/prod/DB_PASSWORD
        /cupcakes/prod/DB_NAME
        /cupcakes/prod/PGSSLMODE
    Actualmente prod está preparado a nivel de configuración, pero todavía no cuenta con validación completa de infraestructura real.

---

## Runtimes

Runtime por stage

- local: nodejs20.x
- dev: nodejs22.x
- prod: nodejs22.x

---

## Comandos

- Validación:
    - npm run check:node
    - npm test
    - npm run test:coverage
    - npm run test:watch
- Print de configuración:
    - npm run print
    - npm run print:local
    - npm run print:dev
    - npm run print:prod
- Ejecución local:
    - npm run start:local
- Despliegue:
    - npm run deploy:dev
    - serverless deploy --stage prod
- Dominios:
    - npm run create-domain:dev
    - npm run delete-domain:dev
    - serverless create_domain --stage prod
- Logs:
    - npm run logs:cupcake

---

## Levantamiento

- Local
    - npm run start:local
    - Ejemplo de url resultante: http://localhost:3000/local/cupcakeslife/cupcakes/categorias-imagen-cantidad
    - Ir a cupcake.http y presionar "Send Request" para probar un endpoint local
    - Si se ejecuta el endpoint y muestra el resultado todo esta bien
- Dev
    - npm run print:dev
    - npm run deploy:dev
    - Ejemplo de url resultante: https://api.thecupcakelife.com/dev/cupcakeslife/cupcakes/categorias-imagen-cantidad
    - Ir a cupcake.http y presionar "Send Request" para probar un endpoint de desarrollo
    - Si se ejecuta el endpoint y muestra el resultado todo esta bien
- Prod
    - npm run print:prod
    - Estado actual de prod:
        separación de variables validada
        runtime configurado
        parámetros en SSM configurados
        pendiente validación de infraestructura real y despliegue final

---

## Variables

- Principales:
    DB_HOST
    DB_PORT
    DB_USER
    DB_PASSWORD
    DB_NAME
    PGSSLMODE

- Adicionales:
    ENDPOINT_ROOT
    CATEGORY_MODULE
    CUPCAKE_MODULE
    FESTIVITY_MODULE
    INGREDIENT_MODULE
    PACKAGE_MODULE
    RECIPE_MODULE
    USER_MODULE

---

## Notas

AWS Lambda soporta nodejs22.x
Serverless v3 está fijado en este proyecto
serverless-offline está fijado y no debe actualizarse todavía
No usar npm audit fix --force
No migrar aún a Serverless v4
dev ya usa AWS Systems Manager Parameter Store
prod ya está desacoplado de dev a nivel de variables y stage
prod todavía requiere validación real de infraestructura antes de desplegar

---

## Contenido

serverless, aws, lambda, api-gateway, postgres, rds, jest, zod

## Autores

Asdrúbal Oviedo
