import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type RateLimitOptions = {
  scope: string;
  identifier: string;
  maxRequests: number;
  windowMs: number;
};

export type RateLimitResult = {
  limited: boolean;
  retryAfterSeconds: number;
  requestCount: number;
  source: "memory" | "supabase";
};

type RateLimitRpcResult = {
  allowed?: boolean;
  request_count?: number;
  retry_after_seconds?: number;
};

let cachedServiceClient: SupabaseClient | null = null;
const fallbackRequests = new Map<string, number[]>();

export function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

export function getServiceSupabaseClient(): SupabaseClient | null {
  if (cachedServiceClient) {
    return cachedServiceClient;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  cachedServiceClient = createClient(supabaseUrl, supabaseKey);
  return cachedServiceClient;
}

function checkMemoryRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${options.scope}:${options.identifier}`;
  const recentRequests = (fallbackRequests.get(bucketKey) || []).filter(
    (timestamp) => now - timestamp < options.windowMs,
  );
  recentRequests.push(now);
  fallbackRequests.set(bucketKey, recentRequests);

  return {
    limited: recentRequests.length > options.maxRequests,
    retryAfterSeconds: Math.max(1, Math.ceil(options.windowMs / 1000)),
    requestCount: recentRequests.length,
    source: "memory",
  };
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const normalizedIdentifier = options.identifier.trim();
  if (!normalizedIdentifier || normalizedIdentifier === "unknown") {
    return checkMemoryRateLimit({ ...options, identifier: normalizedIdentifier || "unknown" });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return checkMemoryRateLimit({ ...options, identifier: normalizedIdentifier });
  }

  try {
    const { data, error } = await supabase.rpc("enforce_rate_limit", {
      p_scope: options.scope,
      p_identifier: normalizedIdentifier,
      p_window_seconds: Math.ceil(options.windowMs / 1000),
      p_max_requests: options.maxRequests,
    });

    if (error) {
      console.error("Distributed rate limiting failed, using memory fallback:", error);
      return checkMemoryRateLimit({ ...options, identifier: normalizedIdentifier });
    }

    const result = (data ?? {}) as RateLimitRpcResult;
    return {
      limited: result.allowed === false,
      retryAfterSeconds: Math.max(1, Number(result.retry_after_seconds ?? 60)),
      requestCount: Number(result.request_count ?? 1),
      source: "supabase",
    };
  } catch (error) {
    console.error("Distributed rate limiting threw, using memory fallback:", error);
    return checkMemoryRateLimit({ ...options, identifier: normalizedIdentifier });
  }
}