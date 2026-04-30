import useSWR from "swr";
import { fetcher } from "../_fetcher";

export interface TurfManagerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  avatarUrl: string | null;
  status: "active" | "inactive" | "suspended";
  emailVerified: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTurfManagers {
  data: TurfManagerRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export const useTurfManagers = (params?: { q?: string; page?: number; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const { data, error, isLoading, mutate, isValidating } =
    useSWR<PaginatedTurfManagers>(`/api/partners/turf-managers?${qs}`, fetcher);
  return { data, error, isLoading, mutate, isValidating };
};

export const createTurfManager = async (payload: {
  name: string; email: string; phone?: string; businessName?: string;
}): Promise<{ message: string; data: TurfManagerRow }> => {
  const res = await fetch("/api/partners/turf-managers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const updateTurfManager = async (
  id: string,
  payload: { name?: string; phone?: string; businessName?: string; status?: "active" | "inactive" | "suspended" },
): Promise<{ message: string }> => {
  const res = await fetch(`/api/partners/turf-managers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const suspendTurfManager = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`/api/partners/turf-managers/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const resendTurfManagerInvite = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`/api/partners/turf-managers/${id}/resend-invite`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};