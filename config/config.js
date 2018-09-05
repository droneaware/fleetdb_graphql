'use strict';

require('dotenv').config();

exports.environment = process.env.ENVIRONMENT || 'development';

module.exports = {
  [exports.environment]: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
  },
};

