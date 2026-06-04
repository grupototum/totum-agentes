"use client";

/**
 * SSE client mínimo via fetch + ReadableStream.
 * (EventSource padrão não permite POST.)
 *
 * Emite cada evento parseado pra o handler.
 */
export interface SSEEvent {
  event: string;
  data: unknown;
}

export async function streamSSE(
  url: string,
  init: RequestInit,
  onEvent: (ev: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(url, { ...init, signal });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    // SSE messages separadas por \n\n
    let sep;
    while ((sep = buf.indexOf("\n\n")) !== -1) {
      const raw = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      const event = parseEvent(raw);
      if (event) onEvent(event);
    }
  }
}

function parseEvent(raw: string): SSEEvent | null {
  let event = "message";
  let dataStr = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
  }
  if (!dataStr) return null;
  try {
    return { event, data: JSON.parse(dataStr) };
  } catch {
    return { event, data: dataStr };
  }
}
