// database/db.js
const pgp = require('pg-promise')();
const environment = require('@environment/environment');

// Log para verificar conexión
console.log('📡 DB connecting to:', {
  host: environment.DB_HOST,
  user: environment.DB_USER,
  database: environment.DB_NAME ?? environment.DB_DATABASE,
  port: environment.DB_PORT
});

const config = {
  host: environment.DB_HOST,
  user: environment.DB_USER,
  port: environment.DB_PORT,
  password: environment.DB_PASSWORD,
  database: environment.DB_NAME ?? environment.DB_DATABASE,
  port: parseInt(environment.DB_PORT || '5432', 10)
  // SSL desactivado en local; para RDS luego debe activarse.
};

const db = pgp(config);

module.exports = db;
