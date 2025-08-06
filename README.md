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
npm run start 
```
Url resultante: http://localhost:3000/dev/categorias-imagen-cantidad

2.- Ambiente de desarrollo

```bash
sls deploy --stage dev
```
Url resultante: https://...amazonaws.com/dev/categorias-imagen-cantidad

3.- Ambiente de produccion

```bash
serverless create_domain --stage prod
sls deploy --stage prod
```
Url resultante: https://thecupcakelife.com/categorias-imagen-cantidad

## Contenido

serverless, serverless framework, serverless-offline, serverless-domain-manager, lambda, api-gateway, module-alias

## Autores

Asdrúbal Oviedo
