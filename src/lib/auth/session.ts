import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";

export const SESSION_COOKIE = "tokencash_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type WalletSession = {
  address: string;
  expiresAt: number;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createSessionToken(address: string): Promise<string> {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await db`
    insert into public.wallet_sessions
      (session_token_hash, wallet_address, expires_at)
    values
      (${tokenHash}, ${address}, ${expiresAt.toISOString()})
  `;

  return token;
}

export async function readSessionToken(
  token: string,
): Promise<WalletSession | null> {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) {
    return null;
  }

  const db = getDb();
  const tokenHash = hashToken(token);

  const rows = await db<
    { address: string; expiresAt: Date | string }[]
  >`
    select
      wallet_address as address,
      expires_at as "expiresAt"
    from public.wallet_sessions
    where session_token_hash = ${tokenHash}
      and revoked_at is null
      and expires_at > now()
    limit 1
  `;

  const session = rows[0];
  if (!session) return null;

  return {
    address: session.address,
    expiresAt: Math.floor(new Date(session.expiresAt).getTime() / 1000),
  };
}

export async function revokeSessionToken(token: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) {
    return;
  }

  const db = getDb();
  const tokenHash = hashToken(token);

  await db`
    update public.wallet_sessions
    set revoked_at = now()
    where session_token_hash = ${tokenHash}
      and revoked_at is null
  `;
}
