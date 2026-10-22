import { NextRequest, NextResponse } from "next/server";
import {
  readSessionToken,
  revokeSessionToken,
  SESSION_COOKIE,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function allowedOrigin(request: NextRequest): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  try {
    return configured
      ? new URL(configured).origin
      : new URL(request.url).origin;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;

  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      address: session.address,
      expiresAt: new Date(session.expiresAt * 1000).toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  const origin = allowedOrigin(request);

  if (!origin || request.headers.get("origin") !== origin) {
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 },
    );
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  try {
    if (token) {
      await revokeSessionToken(token);
    }

    const response = NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } },
    );

    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to revoke the session. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
