const DEFAULT_API_BASE = import.meta.env.DEV ? "/api" : "/.netlify/functions/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getApiBaseUrl() {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_DEV_API_BASE_URL || "/api";
  }

  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      0,
      "API unavailable. Start the local Prisma API together with Vite.",
    );
  }

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
