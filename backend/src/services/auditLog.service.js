const { getDatabase } = require('../database/connection');
const logger = require('../utils/logger');

/**
 * Create audit log entry
 */
async function createAuditLog({
  userId,
  userType,
  action,
  entityType,
  entityId,
  changes = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    const db = getDatabase();
    
    await db.query(
      `INSERT INTO audit_logs (user_id, user_type, action, entity_type, entity_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, userType, action, entityType, entityId, JSON.stringify(changes), ipAddress, userAgent]
    );

    logger.info('Audit log created', {
      userId,
      action,
      entityType,
      entityId
    });

    return true;
  } catch (error) {
    logger.error('Failed to create audit log', error);
    return false;
  }
}

/**
 * Get audit logs for an entity
 */
async function getAuditLogs(entityType, entityId, limit = 50) {
  try {
    const db = getDatabase();
    
    const [rows] = await db.query(
      `SELECT * FROM audit_logs 
       WHERE entity_type = $1 AND entity_id = $2 
       ORDER BY created_at DESC 
       LIMIT $3`,
      [entityType, entityId, limit]
    );

    return rows;
  } catch (error) {
    logger.error('Failed to fetch audit logs', error);
    return [];
  }
}

/**
 * Get audit logs for a user
 */
async function getUserAuditLogs(userId, limit = 50) {
  try {
    const db = getDatabase();
    
    const [rows] = await db.query(
      `SELECT * FROM audit_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    return rows;
  } catch (error) {
    logger.error('Failed to fetch user audit logs', error);
    return [];
  }
}

module.exports = {
  createAuditLog,
  getAuditLogs,
  getUserAuditLogs
};