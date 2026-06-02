import "server-only";
import { spawn } from "node:child_process";

const OPENCLAW_BIN = process.env.OPENCLAW_BIN || "openclaw";
const TIMEOUT_MS = Number(process.env.GATEWAY_TIMEOUT_MS || 90_000);

export interface AskAgentResult {
  ok: boolean;
  content: string;
  runId?: string;
  durationMs?: number;
  raw?: unknown;
}

/**
 * Invoca um subagente do openclaw via CLI:
 *   openclaw agent --agent <id> --message "<text>" --json
 *
 * NÃO usar shell — passa args como array (sem injeção).
 * Timeout 90s pra acomodar Cascata Circular da Pepper (15-45s típico).
 */
export async function askAgent(input: {
  agentId: string;
  message: string;
}): Promise<AskAgentResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      OPENCLAW_BIN,
      ["agent", "--agent", input.agentId, "--message", input.message, "--json"],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        proc.kill("SIGKILL");
      } catch {
        // ignore
      }
      reject(new Error(`gateway CLI timeout after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);

    proc.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr.trim() || `openclaw CLI exit ${code}`));
        return;
      }
      try {
        const json = JSON.parse(stdout) as Record<string, unknown>;
        const content =
          (json.content as string | undefined) ??
          (json.response as string | undefined) ??
          (json.message as string | undefined) ??
          "";
        resolve({
          ok: json.ok !== false,
          content: String(content),
          runId: (json.runId as string | undefined) ?? undefined,
          durationMs: (json.durationMs as number | undefined) ?? undefined,
          raw: json,
        });
      } catch (err) {
        resolve({ ok: true, content: stdout.trim(), raw: { stdout, parseError: String(err) } });
      }
    });
  });
}
