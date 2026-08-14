import { apiClient } from "@/lib/api";
import type {
  AccountRecord,
  NewAccountInput,
  UpdateAccountInput,
} from "@/types";

export const accountService = {
  list: () => apiClient.get<AccountRecord[]>("/accounts"),
  create: (payload: NewAccountInput) =>
    apiClient.post<AccountRecord>("/accounts", payload),
  update: (accountId: string, payload: UpdateAccountInput) =>
    apiClient.patch<AccountRecord>(`/accounts/${accountId}`, payload),
  remove: (accountId: string) => apiClient.delete<void>(`/accounts/${accountId}`),
};
