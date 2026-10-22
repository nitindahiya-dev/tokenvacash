import "server-only";

import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export type WalletChallenge = {
  nonce: string;
  address: string;
  message: string;
  expiresAt: string;
};

export async function createChallenge(
  address: string,
  origin: string,
): Promise<WalletChallenge> {
  const db = getDb();
  const nonce = randomBytes(32).toString("hex");
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + CHALLENGE_TTL_MS);

  const message = [
    "TokenvaCash Wallet Authentication",
    "",
    "Sign this message to authenticate with TokenvaCash.",
    "This message does not authorize or execute a transaction.",
    "",
    `Wallet: ${address}`,
    `Origin: ${origin}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expiration Time: ${expiresAt.toISOString()}`,
  ].join("\n");

  await db`
    insert into public.wallet_auth_challenges
      (nonce, wallet_address, message, expires_at)
    values
      (${nonce}, ${address}, ${message}, ${expiresAt.toISOString()})
  `;

  return {
    nonce,
    address,
    message,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getChallenge(
  nonce: string,
  address: string,
): Promise<WalletChallenge | null> {
  const db = getDb();

  const rows = await db<WalletChallenge[]>`
    select
      nonce,
      wallet_address as address,
      message,
      expires_at as "expiresAt"
    from public.wallet_auth_challenges
    where nonce = ${nonce}
      and wallet_address = ${address}
      and consumed_at is null
      and expires_at > now()
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    ...row,
    expiresAt: new Date(row.expiresAt).toISOString(),
  };
}

export async function consumeChallenge(
  nonce: string,
  address: string,
): Promise<boolean> {
  const db = getDb();

  const rows = await db<{ nonce: string }[]>`
    update public.wallet_auth_challenges
    set consumed_at = now()
    where nonce = ${nonce}
      and wallet_address = ${address}
      and consumed_at is null
      and expires_at > now()
    returning nonce
  `;

  return rows.length === 1;
}
