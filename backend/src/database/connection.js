const { Sequelize } = require('sequelize');
const config = require('../config/config');
const logger = require('../utils/logger');

let sequelize = null;

async function connectDatabase() {
  if (sequelize) {
    return sequelize;
  }

  sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
      host: config.database.host,
      port: config.database.port,
      dialect: config.database.dialect,
      logging: config.database.logging ? (msg) => logger.debug(msg) : false,
      pool: config.database.pool
    }
  );

  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to database', error);
    throw error;
  }
}

function getDatabase() {
  if (!sequelize) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return sequelize;
}

module.exports = {
  connectDatabase,
  getDatabase,
  sequelize
};