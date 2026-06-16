const AuditLog = require('../models/AuditLog');

const getRequestIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
};

const writeAuditLog = async (req, { action, targetType, targetId = null, metadata = {} }) => {
  try {
    await AuditLog.create({
      actorId: req.user?._id || req.user?.id || null,
      actorRole: req.user?.role || 'system',
      action,
      targetType,
      targetId,
      metadata,
      ip: getRequestIp(req),
      userAgent: req.get('user-agent') || null,
    });
  } catch (error) {
    console.error('Audit log write failed:', error.message);
  }
};

module.exports = { writeAuditLog };
