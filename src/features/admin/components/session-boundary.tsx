"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function CheckedSession({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<
    "checking" | "allowed" | "unavailable"
  >("checking");
  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    async function check() {
      controller?.abort();
      if (document.hidden) return;
      const current = new AbortController();
      controller = current;
      const timeout = window.setTimeout(() => current.abort(), 10000);
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: current.signal,
        });
        if (!active || controller !== current) return;
        if (response.status === 401 || response.status === 403) {
          setStatus("checking");
          window.location.replace("/admin/login");
          return;
        }
        if (!response.ok || (await response.json()).authorised !== true)
          throw new Error();
        if (active && controller === current && !document.hidden)
          setStatus("allowed");
      } catch {
        if (active && controller === current) setStatus("unavailable");
      } finally {
        window.clearTimeout(timeout);
      }
    }
    function restore() {
      setStatus("checking");
      void check();
    }
    function conceal() {
      controller?.abort();
      controller = undefined;
      setStatus("checking");
    }
    function visibility() {
      conceal();
      if (!document.hidden) void check();
    }
    void check();
    const interval = window.setInterval(() => void check(), 30000);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pageshow", restore);
    window.addEventListener("pagehide", conceal);
    window.addEventListener("focus", restore);
    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pageshow", restore);
      window.removeEventListener("pagehide", conceal);
      window.removeEventListener("focus", restore);
    };
  }, []);
  return (
    <>
      {status !== "allowed" && (
        <div className="admin-main" role="status">
          {status === "checking"
            ? "Checking your studio session…"
            : "Your session could not be verified. Reconnecting…"}
        </div>
      )}
      <div hidden={status !== "allowed"}>{children}</div>
    </>
  );
}

// Remount the check on navigation, including restoration from the router cache.
// Server guards and RLS remain the security boundary; this conceals stale UI.
export function SessionBoundary({ children }: { children: React.ReactNode }) {
  return <CheckedSession key={usePathname()}>{children}</CheckedSession>;
}
