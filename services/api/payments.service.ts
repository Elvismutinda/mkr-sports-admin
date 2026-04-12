import useSWR from "swr";
import { fetcher } from "../_fetcher";
import type {
  PaymentStatus,
  PaginatedResponse,
  AdminPaymentRow,
} from "../_types";

export const usePayments = (params?: {
  q?: string;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const { data, error, isLoading, mutate, isValidating } = useSWR<
    PaginatedResponse<AdminPaymentRow>
  >(`/api/admin/payments?${qs}`, fetcher);

  return { data, error, isLoading, mutate, isValidating };
};
