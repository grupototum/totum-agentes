const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_GATEWAY_TOKEN || "";

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  status: "online" | "busy" | "offline";
}

export interface SendMessageRequest {
  content: string;
  threadId?: string;
}

export interface SendMessageResponse {
  message: string;
  threadId: string;
}

export async function listAgents(): Promise<Agent[]> {
  const res = await fetch(`${GATEWAY_URL}/v1/agents`, {
    headers: GATEWAY_TOKEN ? { Authorization: `Bearer ${GATEWAY_TOKEN}` } : {},
  });
  if (!res.ok) throw new Error(`Failed to list agents: ${res.status}`);
  return res.json();
}

export async function sendMessage(
  agentId: string,
  payload: SendMessageRequest
): Promise<SendMessageResponse> {
  const res = await fetch(`${GATEWAY_URL}/v1/agents/${agentId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(GATEWAY_TOKEN ? { Authorization: `Bearer ${GATEWAY_TOKEN}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
  return res.json();
}
