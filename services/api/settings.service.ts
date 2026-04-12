import useSWR from "swr";
import { fetcher } from "../_fetcher";
import {
  PaginatedResponse,
  PermissionsResponse,
  SystemRoleRow,
  SystemUserRow,
} from "../_types";

// Roles

export const useSystemRoles = () => {
  const { data, error, isLoading, mutate } = useSWR<SystemRoleRow[]>(
    "/api/admin/roles",
    fetcher,
  );
  return { data: data ?? [], error, isLoading, mutate };
};

export const useSystemRole = (id: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<SystemRoleRow>(
    id ? `/api/admin/roles/${id}` : null,
    fetcher,
  );
  return { data, error, isLoading, mutate };
};

export const addSystemRole = async (payload: {
  name: string;
  description?: string;
  permissionKeys: string[];
}): Promise<{ message: string }> => {
  const res = await fetch("/api/admin/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const updateSystemRole = async (
  id: string,
  payload: { name?: string; description?: string; permissionKeys?: string[] },
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const deleteSystemRole = async (
  id: string,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

// Permissions

export const useSystemPermissions = () => {
  const { data, error, isLoading } = useSWR<PermissionsResponse>(
    "/api/admin/permissions",
    fetcher,
  );
  return { data, error, isLoading };
};

// System Users

export const useSystemUsers = (params?: {
  q?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const url = `/api/admin/system-users?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<
    PaginatedResponse<SystemUserRow>
  >(url, fetcher);

  return { data, error, isLoading, mutate };
};

export const useSystemUser = (id: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<SystemUserRow>(
    id ? `/api/admin/system-users/${id}` : null,
    fetcher,
  );
  return { data, error, isLoading, mutate };
};

export const createSystemUser = async (payload: {
  name: string;
  email: string;
  phone?: string;
  roleId?: string;
}): Promise<{ message: string; data: SystemUserRow }> => {
  const res = await fetch("/api/admin/system-users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const updateSystemUser = async (
  id: string,
  payload: {
    name?: string;
    phone?: string;
    roleId?: string | null;
    status?: "active" | "inactive" | "suspended";
  },
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/system-users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const suspendSystemUser = async (
  id: string,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/admin/system-users/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};
