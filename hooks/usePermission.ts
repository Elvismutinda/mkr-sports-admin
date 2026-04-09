import { useAppSelector } from "@/store/hooks";
import { Permission } from "@/_utils/enums/permissions.enum";

export function usePermission() {
  const { permissions, isSuperAdmin } = useAppSelector(
    (state) => state.permissions,
  );

  const hasPermission = (p: Permission): boolean => {
    if (isSuperAdmin) return true;
    return permissions.includes(p);
  };

  const hasAnyPermission = (required: Permission[]): boolean => {
    if (isSuperAdmin) return true;
    return required.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (required: Permission[]): boolean => {
    if (isSuperAdmin) return true;
    return required.every((p) => permissions.includes(p));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, permissions };
}