import type { createClient } from "./server";

// Admin gate for the dev/test utilities surface (`/dev/admin`).
//
// A user is an admin only when their `profiles.is_admin` flag is true (set in the
// database — Supabase Studio / SQL — never from the app; a BEFORE UPDATE trigger
// blocks client self-escalation, see migration 20260630040622). This is the
// single read both the gated page and the sidebar link consult. Defensive: any
// error / missing row resolves to `false` (deny), never a throw into a render.

/** The server Supabase client (exactly what `createClient` returns). */
type ServerClient = Awaited<ReturnType<typeof createClient>>;

/** Whether the given user is flagged as an admin in `profiles`. */
export async function isAdmin(supabase: ServerClient, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return false;
    return (data as { is_admin?: boolean }).is_admin === true;
  } catch {
    return false;
  }
}
