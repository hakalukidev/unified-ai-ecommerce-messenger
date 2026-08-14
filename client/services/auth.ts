import { apiClient } from "@/lib/api";
import type {
  AuthResponse,
  FacebookPagesLoginConfig,
  FacebookPagesLoginStartResponse,
  InstagramBusinessLoginConfig,
  InstagramBusinessLoginStartResponse,
  SellerSession,
} from "@/types";

export const authService = {
  login: (sellerId: string) =>
    apiClient.post<AuthResponse>("/auth/login", {
      seller_id: sellerId,
    }),
  me: () => apiClient.get<SellerSession>("/auth/me"),
  getFacebookPagesLogin: () =>
    apiClient.get<FacebookPagesLoginConfig>("/auth/facebook/pages-login"),
  startFacebookPagesLogin: () =>
    apiClient.get<FacebookPagesLoginStartResponse>(
      "/auth/facebook/pages-login/start",
    ),
  getInstagramBusinessLogin: () =>
    apiClient.get<InstagramBusinessLoginConfig>("/auth/instagram/business-login"),
  startInstagramBusinessLogin: () =>
    apiClient.get<InstagramBusinessLoginStartResponse>(
      "/auth/instagram/business-login/start",
    ),
};
