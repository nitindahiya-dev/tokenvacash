import { checkRateLimit, getClientIdentifier } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { z } from "zod";
import {
  consumeChallenge,
  getChallenge,
} from "@/lib/auth/challenge-store";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  address: z.string().min(32).max(44),
  nonce: z.string().regex(/^[a-f0-9]{64}$/),
  signature: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "wallet-verify",
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

  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  let allowedOrigin: string;

  try {
    allowedOrigin = configuredOrigin
      ? new URL(configuredOrigin).origin
      : new URL(request.url).origin;
  } catch {
    return NextResponse.json(
      { error: "Application origin configuration is invalid." },
      { status: 500 },
    );
  }

  if (request.headers.get("origin") !== allowedOrigin) {
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
      { error: "Invalid authentication payload." },
      { status: 400 },
    );
  }

  const { address, nonce, signature } = parsed.data;
  let publicKey: PublicKey;
  let signatureBytes: Buffer;

  try {
    publicKey = new PublicKey(address);

    if (publicKey.toBase58() !== address) {
      throw new Error("Non-canonical address");
    }

    signatureBytes = Buffer.from(signature, "base64");

    if (
      signatureBytes.length !== 64 ||
      signatureBytes.toString("base64") !== signature
    ) {
      throw new Error("Invalid signature encoding");
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid wallet address or signature encoding." },
      { status: 400 },
    );
  }

  try {
    const challenge = await getChallenge(nonce, address);

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge is invalid, expired, or already used. Request a new one." },
        { status: 401 },
      );
    }

    const valid = nacl.sign.detached.verify(
      Buffer.from(challenge.message, "utf8"),
      signatureBytes,
      publicKey.toBytes(),
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Wallet signature verification failed." },
        { status: 401 },
      );
    }

    // Only one concurrent verification can consume the challenge.
    const consumed = await consumeChallenge(nonce, address);

    if (!consumed) {
      return NextResponse.json(
        { error: "Challenge was already used. Request a new one." },
        { status: 401 },
      );
    }

    const token = await createSessionToken(address);
    const response = NextResponse.json({
      authenticated: true,
      address,
      expiresIn: SESSION_TTL_SECONDS,
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Authentication storage is unavailable. Check database configuration." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
