"use client";

import { useEffect } from "react";

/** RF-14: una visita por carga. Sin cookies ni datos personales. */
export function VisitBeacon() {
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/menu/visits", { method: "POST", keepalive: true, signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, []);
  return null;
}
