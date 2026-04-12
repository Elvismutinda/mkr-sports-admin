import useSWR from "swr";
import { AdminMatchRow, FixtureStatus, PaginatedMatches } from "../_types";
import { fetcher } from "../_fetcher";

export const useMatchesAdmin = (params?: {
  q?: string;
  status?: FixtureStatus;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const { data, error, isLoading, mutate, isValidating } =
    useSWR<PaginatedMatches>(`/api/admin/matches?${qs}`, fetcher);
  return { data, error, isLoading, mutate, isValidating };
};

export const createMatch = async (payload: {
  date: string;
  location: string;
  mode: string;
  price?: string;
  maxPlayers?: number;
  turfId?: string;
  tournamentId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  isPublic?: boolean;
  roundName?: string;
}): Promise<{ message: string }> => {
  const res = await fetch("/api/admin/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const updateMatch = async (
  id: string,
  payload: Partial<AdminMatchRow & { score: { home: number; away: number } }>,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/matches/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const cancelMatch = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};
