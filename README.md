[![CI](https://github.com/<TU_ORG>/<TU_REPO>/actions/workflows/ci.yml/badge.svg?branch=development)](https://github.com/<TU_ORG>/<TU_REPO>/actions/workflows/ci.yml)

## Tabla de Contenidos

1. [Instalación](#instalación)
2. [Levantamiento](#levantamiento)
3. [Contenido](#contenido)
4. [Autores](#autores)

## Instalación

```bash
npm install
```

## Levantamiento

1.- Ambiente local

```bash
npm run start:local
```
Url resultante: http://localhost:3000/dev/categorias-imagen-cantidad

2.- Ambiente de desarrollo

```bash
npm run deploy:dev
```
Url resultante: https://4s12t4rvt4.execute-api.us-east-2.amazonaws.com/dev/cupcakeslife/categorias/categorias-imagen-cantidad

3.- Ambiente de produccion

```bash
serverless create_domain --stage prod
sls deploy --stage prod
```
Url resultante: https://thecupcakelife.com/categorias-imagen-cantidad

## Contenido

serverless, serverless framework, serverless-offline, serverless-domain-manager, serverless-rds, lambda, api-gateway, module-alias, jest, zod

## Autores

Asdrúbal Oviedo
