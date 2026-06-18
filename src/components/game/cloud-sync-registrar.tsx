"use client";

import { useEffect } from "react";

import { startCloudSync } from "./cloud-sync";

/**
 * Starts cross-device cloud sync once for the authenticated game session
 * (cross-device sync): registers the session-store sink so every save mirrors to
 * Supabase, and runs the initial hydrate that reconciles the local cache with
 * the cloud. Mounted once in the game layout; renders nothing. Idempotent.
 */
export function CloudSyncRegistrar() {
  useEffect(() => {
    startCloudSync();
  }, []);
  return null;
}
