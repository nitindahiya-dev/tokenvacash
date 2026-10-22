import { checkRateLimit, getClientIdentifier } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { createChallenge } from "@/lib/auth/challenge-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  address: z.string().min(32).max(44),
});

function getAllowedOrigin(request: Request): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  try {
    return configured
      ? new URL(configured).origin
      : new URL(request.url).origin;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "wallet-challenge",
      identifier: getClientIdentifier(request),
      limit: 10,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Request protection is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const allowedOrigin = getAllowedOrigin(request);

  if (!allowedOrigin || request.headers.get("origin") !== allowedOrigin) {
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "A valid Solana wallet address is required." },
      { status: 400 },
    );
  }

  let address: string;

  try {
    address = new PublicKey(parsed.data.address).toBase58();

    if (address !== parsed.data.address) {
      throw new Error("Non-canonical address");
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid Solana wallet address." },
      { status: 400 },
    );
  }

  try {
    const challenge = await createChallenge(address, allowedOrigin);

    return NextResponse.json(
      {
        nonce: challenge.nonce,
        message: challenge.message,
        expiresAt: challenge.expiresAt,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to create a wallet challenge. Check database configuration." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
