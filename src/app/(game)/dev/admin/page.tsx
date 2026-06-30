import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminToolsPanel } from "@/components/game/admin-tools-panel";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Dev Admin" };

// Admin-only dev/test utilities. The (game) layout already redirects an
// unauthenticated user; this page is the extra gate — a non-admin gets a 404 so
// the surface doesn't even acknowledge its own existence.
export default async function DevAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(supabase, user.id))) {
    notFound();
  }

  return <AdminToolsPanel />;
}
