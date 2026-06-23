"use client";

import { useCallback, useEffect, useState } from "react";

import { createBrowserClientSafe, createClient } from "@/lib/supabase/client";
import {
  composeMessage,
  fetchLocationMessages,
  placeMessage,
  rateMessage,
  selectMessagesForScene,
  MESSAGE_TEMPLATES,
  type WorldMessage,
  type WorldMessagesClient,
} from "@/lib/game";

// Shared world messages (issue #17): notes from other timelines, surfaced
// subtly at the current location. Best-effort networking — the scene never
// waits on it, and a signed-out or offline player simply sees nothing.

const client = (): WorldMessagesClient | null =>
  createBrowserClientSafe<WorldMessagesClient>();

export function WorldMessages({ location }: { location: string }) {
  const [messages, setMessages] = useState<WorldMessage[]>([]);
  const [rated, setRated] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [templateId, setTemplateId] = useState(MESSAGE_TEMPLATES[0].id);
  const [fills, setFills] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = client();
      if (!supabase) return;
      try {
        const found = await fetchLocationMessages(supabase, location);
        if (!cancelled) setMessages(selectMessagesForScene(found));
      } catch {
        // Offline or signed out — the fog keeps its silence.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location]);

  const handleRate = useCallback((messageId: string, helpful: boolean) => {
    setRated((prev) => ({ ...prev, [messageId]: true }));
    void (async () => {
      const supabase = client();
      if (!supabase) return;
      try {
        await rateMessage(supabase, messageId, helpful);
      } catch {
        // Best-effort.
      }
    })();
  }, []);

  const template = MESSAGE_TEMPLATES.find((t) => t.id === templateId)!;
  const slots = Object.entries(template.slots);
  const complete = slots.every(([slot]) => fills[slot]);

  const handlePlace = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      let text: string;
      try {
        text = composeMessage(templateId, fills);
      } catch {
        return;
      }
      setPlaced(true);
      setShowForm(false);
      void (async () => {
        const supabase = client();
        if (!supabase) return;
        try {
          const { data } = await (
            supabase as unknown as ReturnType<typeof createClient>
          ).auth.getUser();
          if (!data.user) return;
          await placeMessage(supabase, data.user.id, {
            location,
            templateId,
            fills,
            text,
          });
        } catch {
          // Best-effort.
        }
      })();
    },
    [templateId, fills, location],
  );

  return (
    <aside aria-label="Messages from other timelines" className="mt-8">
      {messages.length > 0 && (
        <ul className="space-y-2">
          {messages.map((message) => (
            <li
              key={message.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-occult/20 bg-surface px-5 py-3.5"
            >
              <p className="font-serif text-sm italic text-occult-bright">
                <span aria-hidden="true" className="candle-flicker mr-2">
                  ✧
                </span>
                &ldquo;{message.text}&rdquo;
                <span className="ml-2 text-xs not-italic text-muted">
                  — another timeline
                </span>
              </p>
              {rated[message.id] ? (
                <span className="text-xs text-muted">The fog takes note.</span>
              ) : (
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRate(message.id, true)}
                    className="min-h-[24px] rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-amber transition-colors hover:border-amber/40"
                  >
                    Helpful
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRate(message.id, false)}
                    className="min-h-[24px] rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
                  >
                    Unhelpful
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {placed ? (
        <p role="status" className="mt-3 text-xs italic text-muted">
          Your words sink into the stone, waiting for another walker.
        </p>
      ) : showForm ? (
        <form onSubmit={handlePlace} className="mt-3 space-y-2">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0">
              <label htmlFor="message-template" className="mb-1 block text-xs text-muted">
                Leave a message
              </label>
              <select
                id="message-template"
                value={templateId}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  setFills({});
                }}
                className="max-w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
              >
                {MESSAGE_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.text}
                  </option>
                ))}
              </select>
            </div>
            {slots.map(([slot, options]) => (
              <div key={slot} className="min-w-0">
                <label
                  htmlFor={`message-slot-${slot}`}
                  className="mb-1 block text-xs text-muted"
                >
                  {slot}
                </label>
                <select
                  id={`message-slot-${slot}`}
                  value={fills[slot] ?? ""}
                  onChange={(e) => setFills((f) => ({ ...f, [slot]: e.target.value }))}
                  className="max-w-full rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                >
                  <option value="">choose…</option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="submit"
              disabled={!complete}
              className="rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Inscribe
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="min-h-[24px] rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-amber/40 hover:text-amber"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-3 min-h-[24px] rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-occult-bright"
        >
          <span aria-hidden="true">✧ </span>Leave a message for other timelines
        </button>
      )}
    </aside>
  );
}
