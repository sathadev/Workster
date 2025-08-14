// backend/middlewares/requireCompanyAuth.js
module.exports = function requireCompanyAuth(req, res, next) {
  try {
    const raw = req.user?.company_id ?? req.headers['x-company-id'];
    const companyId = Number(raw);

    if (!raw || Number.isNaN(companyId) || companyId <= 0) {
      return res.status(401).json({
        message: 'ต้องมี company_id (ผ่าน JWT หรือ X-Company-Id header)',
      });
    }

    req.companyId = companyId;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
