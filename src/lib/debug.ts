// ============================================
// ClassCiv Debug Toolkit — F12 Console Diagnostics
// 
// Provides rich, color-coded console logging for
// every major system: auth, API calls, Supabase
// realtime, epoch state, resource changes, and
// navigation. Enabled when NEXT_PUBLIC_DEBUG=true
// or by typing classciv.debug.enable() in the
// browser console.
//
// Usage in components:
//   import { debug } from "@/lib/debug";
//   debug.auth("Signed in", { userId, role });
//   debug.api("GET", "/api/games", 200, data);
//   debug.epoch("Step advanced", { from, to });
//
// Console commands (type in F12):
//   classciv.debug.enable()   — turn on all logging
//   classciv.debug.disable()  — turn off all logging
//   classciv.debug.status()   — show current app state
//   classciv.debug.auth()     — show auth state
//   classciv.debug.routes()   — list all app routes
//   classciv.debug.env()      — show env config (safe)
//   classciv.debug.help()     — show all commands
// ============================================

type DebugCategory =
  | "auth"
  | "api"
  | "epoch"
  | "realtime"
  | "resource"
  | "nav"
  | "middleware"
  | "error"
  | "supabase"
  | "render"
  | "state";

const CATEGORY_STYLES: Record<DebugCategory, { bg: string; fg: string; emoji: string }> = {
  auth:       { bg: "#4ade80", fg: "#000", emoji: "🔐" },
  api:        { bg: "#60a5fa", fg: "#000", emoji: "🌐" },
  epoch:      { bg: "#f59e0b", fg: "#000", emoji: "⏱️" },
  realtime:   { bg: "#a855f7", fg: "#fff", emoji: "📡" },
  resource:   { bg: "#22c55e", fg: "#000", emoji: "💰" },
  nav:        { bg: "#06b6d4", fg: "#000", emoji: "🧭" },
  middleware: { bg: "#ef4444", fg: "#fff", emoji: "🛡️" },
  error:      { bg: "#dc2626", fg: "#fff", emoji: "❌" },
  supabase:   { bg: "#3ecf8e", fg: "#000", emoji: "🗄️" },
  render:     { bg: "#6366f1", fg: "#fff", emoji: "🎨" },
  state:      { bg: "#ec4899", fg: "#fff", emoji: "📦" },
};

let debugEnabled =
  typeof window !== "undefined"
    ? localStorage.getItem("classciv_debug") === "true" ||
      (typeof process !== "undefined" &&
        process.env?.NEXT_PUBLIC_DEBUG === "true")
    : false;

function isEnabled(): boolean {
  return debugEnabled;
}

function log(category: DebugCategory, message: string, data?: unknown) {
  if (!isEnabled()) return;

  const style = CATEGORY_STYLES[category];
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });

  const prefix = `%c ${style.emoji} ${category.toUpperCase()} %c ${timestamp} %c ${message}`;
  const styles = [
    `background: ${style.bg}; color: ${style.fg}; padding: 2px 6px; border-radius: 3px; font-weight: bold;`,
    `color: #666; font-size: 10px;`,
    `color: #e5e5e5;`,
  ];

  if (data !== undefined) {
    console.log(prefix, ...styles, data);
  } else {
    console.log(prefix, ...styles);
  }
}

function logError(message: string, error?: unknown) {
  const style = CATEGORY_STYLES.error;
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });

  console.error(
    `%c ${style.emoji} ERROR %c ${timestamp} %c ${message}`,
    `background: ${style.bg}; color: ${style.fg}; padding: 2px 6px; border-radius: 3px; font-weight: bold;`,
    `color: #666; font-size: 10px;`,
    `color: #f87171;`,
    error ?? ""
  );
}

function logTable(category: DebugCategory, title: string, data: Record<string, unknown>[]) {
  if (!isEnabled()) return;
  const style = CATEGORY_STYLES[category];
  console.log(
    `%c ${style.emoji} ${category.toUpperCase()} %c ${title}`,
    `background: ${style.bg}; color: ${style.fg}; padding: 2px 6px; border-radius: 3px; font-weight: bold;`,
    `color: #e5e5e5; font-weight: bold;`
  );
  console.table(data);
}

function logGroup(category: DebugCategory, title: string, fn: () => void) {
  if (!isEnabled()) return;
  const style = CATEGORY_STYLES[category];
  console.groupCollapsed(
    `%c ${style.emoji} ${category.toUpperCase()} %c ${title}`,
    `background: ${style.bg}; color: ${style.fg}; padding: 2px 6px; border-radius: 3px; font-weight: bold;`,
    `color: #e5e5e5;`
  );
  fn();
  console.groupEnd();
}

