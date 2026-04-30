/**
 * All available permissions in the system.
 * Keys match what is seeded into the `permissions` table.
 */
export enum Permission {
  // User / Player management
  CREATE_USER = "CREATE_USER",
  VIEW_USER = "VIEW_USER",
  UPDATE_USER = "UPDATE_USER",
  DELETE_USER = "DELETE_USER",

  // Role management
  CREATE_ROLE = "CREATE_ROLE",
  VIEW_ROLE = "VIEW_ROLE",
  UPDATE_ROLE = "UPDATE_ROLE",
  DELETE_ROLE = "DELETE_ROLE",

  // System user (admin panel operator)
  CREATE_SYSTEM_USER = "CREATE_SYSTEM_USER",
  VIEW_SYSTEM_USER = "VIEW_SYSTEM_USER",
  UPDATE_SYSTEM_USER = "UPDATE_SYSTEM_USER",
  DELETE_SYSTEM_USER = "DELETE_SYSTEM_USER",

  // Turf management
  CREATE_TURF = "CREATE_TURF",
  VIEW_TURF = "VIEW_TURF",
  UPDATE_TURF = "UPDATE_TURF",
  DELETE_TURF = "DELETE_TURF",

  // Team management
  CREATE_TEAM = "CREATE_TEAM",
  VIEW_TEAM = "VIEW_TEAM",
  UPDATE_TEAM = "UPDATE_TEAM",
  DELETE_TEAM = "DELETE_TEAM",

  // Tournament management
  CREATE_TOURNAMENT = "CREATE_TOURNAMENT",
  VIEW_TOURNAMENT = "VIEW_TOURNAMENT",
  UPDATE_TOURNAMENT = "UPDATE_TOURNAMENT",
  DELETE_TOURNAMENT = "DELETE_TOURNAMENT",

  // Match / Fixture management
  CREATE_MATCH = "CREATE_MATCH",
  VIEW_MATCH = "VIEW_MATCH",
  UPDATE_MATCH = "UPDATE_MATCH",
  DELETE_MATCH = "DELETE_MATCH",

  // Payment management
  VIEW_PAYMENT = "VIEW_PAYMENT",
  REFUND_PAYMENT = "REFUND_PAYMENT",
  EXPORT_PAYMENT = "EXPORT_PAYMENT",

  // Challenge management
  VIEW_CHALLENGE = "VIEW_CHALLENGE",
  UPDATE_CHALLENGE = "UPDATE_CHALLENGE",

  // Report management
  CREATE_REPORT = "CREATE_REPORT",
  VIEW_REPORT = "VIEW_REPORT",
  UPDATE_REPORT = "UPDATE_REPORT",

  // Dashboard
  DASHBOARD_CLIENTS = "DASHBOARD_CLIENTS",
  DASHBOARD_TRANSACTIONS = "DASHBOARD_TRANSACTIONS",
  DASHBOARD_ANALYTICS = "DASHBOARD_ANALYTICS",

  // System logs
  VIEW_SYSTEM_LOG = "VIEW_SYSTEM_LOG",

  // Super admin
  SUPER_ADMIN = "SUPER_ADMIN",
}

/** Maps each permission to the module group it belongs to (used for seeding) */
export const PERMISSION_GROUPS: Record<Permission, string> = {
  [Permission.CREATE_USER]: "User",
  [Permission.VIEW_USER]: "User",
  [Permission.UPDATE_USER]: "User",
  [Permission.DELETE_USER]: "User",

  [Permission.CREATE_ROLE]: "Role",
  [Permission.VIEW_ROLE]: "Role",
  [Permission.UPDATE_ROLE]: "Role",
  [Permission.DELETE_ROLE]: "Role",

  [Permission.CREATE_SYSTEM_USER]: "SystemUser",
  [Permission.VIEW_SYSTEM_USER]: "SystemUser",
  [Permission.UPDATE_SYSTEM_USER]: "SystemUser",
  [Permission.DELETE_SYSTEM_USER]: "SystemUser",

  [Permission.CREATE_TURF]: "Turf",
  [Permission.VIEW_TURF]: "Turf",
  [Permission.UPDATE_TURF]: "Turf",
  [Permission.DELETE_TURF]: "Turf",

  [Permission.CREATE_TEAM]: "Team",
  [Permission.VIEW_TEAM]: "Team",
  [Permission.UPDATE_TEAM]: "Team",
  [Permission.DELETE_TEAM]: "Team",

  [Permission.CREATE_TOURNAMENT]: "Tournament",
  [Permission.VIEW_TOURNAMENT]: "Tournament",
  [Permission.UPDATE_TOURNAMENT]: "Tournament",
  [Permission.DELETE_TOURNAMENT]: "Tournament",

  [Permission.CREATE_MATCH]: "Match",
  [Permission.VIEW_MATCH]: "Match",
  [Permission.UPDATE_MATCH]: "Match",
  [Permission.DELETE_MATCH]: "Match",

  [Permission.VIEW_PAYMENT]: "Payment",
  [Permission.REFUND_PAYMENT]: "Payment",
  [Permission.EXPORT_PAYMENT]: "Payment",

  [Permission.VIEW_CHALLENGE]: "Challenge",
  [Permission.UPDATE_CHALLENGE]: "Challenge",

  [Permission.CREATE_REPORT]: "Report",
  [Permission.VIEW_REPORT]: "Report",
  [Permission.UPDATE_REPORT]: "Report",

  [Permission.DASHBOARD_CLIENTS]: "Dashboard",
  [Permission.DASHBOARD_TRANSACTIONS]: "Dashboard",
  [Permission.DASHBOARD_ANALYTICS]: "Dashboard",

  [Permission.VIEW_SYSTEM_LOG]: "SystemLog",

  [Permission.SUPER_ADMIN]: "Admin",
};

