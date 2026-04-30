import type {
  Position,
  UserRole,
  TurfSurface,
  TournamentStatus,
  TournamentFormat,
  FixtureStatus,
  PaymentStatus,
  NotificationType,
} from "@/lib/db/schema";

// Re-export schema types
export type {
  Position,
  UserRole,
  TurfSurface,
  TournamentStatus,
  TournamentFormat,
  FixtureStatus,
  PaymentStatus,
  NotificationType,
};

// Pagination
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Permissions / Roles
export interface PermissionRow {
  id: string;
  key: string;
  group: string | null;
}

export interface PermissionsResponse {
  flat: PermissionRow[];
  grouped: Record<string, PermissionRow[]>;
}

export interface SystemRoleRow {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: { key: string; group: string | null }[];
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

// Players
export interface UserStats {
  matchesPlayed: number;
  goals: number;
  assists: number;
  motm: number;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface UserAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  stamina: number;
  workRate: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: Position;
  avatarUrl: string | null;
  role: UserRole;
  bio: string | null;
  isActive: boolean;
  stats: UserStats | null;
  attributes: UserAttributes | null;
  aiAnalysis: string | null;
  emailVerified: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PaginatedUsers = PaginatedResponse<AdminUserRow>;

// Turfs
export interface AdminTurfRow {
  id: string;
  name: string;
  area: string | null;
  city: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  surface: TurfSurface | null;
  amenities: string[];
  pricePerHour: string | null;
  rating: string;
  totalReviews: number;
  capacity: number | null;
  partnerId: string | null;
  partnerName: string | null;
  isActive: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export type PaginatedTurfs = PaginatedResponse<AdminTurfRow>;

// Teams
export interface TeamStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  rating: number;
}

export interface AdminTeamRow {
  id: string;
  name: string;
  badgeUrl: string | null;
  badgeFallback: string | null;
  type: string | null;
  bio: string | null;
  captainId: string | null;
  captainName: string | null;
  stats: TeamStats | null;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PaginatedTeams = PaginatedResponse<AdminTeamRow>;

// Tournaments
export interface AdminTournamentRow {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  turfId: string | null;
  turfName: string | null;
  prizePool: string;
  entryFee: string;
  maxTeams: number | null;
  maxPlayersPerTeam: number | null;
  format: TournamentFormat;
  status: TournamentStatus;
  startsAt: string | null;
  endsAt: string | null;
  registrationDeadline: string | null;
  rules: string | null;
  isPublic: boolean;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PaginatedTournaments = PaginatedResponse<AdminTournamentRow>;

// Matches
export interface AdminMatchRow {
  id: string;
  date: string;
  location: string;
  turfId: string | null;
  turfName: string | null;
  tournamentId: string | null;
  tournamentName: string | null;
  homeTeamId: string | null;
  homeTeamName: string | null;
  awayTeamId: string | null;
  awayTeamName: string | null;
  mode: string;
  price: string;
  maxPlayers: number;
  registeredCount: number;
  status: FixtureStatus;
  completed: boolean;
  score: { home: number; away: number } | null;
  matchReport: string | null;
  isPublic: boolean;
  roundName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PaginatedMatches = PaginatedResponse<AdminMatchRow>;

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  data: AdminNotification[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ModuleCounts {
  users: number;
  turfs: number;
  teams: number;
  tournaments: number;
  matches: number;
  payments: number;
}

export interface AdminPaymentRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  matchId: string | null;
  matchLocation: string | null;
  tournamentId: string | null;
  tournamentName: string | null;
  amount: string;
  currency: string;
  phone: string;
  mpesaReceiptNumber: string | null;
  checkoutRequestId: string | null;
  status: PaymentStatus;
  failureReason: string | null;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemLogRow {
  id: string;
  actorId: string | null;
  actorType: string | null;
  actorName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface SystemLogsResponse {
  data: SystemLogRow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta: { actions: string[]; entityTypes: string[] };
}

export interface DashboardData {
  totals: {
    players: number;
    partners: number;
    turfs: number;
    teams: number;
    matches: number;
    tournaments: number;
  };
  players: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    pendingPayments: number;
    failedPayments: number;
  };
  matches: {
    upcoming: number;
    live: number;
    completedThisMonth: number;
  };
  tournaments: {
    upcoming: number;
    ongoing: number;
  };
  charts: {
    registrationTrend: { date: string; count: number }[];
    revenueTrend: { date: string; revenue: number }[];
    matchModeDistribution: { mode: string; count: number }[];
  };
  topTurfs: { name: string; city: string; matchCount: number }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string | null;
    description: string | null;
    createdAt: string;
  }[];
}