// Wrap fetch to automatically log all API calls
function createTrackedFetch(): typeof fetch {
  const originalFetch = typeof window !== "undefined" ? window.fetch.bind(window) : fetch;

  return async function trackedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? "GET";
    const isApiCall = url.includes("/api/");

    if (!isApiCall || !isEnabled()) {
      return originalFetch(input, init);
    }

    const startTime = performance.now();
    log("api", `→ ${method} ${url}`);

    try {
      const response = await originalFetch(input, init);
      const duration = Math.round(performance.now() - startTime);
      const status = response.status;

      if (status >= 400) {
        // Clone to read body without consuming it
        const clone = response.clone();
        try {
          const errorBody = await clone.json();
          logError(`← ${method} ${url} [${status}] (${duration}ms)`, errorBody);
        } catch {
          logError(`← ${method} ${url} [${status}] (${duration}ms)`);
        }
      } else {
        log("api", `← ${method} ${url} [${status}] (${duration}ms)`);
      }

      return response;
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      logError(`✗ ${method} ${url} FAILED (${duration}ms)`, err);
      throw err;
    }
  };
}

// ============================================
// Public debug API — attached to window.classciv
// ============================================

interface ClassCivDebug {
  enable: () => void;
  disable: () => void;
  status: () => void;
  auth: () => void;
  routes: () => void;
  env: () => void;
  help: () => void;
  version: string;
}

function createConsoleAPI(): ClassCivDebug {
  return {
    version: "1.0.0",

    enable() {
      debugEnabled = true;
      localStorage.setItem("classciv_debug", "true");
      console.log(
        "%c🎮 ClassCiv Debug ENABLED %c Type classciv.debug.help() for commands",
        "background: #4ade80; color: #000; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;",
        "color: #999; font-size: 11px;"
      );
      // Install fetch interceptor
      if (typeof window !== "undefined") {
        window.fetch = createTrackedFetch();
      }
    },

    disable() {
      debugEnabled = false;
      localStorage.setItem("classciv_debug", "false");
      console.log(
        "%c🔇 ClassCiv Debug DISABLED",
        "background: #666; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
      );
    },

    status() {
      console.log(
        "%c📊 ClassCiv App Status",
        "background: #f59e0b; color: #000; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;"
      );
      console.log("  Debug enabled:", debugEnabled);
      console.log("  Current path:", window.location.pathname);
      console.log("  Full URL:", window.location.href);
      console.log("  User agent:", navigator.userAgent);
      console.log("  Timestamp:", new Date().toISOString());
      console.log("  localStorage keys:", Object.keys(localStorage).filter(k => k.startsWith("clerk") || k.startsWith("classciv") || k.startsWith("__clerk")));
    },

    auth() {
      console.log(
        "%c🔐 ClassCiv Auth State",
        "background: #4ade80; color: #000; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;"
      );
      // Check for Clerk session cookies
      const cookies = document.cookie.split(";").map(c => c.trim());
      const clerkCookies = cookies.filter(c => c.startsWith("__clerk") || c.startsWith("__session") || c.startsWith("__client"));
      console.log("  Clerk cookies found:", clerkCookies.length > 0 ? clerkCookies.map(c => c.split("=")[0]) : "NONE");
      // Check localStorage for Clerk data
      const clerkKeys = Object.keys(localStorage).filter(k => k.includes("clerk"));
      console.log("  Clerk localStorage keys:", clerkKeys.length > 0 ? clerkKeys : "NONE");
      // Check if Clerk object is on window
      const clerkLoaded = !!(window as unknown as Record<string, unknown>).Clerk;
      console.log("  Clerk JS loaded:", clerkLoaded);
      if (clerkLoaded) {
        const clerk = (window as unknown as Record<string, unknown>).Clerk as Record<string, unknown>;
        console.log("  Clerk user:", clerk.user ?? "not loaded");
        console.log("  Clerk session:", clerk.session ?? "not loaded");
      }
      // Try fetching current user info from our API
      fetch("/api/me/team")
        .then(r => r.json())
        .then(data => {
          console.log("  /api/me/team response:", data);
        })
        .catch(err => {
          console.log("  /api/me/team error:", err.message);
        });
    },

    routes() {
      console.log(
        "%c🗺️ ClassCiv Routes",
        "background: #06b6d4; color: #000; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;"
      );
      console.table([
        { path: "/", role: "public", description: "Landing page" },
        { path: "/sign-in", role: "public", description: "Clerk sign-in" },
        { path: "/dashboard", role: "student", description: "Student dashboard (teachers redirect to /dm)" },
        { path: "/dm", role: "teacher", description: "DM overview — game list" },
        { path: "/dm/setup", role: "teacher", description: "Create new game" },
        { path: "/dm/roster", role: "teacher", description: "Team & student management" },
        { path: "/dm/names", role: "teacher", description: "Approve civilization names" },
        { path: "/dm/game/[id]", role: "teacher", description: "Live game DM panel" },
        { path: "/projector", role: "public", description: "Classroom projector view" },
      ]);
    },

    env() {
      console.log(
        "%c⚙️ ClassCiv Environment",
        "background: #6366f1; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;"
      );
      const env = {
        CLERK_PK: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "SET (" + process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 20) + "...)" : "MISSING",
        CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "NOT SET",
        CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? "NOT SET",
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET (" + process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + "...)" : "MISSING",
        SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET (length: " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ")" : "MISSING",
        DEBUG: process.env.NEXT_PUBLIC_DEBUG ?? "NOT SET",
        NODE_ENV: process.env.NODE_ENV ?? "unknown",
      };
      console.table(env);
    },

    help() {
      console.log(
        "%c🎮 ClassCiv Debug Commands",
        "background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 16px;"
      );
      console.log(`
  classciv.debug.enable()    → Turn on all debug logging
  classciv.debug.disable()   → Turn off debug logging
  classciv.debug.status()    → Show current app state
  classciv.debug.auth()      → Show auth/Clerk state
  classciv.debug.routes()    → List all app routes
  classciv.debug.env()       → Show environment config (safe)
  classciv.debug.help()      → Show this help

  When debug is ENABLED, every API call is automatically
  logged with method, URL, status code, and timing.
  Auth events, epoch changes, and realtime messages
  are also logged in color-coded categories.
      `);
    },
  };
}

