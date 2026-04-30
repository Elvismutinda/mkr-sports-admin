export type ReportFormat = "table" | "csv";

// Player Report

export interface PlayerReportParams {
  role?: "player";
  isActive?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface PlayerReportRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  role: string;
  isActive: boolean;
  emailVerified: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  stats: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    rating: number;
  } | null;
}

export interface PlayerReportSummary {
  total: number;
  verified: number;
  unverified: number;
  active: number;
}

export const generatePlayerReport = async (
  params: PlayerReportParams,
): Promise<{ data: PlayerReportRow[]; summary: PlayerReportSummary }> => {
  const qs = new URLSearchParams();
  if (params.role) qs.set("role", params.role);
  if (params.isActive) qs.set("isActive", params.isActive);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  if (params.limit) qs.set("limit", String(params.limit));
  const res = await fetch(`/api/admin/reports/players?${qs}`);
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

// Match Report

export interface MatchReportParams {
  status?: string;
  mode?: string;
  dateFrom?: string;
  dateTo?: string;
  tournamentId?: string;
  limit?: number;
}

export interface MatchReportRow {
  id: string;
  date: string;
  location: string;
  mode: string;
  status: string;
  score: { home: number; away: number } | null;
  completed: boolean;
  maxPlayers: number;
  registeredCount: number;
  price: string;
  homeTeamName: string | null;
  awayTeamName: string | null;
  turfName: string | null;
  tournamentName: string | null;
  roundName: string | null;
  createdAt: string;
}

export interface MatchReportSummary {
  total: number;
  completed: number;
  upcoming: number;
  live: number;
  cancelled: number;
  totalRevenue: number;
}

export const generateMatchReport = async (
  params: MatchReportParams,
): Promise<{ data: MatchReportRow[]; summary: MatchReportSummary }> => {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.mode) qs.set("mode", params.mode);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  if (params.tournamentId) qs.set("tournamentId", params.tournamentId);
  if (params.limit) qs.set("limit", String(params.limit));
  const res = await fetch(`/api/admin/reports/matches?${qs}`);
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

// Payment Report

export interface PaymentReportParams {
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface PaymentReportRow {
  id: string;
  userName: string;
  userEmail: string;
  phone: string;
  amount: string;
  currency: string;
  status: string;
  mpesaReceiptNumber: string | null;
  matchLocation: string | null;
  tournamentName: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface PaymentReportSummary {
  totalTransactions: number;
  totalRevenue: number;
  totalPending: number;
  successCount: number;
  failedCount: number;
}

export const generatePaymentReport = async (
  params: PaymentReportParams,
): Promise<{ data: PaymentReportRow[]; summary: PaymentReportSummary }> => {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.type) qs.set("type", params.type);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  if (params.limit) qs.set("limit", String(params.limit));
  const res = await fetch(`/api/admin/reports/payments?${qs}`);
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

// Turf Report

export interface TurfReportParams {
  city?: string;
  surface?: string;
  isActive?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TurfReportRow {
  id: string;
  name: string;
  city: string;
  area: string | null;
  surface: string | null;
  pricePerHour: string | null;
  capacity: number | null;
  rating: string;
  totalReviews: number;
  isActive: boolean;
  partnerName: string | null;
  matchCount: number;
  completedMatchCount: number;
}

export interface TurfReportSummary {
  total: number;
  active: number;
  inactive: number;
  totalMatches: number;
}

export const generateTurfReport = async (
  params: TurfReportParams,
): Promise<{ data: TurfReportRow[]; summary: TurfReportSummary }> => {
  const qs = new URLSearchParams();
  if (params.city) qs.set("city", params.city);
  if (params.surface) qs.set("surface", params.surface);
  if (params.isActive) qs.set("isActive", params.isActive);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  const res = await fetch(`/api/admin/reports/turfs?${qs}`);
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

// Tournament Report

export interface TournamentReportParams {
  status?: string;
  format?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TournamentReportRow {
  id: string;
  name: string;
  format: string;
  status: string;
  prizePool: string;
  entryFee: string;
  maxTeams: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isPublic: boolean;
  turfName: string | null;
  participantCount: number;
  teamCount: number;
  estimatedRevenue: number;
}

export interface TournamentReportSummary {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  totalPrizePool: number;
}

export const generateTournamentReport = async (
  params: TournamentReportParams,
): Promise<{
  data: TournamentReportRow[];
  summary: TournamentReportSummary;
}> => {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.format) qs.set("format", params.format);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  const res = await fetch(`/api/admin/reports/tournaments?${qs}`);
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

// CSV Export

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const v = row[h];
        if (v === null || v === undefined) return "";
        if (typeof v === "object")
          return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
        const s = String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      })
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
