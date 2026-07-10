import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const AI_MODEL = "claude-opus-4-8";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export function aiNotConfigured(): NextResponse {
  return NextResponse.json({ error: "AI_NOT_CONFIGURED" }, { status: 503 });
}

export function aiErrorResponse(err: unknown): NextResponse {
  if (err instanceof Anthropic.RateLimitError) {
    return NextResponse.json(
      { error: "AI is rate limited — try again in a minute" },
      { status: 429 }
    );
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return NextResponse.json({ error: "AI key invalid" }, { status: 503 });
  }
  if (err instanceof Anthropic.APIError) {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
  throw err;
}

export function firstText(response: Anthropic.Message): string | null {
  for (const block of response.content) {
    if (block.type === "text") return block.text;
  }
  return null;
}
