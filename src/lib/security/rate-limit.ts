import "server-only";

import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function checkRateLimit(input: {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { scope, identifier, limit, windowSeconds } = input;

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds < 1
  ) {
    throw new Error("Invalid rate-limit configuration.");
  }

  const key = createHash("sha256")
    .update(`${scope}:${identifier}`)
    .digest("hex");

  const db = getDb();

  // Opportunistically remove inactive keys without adding a cleanup
  // query to every request. Cleanup failure must not bypass rate limiting.
  if (Math.random() < 0.01) {
    try {
      await db`
        delete from public.api_rate_limits
        where updated_at < now() - interval '24 hours'
      `;
    } catch {
      // A failed cleanup does not affect the actual rate-limit decision.
    }
  }

  const rows = await db<
    { allowed: boolean; remaining: number; retry_after: number }[]
  >`
    INSERT INTO public.api_rate_limits AS current_limit
      (rate_key, window_started_at, request_count, updated_at)
    VALUES
      (
        ${key},
        now(),
        1,
        now()
      )
    ON CONFLICT (rate_key) DO UPDATE
    SET
      window_started_at = CASE
        WHEN current_limit.window_started_at
          <= now() - (${windowSeconds} * interval '1 second')
        THEN now()
        ELSE current_limit.window_started_at
      END,
      request_count = CASE
        WHEN current_limit.window_started_at
          <= now() - (${windowSeconds} * interval '1 second')
        THEN 1
        ELSE current_limit.request_count + 1
      END,
      updated_at = now()
    RETURNING
      request_count <= ${limit} AS allowed,
      GREATEST(0, ${limit} - request_count)::integer AS remaining,
      GREATEST(
        1,
        CEIL(
          EXTRACT(
            EPOCH FROM (
              window_started_at
              + (${windowSeconds} * interval '1 second')
              - now()
            )
          )
        )
      )::integer AS retry_after
  `;

  const row = rows[0];

  if (!row) {
    throw new Error("Rate limiter returned no result.");
  }

  return {
    allowed: row.allowed,
    remaining: row.remaining,
    retryAfterSeconds: row.retry_after,
  };
}

export function getClientIdentifier(request: Request): string {
  // Prefer the reverse-proxy client IP headers used by the hosting platform.
  const realIp = request.headers.get("x-real-ip")?.trim();

  if (realIp && realIp.length <= 100) {
    return realIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  if (firstForwardedIp && firstForwardedIp.length <= 100) {
    return firstForwardedIp;
  }

  return "unknown-client";
}
