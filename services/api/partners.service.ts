import useSWR from "swr";
import { fetcher } from "../_fetcher";
import { KycDocumentRow, KycDocumentsResponse, KycSettingsData, KycSubmissionRow, PartnerAnalytics, PartnerSettingsData, SystemLogsResponse, TurfSettingsData } from "../_types";

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
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useTurfManagers = (params?: {
  q?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const { data, error, isLoading, mutate, isValidating } =
    useSWR<PaginatedTurfManagers>(`/api/partners/turf-managers?${qs}`, fetcher);
  return { data, error, isLoading, mutate, isValidating };
};

export const createTurfManager = async (payload: {
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
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
  payload: {
    name?: string;
    phone?: string;
    businessName?: string;
    status?: "active" | "inactive" | "suspended";
  },
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

export const suspendTurfManager = async (
  id: string,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/partners/turf-managers/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const resendTurfManagerInvite = async (
  id: string,
): Promise<{ message: string }> => {
  const res = await fetch(`/api/partners/turf-managers/${id}/resend-invite`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};


// Partner Portal Settings

export const usePartnerSettings = () => {
  const { data, error, isLoading, mutate } = useSWR<PartnerSettingsData>(
    "/api/partners/partner-settings",
    fetcher,
  );
  return { data, error, isLoading, mutate };
};

export const savePartnerSettings = async (
  values: Omit<PartnerSettingsData, "id" | "updatedAt">,
): Promise<PartnerSettingsData> => {
  const res = await fetch("/api/partners/partner-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save partner settings");
  }
  return res.json();
};


export const useTurfSettings = () => {
  const { data, error, isLoading, mutate } = useSWR<TurfSettingsData>(
    "/api/partners/turf-settings",
    fetcher,
  );
  return { data, error, isLoading, mutate };
};

export const saveTurfSettings = async (
  values: Omit<TurfSettingsData, "id" | "updatedAt">,
): Promise<TurfSettingsData> => {
  const res = await fetch("/api/partners/turf-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...values,
      minBookingHours: parseFloat(values.minBookingHours),
      maxBookingHours: parseFloat(values.maxBookingHours),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save turf settings");
  }
  return res.json();
};


export const useKycSettings = () => {
  const { data, error, isLoading, mutate } = useSWR<KycSettingsData>(
    "/api/partners/kyc-settings",
    fetcher,
  );
  return { data, error, isLoading, mutate };
};

export const saveKycSettings = async (
  values: Omit<KycSettingsData, "id" | "updatedAt">,
): Promise<KycSettingsData> => {
  const res = await fetch("/api/partners/kyc-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save KYC settings");
  }
  return res.json();
};


export const useKycSubmissions = (params?: {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const { data, error, isLoading, mutate, isValidating } = useSWR<{
    data: KycSubmissionRow[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>(`/api/partners/kyc-submissions?${qs.toString()}`, fetcher);

  return { data, error, isLoading, mutate, isValidating };
};

export const reviewKycSubmission = async (
  submissionId: string,
  decision: "approved" | "rejected",
  opts?: { rejectionReason?: string; adminNotes?: string },
): Promise<KycSubmissionRow> => {
  const res = await fetch(`/api/partners/kyc-submissions/${submissionId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, ...opts }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to submit review");
  }
  return res.json();
};

export const usePartnerLogs = (params?: {
  q?: string;
  entityType?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.entityType) qs.set("entityType", params.entityType);
  if (params?.action) qs.set("action", params.action);
  if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params?.dateTo) qs.set("dateTo", params.dateTo);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const { data, error, isLoading, mutate, isValidating } =
    useSWR<SystemLogsResponse>(
      `/api/partners/partner-logs?${qs.toString()}`,
      fetcher,
    );

  return { data, error, isLoading, mutate, isValidating };
};

export const useKycDocuments = (params?: {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
 
  const { data, error, isLoading, mutate, isValidating } =
    useSWR<KycDocumentsResponse>(
      `/api/partners/kyc-documents?${qs.toString()}`,
      fetcher,
    );
 
  return { data, error, isLoading, mutate, isValidating };
};

 
export const reviewKycDocument = async (
  documentId: string,
  decision: "accepted" | "rejected",
  opts?: { rejectionNote?: string },
): Promise<KycDocumentRow> => {
  const res = await fetch(`/api/partners/kyc-documents/${documentId}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, ...opts }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to review document");
  }
  return res.json();
};


export const usePartnerAnalytics = () => {
  const { data, error, isLoading, mutate, isValidating } =
    useSWR<PartnerAnalytics>("/api/partners/partner-analytics", fetcher, {
      revalidateOnFocus: false,
      dedupingInterval: 60_000, // cache for 60s
    });
  return { data, error, isLoading, mutate, isValidating };
};
