// database/db.js
const pgp = require('pg-promise')();
const environment = require('@environment/environment');

// Log para verificar conexión
console.log('📡 DB connecting to:', {
  host: environment.DB_HOST,
  user: environment.DB_USER,
  database: environment.DB_NAME,
  port: environment.DB_PORT
});

// Habilitar SSL cuando corremos en Lambda o si lo fuerzas con PGSSLMODE=require
const ssl =
  (process.env.PGSSLMODE || environment.PGSSLMODE) === 'require'
    ? { rejectUnauthorized: false }
    : false;

const config = {
  host: environment.DB_HOST,
  user: environment.DB_USER,
  password: environment.DB_PASSWORD,
  database: environment.DB_NAME,
  port: parseInt(environment.DB_PORT || '5432', 10),
  ssl
  // Para prod estricto, usa el CA de RDS y pon: ssl: { ca: fs.readFileSync('rds-combined-ca-bundle.pem'), rejectUnauthorized: true }
};

const db = pgp(config);
module.exports = db;
