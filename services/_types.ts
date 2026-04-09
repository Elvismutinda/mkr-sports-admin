export interface SystemRoleRow {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: { key: string; group: string | null }[];
}

export interface PermissionRow {
  id: string;
  key: string;
  group: string | null;
}

export interface PermissionsResponse {
  flat: PermissionRow[];
  grouped: Record<string, PermissionRow[]>;
}

export interface SystemUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: "active" | "inactive" | "suspended";
  roleId: string | null;
  roleName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}