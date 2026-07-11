import { useEffect } from "react";
import { USE_MOCK } from "@/lib/api";

/**
 * Subscribes to backend SSE stream (/api/events) when a real API is configured.
 * In mock mode it's a no-op so preview stays quiet.
 */
export function useSSE(handler: (event: { type: string; data: unknown }) => void) {
  useEffect(() => {
    if (USE_MOCK) return;
    const url = `${import.meta.env.VITE_API_URL}/api/events`;
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try { handler({ type: "message", data: JSON.parse(e.data) }); } catch { /* ignore */ }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [handler]);
}
