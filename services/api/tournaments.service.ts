import useSWR from "swr";
import { fetcher } from "../_fetcher";
import {
  AdminTournamentRow,
  PaginatedTournaments,
  TournamentFormat,
  TournamentStatus,
} from "../_types";

export const useTournamentsAdmin = (params?: {
  q?: string;
  status?: TournamentStatus;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const { data, error, isLoading, mutate, isValidating } =
    useSWR<PaginatedTournaments>(`/api/admin/tournaments?${qs}`, fetcher);
  return { data, error, isLoading, mutate, isValidating };
};

export const createTournament = async (payload: {
  name: string;
  description?: string;
  location?: string;
  turfId?: string;
  prizePool?: string;
  entryFee?: string;
  maxTeams?: number;
  maxPlayersPerTeam?: number;
  format?: TournamentFormat;
  startsAt?: string;
  endsAt?: string;
  registrationDeadline?: string;
  rules?: string;
  isPublic?: boolean;
}): Promise<{ message: string }> => {
  const res = await fetch("/api/admin/tournaments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const updateTournament = async (
  id: string,
  payload: Partial<AdminTournamentRow>,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/tournaments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const cancelTournament = async (
  id: string,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/tournaments/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};
