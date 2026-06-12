import type { Database, Json } from "@/lib/types/database";

import type { WorldMessage } from "./world-messages";

// Supabase glue for shared world messages (issue #17), over a minimal
// structural client (mirrors journal-sync.ts). Best-effort from the UI —
// the scene never blocks on the network.

type MessageRow = Database["public"]["Tables"]["world_messages"]["Row"];
type MessageInsert = Database["public"]["Tables"]["world_messages"]["Insert"];

export interface WorldMessagesClient {
  from(table: "world_messages"): {
    select(columns: string): {
      eq(
        column: "location",
        value: string,
      ): {
        limit(count: number): PromiseLike<{
          data: MessageRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
    insert(rows: MessageInsert[]): PromiseLike<{ error: { message: string } | null }>;
  };
  rpc(
    fn: "rate_world_message",
    args: { p_message_id: string; p_helpful: boolean },
  ): PromiseLike<{ error: { message: string } | null }>;
}

/** Fetch a location's messages (the scene samples from these client-side). */
export async function fetchLocationMessages(
  client: WorldMessagesClient,
  location: string,
  limit: number = 20,
): Promise<WorldMessage[]> {
  const { data, error } = await client
    .from("world_messages")
    .select("id, location, template_id, text, helpful, unhelpful")
    .eq("location", location)
    .limit(limit);
  if (error) throw new Error(`Fetching messages failed: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    location: row.location,
    templateId: row.template_id,
    text: row.text,
    helpful: row.helpful,
    unhelpful: row.unhelpful,
  }));
}

/** Leave a composed message at a location. */
export async function placeMessage(
  client: WorldMessagesClient,
  userId: string,
  args: {
    location: string;
    templateId: string;
    fills: Record<string, string>;
    text: string;
  },
): Promise<void> {
  const { error } = await client.from("world_messages").insert([
    {
      user_id: userId,
      location: args.location,
      template_id: args.templateId,
      fills: args.fills as Json,
      text: args.text,
    },
  ]);
  if (error) throw new Error(`Leaving the message failed: ${error.message}`);
}

/** Rate a discovered message (one vote per player; repeats are no-ops). */
export async function rateMessage(
  client: WorldMessagesClient,
  messageId: string,
  helpful: boolean,
): Promise<void> {
  const { error } = await client.rpc("rate_world_message", {
    p_message_id: messageId,
    p_helpful: helpful,
  });
  if (error) throw new Error(`Rating failed: ${error.message}`);
}
