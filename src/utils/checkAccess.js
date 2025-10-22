import { PERMISSIONS } from "@/config/permissions.config";

export function checkAccess(userRole, permission) {
  if (!userRole) return false;
  const allowed = PERMISSIONS[permission] || [];
  return allowed.includes(userRole.toLowerCase());
}