/**
 * Permission groups — used by usePermission() and sidebar gating.
 * SUPER_ADMIN implicitly grants everything; check for it first.
 */
export const PermissionGroups = {
  Dashboard: [
    Permission.DASHBOARD_CLIENTS,
    Permission.DASHBOARD_TRANSACTIONS,
    Permission.DASHBOARD_ANALYTICS,
  ],
  User: [
    Permission.CREATE_USER,
    Permission.VIEW_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
  ],
  Role: [
    Permission.CREATE_ROLE,
    Permission.VIEW_ROLE,
    Permission.UPDATE_ROLE,
    Permission.DELETE_ROLE,
  ],
  SystemUser: [
    Permission.CREATE_SYSTEM_USER,
    Permission.VIEW_SYSTEM_USER,
    Permission.UPDATE_SYSTEM_USER,
    Permission.DELETE_SYSTEM_USER,
  ],
  Turf: [
    Permission.CREATE_TURF,
    Permission.VIEW_TURF,
    Permission.UPDATE_TURF,
    Permission.DELETE_TURF,
  ],
  Team: [
    Permission.CREATE_TEAM,
    Permission.VIEW_TEAM,
    Permission.UPDATE_TEAM,
    Permission.DELETE_TEAM,
  ],
  Tournament: [
    Permission.CREATE_TOURNAMENT,
    Permission.VIEW_TOURNAMENT,
    Permission.UPDATE_TOURNAMENT,
    Permission.DELETE_TOURNAMENT,
  ],
  Match: [
    Permission.CREATE_MATCH,
    Permission.VIEW_MATCH,
    Permission.UPDATE_MATCH,
    Permission.DELETE_MATCH,
  ],
  Transaction: [
    Permission.VIEW_PAYMENT,
    Permission.REFUND_PAYMENT,
    Permission.EXPORT_PAYMENT,
  ],
  Challenge: [Permission.VIEW_CHALLENGE, Permission.UPDATE_CHALLENGE],
  Report: [
    Permission.CREATE_REPORT,
    Permission.VIEW_REPORT,
    Permission.UPDATE_REPORT,
  ],
  SystemLog: [Permission.VIEW_SYSTEM_LOG],
  Settings: [
    Permission.CREATE_USER,
    Permission.VIEW_USER,
    Permission.CREATE_ROLE,
    Permission.VIEW_ROLE,
    Permission.UPDATE_ROLE,
    Permission.DELETE_ROLE,
    Permission.CREATE_SYSTEM_USER,
    Permission.VIEW_SYSTEM_USER,
    Permission.UPDATE_SYSTEM_USER,
    Permission.DELETE_SYSTEM_USER,
  ],
  Admin: [Permission.SUPER_ADMIN],

  // Legacy aliases kept for backwards compat with existing sidebar code
  Client: [
    Permission.CREATE_USER,
    Permission.VIEW_USER,
    Permission.UPDATE_USER,
  ],
};

/**
 * Predefined system roles that get seeded.
 * Each role maps to a list of permissions it is granted.
 */
export const SYSTEM_ROLES: Record<
  string,
  { description: string; permissions: Permission[]; isDefault: boolean }
> = {
  "Super Admin": {
    description: "Full unrestricted access to all system features.",
    isDefault: false,
    permissions: [Permission.SUPER_ADMIN],
  },
  "Match Manager": {
    description: "Can create and manage matches, turfs, and tournaments.",
    isDefault: false,
    permissions: [
      Permission.CREATE_MATCH,
      Permission.VIEW_MATCH,
      Permission.UPDATE_MATCH,
      Permission.DELETE_MATCH,
      Permission.CREATE_TOURNAMENT,
      Permission.VIEW_TOURNAMENT,
      Permission.UPDATE_TOURNAMENT,
      Permission.VIEW_TURF,
      Permission.UPDATE_TURF,
      Permission.DASHBOARD_ANALYTICS,
      Permission.VIEW_CHALLENGE,
      Permission.UPDATE_CHALLENGE,
    ],
  },
  "Finance Officer": {
    description: "Read-only access to payments and financial reports.",
    isDefault: false,
    permissions: [
      Permission.VIEW_PAYMENT,
      Permission.REFUND_PAYMENT,
      Permission.EXPORT_PAYMENT,
      Permission.VIEW_REPORT,
      Permission.DASHBOARD_TRANSACTIONS,
    ],
  },
  "Content Manager": {
    description: "Manages turfs, teams, and public-facing content.",
    isDefault: false,
    permissions: [
      Permission.CREATE_TURF,
      Permission.VIEW_TURF,
      Permission.UPDATE_TURF,
      Permission.VIEW_TEAM,
      Permission.UPDATE_TEAM,
      Permission.VIEW_TOURNAMENT,
      Permission.VIEW_MATCH,
      Permission.DASHBOARD_CLIENTS,
    ],
  },
  "Read Only": {
    description: "View-only access across all modules. Default for new staff.",
    isDefault: true,
    permissions: [
      Permission.VIEW_USER,
      Permission.VIEW_TURF,
      Permission.VIEW_TEAM,
      Permission.VIEW_TOURNAMENT,
      Permission.VIEW_MATCH,
      Permission.VIEW_PAYMENT,
      Permission.VIEW_REPORT,
      Permission.DASHBOARD_CLIENTS,
      Permission.DASHBOARD_TRANSACTIONS,
    ],
  },
};

export const getAllPermissions = (): string[] => Object.values(Permission);

export const isValidPermission = (p: string): p is Permission =>
  Object.values(Permission).includes(p as Permission);