// ============================================
// Initialization — runs on module import
// ============================================

function initDebug() {
  if (typeof window === "undefined") return;

  // Attach to window.classciv
  const api = createConsoleAPI();
  (window as unknown as Record<string, unknown>).classciv = { debug: api };

  // Auto-enable if env var set or localStorage flag
  if (debugEnabled) {
    window.fetch = createTrackedFetch();
  }

  // Always show the welcome banner (even if debug is off)
  console.log(
    "%c🎮 ClassCiv v1.0 %c type %cclassciv.debug.help()%c for debug tools",
    "background: #f59e0b; color: #000; padding: 3px 8px; border-radius: 4px 0 0 4px; font-weight: bold;",
    "background: #292524; color: #a8a29e; padding: 3px 4px;",
    "background: #292524; color: #4ade80; padding: 3px 4px; font-family: monospace;",
    "background: #292524; color: #a8a29e; padding: 3px 8px; border-radius: 0 4px 4px 0;"
  );
}

// ============================================
// Exports
// ============================================

/** Core debug logging — import in any component */
export const debug = {
  /** Auth events: sign-in, sign-out, role detection */
  auth: (msg: string, data?: unknown) => log("auth", msg, data),

  /** API requests and responses */
  api: (method: string, url: string, status?: number, data?: unknown) => {
    if (status !== undefined) {
      log("api", `${method} ${url} [${status}]`, data);
    } else {
      log("api", `→ ${method} ${url}`, data);
    }
  },

  /** Epoch state machine transitions */
  epoch: (msg: string, data?: unknown) => log("epoch", msg, data),

  /** Supabase Realtime events */
  realtime: (msg: string, data?: unknown) => log("realtime", msg, data),

  /** Resource changes (yields, routing, bank) */
  resource: (msg: string, data?: unknown) => log("resource", msg, data),

  /** Navigation / routing events */
  nav: (msg: string, data?: unknown) => log("nav", msg, data),

  /** Middleware hits (server-side, logged via API) */
  middleware: (msg: string, data?: unknown) => log("middleware", msg, data),

  /** Supabase queries */
  supabase: (msg: string, data?: unknown) => log("supabase", msg, data),

  /** Component render events */
  render: (msg: string, data?: unknown) => log("render", msg, data),

  /** State changes (Zustand, useState) */
  state: (msg: string, data?: unknown) => log("state", msg, data),

  /** Errors — always logs even if debug disabled */
  error: (msg: string, err?: unknown) => logError(msg, err),

  /** Log a formatted table */
  table: (category: DebugCategory, title: string, data: Record<string, unknown>[]) =>
    logTable(category, title, data),

  /** Log a collapsed group */
  group: (category: DebugCategory, title: string, fn: () => void) =>
    logGroup(category, title, fn),

  /** Check if debug mode is on */
  isEnabled,

  /** Initialize (call once from layout) */
  init: initDebug,
};

export default debug;
