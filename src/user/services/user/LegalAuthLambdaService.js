
"use strict";

class LegalAuthLambdaService {

    static async execute(params) {

        /*
         * En LOCAL no necesitamos realizar una invocación
         * remota a AWS.
         */
        if (
            process.env.IS_OFFLINE === 'true' ||
            process.env.APP_STAGE === 'local'
        ) {

            const LegalAuthDatabase = require(
                '@user/services/user/LegalAuthDatabase'
            );

            return LegalAuthDatabase.execute(params);
        }

        /*
         * En DEV y PROD utilizamos la Lambda interna
         * encargada de acceder a PostgreSQL.
         */
        const functionName =
            process.env.LEGAL_AUTH_DB_FUNCTION;

        if (!functionName) {

            console.error(
                '[LegalAuth] Lambda interna no configurada'
            );

            throw {
                statusCode: 500,
                message: 'Error interno del servidor'
            };
        }

        const AWS = require('aws-sdk');

        const lambda = new AWS.Lambda({
            region: process.env.AWS_REGION || 'us-east-2',
            maxRetries: 0,
            httpOptions: {
                connectTimeout: 3000,
                timeout: 12000
            }
        });

        let response;
        let result;

        try {

            response = await lambda.invoke({
                FunctionName: functionName,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(params)
            }).promise();

            if (
                response.StatusCode !== 200 ||
                response.FunctionError ||
                !response.Payload
            ) {

                throw new Error(
                    'Respuesta inválida de la Lambda interna'
                );
            }

            result = JSON.parse(
                response.Payload.toString()
            );

        } catch (error) {

            console.error(
                '[LegalAuth] Error de invocación interna',
                {
                    code: error.code
                }
            );

            throw {
                statusCode: 502,
                message: 'No fue posible completar la operación'
            };
        }

        /*
         * Validamos que la respuesta de la Lambda interna
         * cumpla con el contrato esperado.
         */
        if (
            !result ||
            typeof result.success !== 'boolean'
        ) {

            throw {
                statusCode: 502,
                message: 'Respuesta interna inválida'
            };
        }

        /*
         * Conservamos los códigos HTTP correspondientes
         * a errores de negocio conocidos.
         */
        if (result.success === false) {

            const allowedCodes = [
                400,
                401,
                403,
                404,
                409,
                500,
                503
            ];

            const statusCode = allowedCodes.includes(
                result.statusCode
            )
                ? result.statusCode
                : 500;

            throw {
                statusCode,
                message: statusCode === 500 ||
                    typeof result.message !== 'string'
                    ? 'Error interno del servidor'
                    : result.message
            };
        }

        return result;
    }
}

module.exports = LegalAuthLambdaService;
