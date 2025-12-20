// middleware/tenant.js
export const mockTenant = (req, res, next) => {
  req.tenantDbUrl = process.env.TENANT_DATABASE_URL;
  next();
};
