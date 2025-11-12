// Cloudflare Pages Functions Environment Types

export interface Env {
  DB: D1Database;
  AI_API_URL?: string;
  AI_API_KEY?: string;
  AVATAR_API_URL?: string;
  AVATAR_API_KEY?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

// Helper function to create JSON responses
export function jsonResponse<T>(
  data: ApiResponse<T>,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      // Same-origin deployment on Cloudflare Pages - no CORS needed
    },
  });
}

// Helper to handle CORS preflight (for same-origin, minimal headers)
export function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
