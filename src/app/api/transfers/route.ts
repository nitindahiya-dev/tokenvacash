import { checkRateLimit, getClientIdentifier } from "@/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import {
  createMultiHopperTransfer,
  MultiHopperError,
} from "@/lib/multihopper/client";
import {
  readSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { registerTransferOwner } from "@/lib/auth/transfer-ownership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const transferSchema = z
  .object({
    tokenMint: z.string().trim().min(32).max(44),
    amount: z
      .string()
      .trim()
      .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/, "Enter a valid amount."),
    tokenDecimals: z.number().int().min(0).max(18),
    tokenSymbol: z.string().trim().min(1).max(20),
    sourceOwner: z.string().trim().min(32).max(44),
    recipientWallet: z.string().trim().min(32).max(44),
    hops: z.number().int().positive(),
    arrivalSeconds: z.number().int().positive(),
    externalId: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

function isSolanaPublicKey(value: string): boolean {
  try {
    return new PublicKey(value).toBase58() === value;
  } catch {
    return false;
  }
}

function toRawAmount(amount: string, decimals: number): string {
  const [whole, fraction = ""] = amount.split(".");

  if (fraction.length > decimals) {
    throw new Error(
      `This asset supports at most ${decimals} decimal places.`,
    );
  }

  const scale = 10n ** BigInt(decimals);
  const fractionalUnits = BigInt(fraction.padEnd(decimals, "0") || "0");
  const raw = BigInt(whole) * scale + fractionalUnits;

  if (raw <= 0n) {
    throw new Error("Amount must be greater than zero.");
  }

  return raw.toString();
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "transfer-create",
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

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;

  if (!session) {
    return NextResponse.json(
      { error: "Authenticate your Solana wallet before creating transfers." },
      { status: 401 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json." },
      { status: 415 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must contain valid JSON." },
      { status: 400 },
    );
  }

  const parsed = transferSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid transfer parameters.",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;

  for (const [field, value] of [
    ["tokenMint", input.tokenMint],
    ["sourceOwner", input.sourceOwner],
    ["recipientWallet", input.recipientWallet],
  ] as const) {
    if (!isSolanaPublicKey(value)) {
      return NextResponse.json(
        { error: `${field} must be a valid Solana public key.` },
        { status: 400 },
      );
    }
  }

  if (input.sourceOwner !== session.address) {
    return NextResponse.json(
      { error: "Sender wallet does not match the authenticated wallet." },
      { status: 403 },
    );
  }

  if (input.sourceOwner === input.recipientWallet) {
    return NextResponse.json(
      { error: "Sender and recipient wallets must be different." },
      { status: 400 },
    );
  }

  let amountRaw: string;

  try {
    amountRaw = toRawAmount(input.amount, input.tokenDecimals);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid token amount.",
      },
      { status: 400 },
    );
  }

  try {
    const transfer = await createMultiHopperTransfer({
      tokenMint: input.tokenMint,
      amountRaw,
      amountTokens: input.amount,
      tokenDecimals: input.tokenDecimals,
      tokenSymbol: input.tokenSymbol,
      sourceOwner: session.address,
      recipientWallet: input.recipientWallet,
      hops: input.hops,
      arrivalSeconds: input.arrivalSeconds,
      ...(input.externalId ? { externalId: input.externalId } : {}),
    });

    const transferId =
      typeof transfer.id === "string" ? transfer.id : null;

    if (transferId) {
      try {
        await registerTransferOwner(transferId, session.address);
      } catch {
        return NextResponse.json(
          {
            error:
              "The transfer was created, but its temporary ownership record could not be saved. Do not retry blindly; inspect the provider transfer first.",
            transferId,
          },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      { transfer },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    if (error instanceof MultiHopperError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Unable to create the transfer." },
      { status: 500 },
    );
  }
}
