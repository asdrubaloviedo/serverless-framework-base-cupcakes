// Cargar dotenv y especificar la ruta del archivo .env(Si estuviera en la raiz no seria necesario el config)
require('dotenv').config();

// Dejamos publico todas las variables del ambiente de trabajo
module.exports = {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_DATABASE: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
  APP_PORT: process.env.APP_PORT,
  ENDPOINT_ROOT: process.env.ENDPOINT_ROOT
};
