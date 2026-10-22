import "server-only";

import { getDb } from "@/lib/db";

export async function registerTransferOwner(
  transferId: string,
  address: string,
): Promise<void> {
  const db = getDb();

  await db`
    insert into public.transfer_ownership
      (transfer_id, wallet_address)
    values
      (${transferId}, ${address})
    on conflict (transfer_id) do nothing
  `;

  const rows = await db<{ wallet_address: string }[]>`
    select wallet_address
    from public.transfer_ownership
    where transfer_id = ${transferId}
    limit 1
  `;

  if (!rows[0] || rows[0].wallet_address !== address) {
    throw new Error("Transfer ID is already registered to another wallet.");
  }
}

export async function isTransferOwnedBy(
  transferId: string,
  address: string,
): Promise<boolean> {
  const db = getDb();

  const rows = await db<{ transfer_id: string }[]>`
    select transfer_id
    from public.transfer_ownership
    where transfer_id = ${transferId}
      and wallet_address = ${address}
    limit 1
  `;

  return rows.length === 1;
}
