import "server-only";
import { z } from "zod";

const DEFAULT_DEVNET_URL = "https://devnet.multihopper.com";
const DEFAULT_PRODUCTION_URL = "https://multihopper.com";

const estimateResponseSchema = z
  .object({
    tier: z.string(),
    percentFeeBps: z.number().finite().nonnegative(),
    totalFlatFeeLamports: z.number().finite().nonnegative(),
    usdEquivalent: z.number().finite().nonnegative(),
  })
  .passthrough();

export type MultiHopperEstimate = z.infer<typeof estimateResponseSchema>;

export class MultiHopperError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "MultiHopperError";
  }
}

function getConfiguration() {
  const apiKey = process.env.MULTIHOPPER_API_KEY?.trim();
  const configuredUrl = process.env.MULTIHOPPER_API_BASE_URL?.trim();
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

  if (!apiKey) {
    throw new MultiHopperError(
      "MultiHopper API credentials are not configured.",
      503,
    );
  }

  const baseUrl =
    configuredUrl ||
    (network === "mainnet-beta"
      ? DEFAULT_PRODUCTION_URL
      : DEFAULT_DEVNET_URL);

  let url: URL;

  try {
    url = new URL(baseUrl);
  } catch {
    throw new MultiHopperError(
      "The MultiHopper API base URL is invalid.",
      500,
    );
  }

  if (
    url.protocol !== "https:" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1"
  ) {
    throw new MultiHopperError(
      "The MultiHopper API must use HTTPS.",
      500,
    );
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new MultiHopperError(
      "The MultiHopper API base URL contains unsupported URL components.",
      500,
    );
  }

  // Accept either the host root or a base URL ending in /api/v1.
  let pathname = url.pathname.replace(/\/+$/, "");
  if (pathname.endsWith("/api/v1")) {
    pathname = pathname.slice(0, -"/api/v1".length);
  }

  if (pathname && pathname !== "/") {
    throw new MultiHopperError(
      "Use the MultiHopper host URL or its /api/v1 base URL.",
      500,
    );
  }

  const normalizedBaseUrl = `${url.origin}/api/v1`;

  return { apiKey, baseUrl: normalizedBaseUrl };
}

export async function estimateMultiHopperTransfer(input: {
  tokenMint: string;
  amountRaw: string;
  tokenDecimals: number;
  hops: number;
}): Promise<MultiHopperEstimate> {
  const { apiKey, baseUrl } = getConfiguration();

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/transfers/estimate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new MultiHopperError(
      "Unable to reach MultiHopper. Please try again.",
      502,
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new MultiHopperError(
        "MultiHopper rejected the configured credentials.",
        502,
      );
    }

    if (response.status === 429) {
      throw new MultiHopperError(
        "MultiHopper rate limit reached. Please retry later.",
        429,
      );
    }

    if (response.status >= 500) {
      throw new MultiHopperError(
        "MultiHopper is temporarily unavailable.",
        502,
      );
    }

    throw new MultiHopperError(
      "MultiHopper rejected the quote request. Check the asset and transfer parameters.",
      422,
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new MultiHopperError(
      "MultiHopper returned invalid JSON.",
      502,
    );
  }

  const parsed = estimateResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new MultiHopperError(
      "MultiHopper returned an unexpected quote response.",
      502,
    );
  }

  return parsed.data;
}

export async function createMultiHopperTransfer(input: {
  tokenMint: string;
  amountRaw: string;
  amountTokens: string;
  tokenDecimals: number;
  tokenSymbol: string;
  sourceOwner: string;
  recipientWallet: string;
  hops: number;
  arrivalSeconds: number;
  externalId?: string;
}) {
  const { apiKey, baseUrl } = getConfiguration();

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/transfers`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new MultiHopperError(
      "Unable to reach MultiHopper. Please try again.",
      502,
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new MultiHopperError(
        "MultiHopper rejected the configured credentials.",
        502,
      );
    }

    if (response.status === 429) {
      throw new MultiHopperError(
        "MultiHopper rate limit reached. Please retry later.",
        429,
      );
    }

    if (response.status >= 500) {
      throw new MultiHopperError(
        "MultiHopper is temporarily unavailable.",
        502,
      );
    }

    throw new MultiHopperError(
      "MultiHopper rejected the transfer request. Check the asset, wallets, and route parameters.",
      422,
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new MultiHopperError(
      "MultiHopper returned invalid JSON.",
      502,
    );
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new MultiHopperError(
      "MultiHopper returned an unexpected transfer response.",
      502,
    );
  }

  return payload as Record<string, unknown>;
}

export async function prepareMultiHopperTransfer(transferId: string) {
  const { apiKey, baseUrl } = getConfiguration();

  let response: Response;

  try {
    response = await fetch(
      `${baseUrl}/transfers/${encodeURIComponent(transferId)}/prepare`,
      {
        method: "POST",
        headers: { "x-api-key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    throw new MultiHopperError(
      "Unable to reach MultiHopper. Please try again.",
      502,
    );
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new MultiHopperError(
        "MultiHopper rejected the configured credentials.",
        502,
      );
    }

    if (response.status === 429) {
      throw new MultiHopperError(
        "MultiHopper rate limit reached. Please retry later.",
        429,
      );
    }

    if (response.status >= 500) {
      throw new MultiHopperError(
        "MultiHopper is temporarily unavailable.",
        502,
      );
    }

    throw new MultiHopperError(
      "MultiHopper could not prepare this transfer.",
      422,
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new MultiHopperError(
      "MultiHopper returned invalid JSON.",
      502,
    );
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw new MultiHopperError(
      "MultiHopper returned an unexpected preparation response.",
      502,
    );
  }

  return payload as Record<string, unknown>;
}
