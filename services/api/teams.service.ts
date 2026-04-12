import useSWR from "swr";
import { AdminTeamRow, PaginatedTeams } from "../_types";
import { fetcher } from "../_fetcher";

export const useTeamsAdmin = (params?: {
  q?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const { data, error, isLoading, mutate, isValidating } =
    useSWR<PaginatedTeams>(`/api/admin/teams?${qs}`, fetcher);
  return { data, error, isLoading, mutate, isValidating };
};

export const useTeamAdmin = (id: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<
    AdminTeamRow & {
      members: {
        id: string;
        name: string;
        position: string | null;
        avatarUrl: string | null;
        jerseyNumber: number | null;
      }[];
    }
  >(id ? `/api/admin/teams/${id}` : null, fetcher);
  return { data, error, isLoading, mutate };
};

export const createTeam = async (payload: {
  name: string;
  type?: string;
  bio?: string;
  badgeFallback?: string;
}): Promise<{ message: string }> => {
  const res = await fetch("/api/admin/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const updateTeam = async (
  id: string,
  payload: Partial<AdminTeamRow>,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/teams/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const deactivateTeam = async (
  id: string,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/teams/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};
