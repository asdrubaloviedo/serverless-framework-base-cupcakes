// database/db.js
const pgp = require('pg-promise')();
const environment = require('@environment/environment');

const config = {
  host: environment.DB_HOST,
  user: environment.DB_USER,
  port: environment.DB_PORT,
  password: environment.DB_PASSWORD,
  database: environment.DB_DATABASE
};

const db = pgp(config);

module.exports = db;
