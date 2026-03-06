// ============================================
// DebugInit — Initializes the F12 debug toolkit
// Renders nothing visible. Runs debug.init() on
// mount to install console commands and fetch
// interceptor. Safe in production — only logs
// when explicitly enabled.
// ============================================

"use client";

import { useEffect } from "react";
import { debug } from "@/lib/debug";

export default function DebugInit() {
  useEffect(() => {
    debug.init();
  }, []);

  return null;
}
