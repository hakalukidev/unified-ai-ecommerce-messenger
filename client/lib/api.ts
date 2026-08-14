import { clearAuthToken, getAuthToken } from "@/lib/auth";
import { env } from "@/lib/env";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type ErrorResponse = {
  message?: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";

  if (response.status === 204) {
    return undefined;
  }

  if (contentType.includes("application/json")) {
    return (await response.json()) as unknown;
  }

  return await response.text();
};

const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

const shouldSkipNgrokWarning = env.apiBaseUrl.includes(".ngrok-free.");

const request = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (shouldSkipNgrokWarning) {
    headers.set("ngrok-skip-browser-warning", "true");
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      redirectToLogin();
    }

    const message =
      typeof data === "string"
        ? data
        : (data as ErrorResponse | undefined)?.message ??
          `Request failed with ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
};

const requestForm = async <T>(
  path: string,
  form: FormData,
): Promise<T> => {
  const headers = new Headers();
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (shouldSkipNgrokWarning) {
    headers.set("ngrok-skip-browser-warning", "true");
  }

  // Don't set Content-Type ourselves — the browser needs to add the
  // multipart boundary when sending a FormData body.
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: "POST",
    headers,
    body: form,
    cache: "no-store",
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      redirectToLogin();
    }

    const message =
      typeof data === "string"
        ? data
        : (data as ErrorResponse | undefined)?.message ??
          `Request failed with ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
};

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  postForm: <T>(path: string, form: FormData) => requestForm<T>(path, form),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
