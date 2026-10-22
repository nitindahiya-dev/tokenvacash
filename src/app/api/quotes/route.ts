import { checkRateLimit, getClientIdentifier } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  estimateMultiHopperTransfer,
  MultiHopperError,
} from "@/lib/multihopper/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const quoteSchema = z
  .object({
    tokenMint: z.string().trim().min(32).max(44),
    amount: z
      .string()
      .trim()
      .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/, "Enter a valid amount."),
    tokenDecimals: z.number().int().min(0).max(18),
    hops: z.number().int().positive(),
  })
  .strict();

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

export async function POST(request: Request) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "quote-estimate",
      identifier: getClientIdentifier(request),
      limit: 30,
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

  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid quote parameters.",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  let amountRaw: string;

  try {
    amountRaw = toRawAmount(
      parsed.data.amount,
      parsed.data.tokenDecimals,
    );
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
    const quote = await estimateMultiHopperTransfer({
      tokenMint: parsed.data.tokenMint,
      amountRaw,
      tokenDecimals: parsed.data.tokenDecimals,
      hops: parsed.data.hops,
    });

    return NextResponse.json(
      { quote },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof MultiHopperError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Unable to estimate this transfer." },
      { status: 500 },
    );
  }
}
