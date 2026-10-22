import { checkRateLimit, getClientIdentifier } from "@/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  MultiHopperError,
  prepareMultiHopperTransfer,
} from "@/lib/multihopper/client";
import {
  readSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import { isTransferOwnedBy } from "@/lib/auth/transfer-ownership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const transferIdSchema = z.string().trim().min(1).max(128);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "transfer-prepare",
      identifier: getClientIdentifier(request),
      limit: 10,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many preparation requests. Please try again shortly." },
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
      { error: "Authenticate your wallet before preparing transfers." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const parsedId = transferIdSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json(
      { error: "A valid transfer ID is required." },
      { status: 400 },
    );
  }

  if (!isTransferOwnedBy(parsedId.data, session.address)) {
    return NextResponse.json(
      {
        error:
          "Transfer ownership could not be verified. Create or retrieve the transfer through an authenticated, persistent record.",
      },
      { status: 404 },
    );
  }

  try {
    const preparation = await prepareMultiHopperTransfer(parsedId.data);

    return NextResponse.json(
      { preparation },
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
      { error: "Unable to prepare this transfer." },
      { status: 500 },
    );
  }
}
