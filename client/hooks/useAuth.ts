"use client";

import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/auth";
import { authService } from "@/services/auth";
import type { SellerSession } from "@/types";
import { useEffect, useState } from "react";

export function useAuth() {
  const [seller, setSeller] = useState<SellerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSeller = async () => {
      if (!getAuthToken()) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const nextSeller = await authService.me();

        if (active) {
          setSeller(nextSeller);
        }
      } catch {
        clearAuthToken();

        if (active) {
          setSeller(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSeller();

    return () => {
      active = false;
    };
  }, []);

  const login = async (sellerId: string) => {
    const response = await authService.login(sellerId);
    setAuthToken(response.token);
    setSeller({ seller_id: response.seller_id });
    return response;
  };

  const logout = () => {
    clearAuthToken();
    setSeller(null);
  };

  return {
    seller,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(seller),
  };
}
