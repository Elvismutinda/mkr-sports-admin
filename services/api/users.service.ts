import useSWR from "swr";
import { fetcher } from "../_fetcher";
import { Position, UserRole } from "@/lib/db/schema";
import { AdminUserRow, PaginatedUsers, UserAttributes, UserStats } from "../_types";

export const useUsers = (params?: {
  q?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
  isActive?: boolean;
  emailVerified?: boolean;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.role) qs.set("role", params.role);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));
  if (params?.emailVerified !== undefined) qs.set("emailVerified", String(params.emailVerified));

  const { data, error, isLoading, mutate, isValidating } =
    useSWR<PaginatedUsers>(`/api/admin/users?${qs.toString()}`, fetcher);

  return { data, error, isLoading, mutate, isValidating };
};

export const useUser = (id: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<AdminUserRow>(
    id ? `/api/admin/users/${id}` : null,
    fetcher,
  );
  return { data, error, isLoading, mutate };
};

// Mutations

export const createUser = async (payload: {
  name: string;
  email: string;
  phone?: string;
  position: Position;
  role?: UserRole;
}): Promise<{ message: string; data: AdminUserRow }> => {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const updateUser = async (
  id: string,
  payload: Partial<{
    name: string;
    phone: string | null;
    position: Position;
    bio: string | null;
    isActive: boolean;
    stats: UserStats;
    attributes: UserAttributes;
  }>,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const deactivateUser = async (id: string): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};
