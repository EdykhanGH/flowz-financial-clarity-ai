import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5-5";

export function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

// Minimal request/response shapes for Vercel Node functions (avoids an extra dependency).
export interface Req {
  method?: string;
  body: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}
export interface Res {
  status(code: number): Res;
  json(body: unknown): void;
}

export const textOf = (content: any[]) => // eslint-disable-line @typescript-eslint/no-explicit-any
  content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
