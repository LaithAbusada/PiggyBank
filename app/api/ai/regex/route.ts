import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "@/lib/auth-user";
import { AI_MODEL, aiErrorResponse, aiNotConfigured, firstText, getAnthropic } from "@/lib/ai";
import { CATEGORIES_OPTIONS } from "@/lib/dashboard-data";
import { CURRENCY_CODES, isCurrencyCode } from "@/lib/currencies";

export const maxDuration = 60;

const CANONICAL_CATEGORIES = CATEGORIES_OPTIONS.map((c) => c.key);

const REGEX_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["rule", "explanation"],
  properties: {
    rule: {
      type: "object",
      additionalProperties: false,
      required: [
        "name",
        "senderPattern",
        "contentPattern",
        "amountRegex",
        "merchantRegex",
        "currencyRegex",
        "type",
        "defaultCategory",
        "currency",
      ],
      properties: {
        name: { type: "string" },
        senderPattern: { type: ["string", "null"] },
        contentPattern: { type: ["string", "null"] },
        amountRegex: { type: "string" },
        merchantRegex: { type: "string" },
        currencyRegex: { type: ["string", "null"] },
        type: { type: "string", enum: ["in", "out"] },
        defaultCategory: { type: "string", enum: CANONICAL_CATEGORIES },
        currency: { type: "string", enum: CURRENCY_CODES },
      },
    },
    explanation: { type: "string" },
  },
};

function buildPrompt(
  sample: string,
  instructions: string | null,
  currentRuleJson: string | null
): string {
  let prompt = `You are a regex assistant for PiggyBank, an app that turns bank SMS messages into transactions using user-defined parse rules.

A parse rule has these fields, applied by this exact JavaScript engine:
- senderPattern (string or null): optional gate. If set, new RegExp(senderPattern, "i").test(fullSms) must pass or the rule is skipped. It is tested against the FULL raw SMS text (there is no separate sender field), case-insensitively.
- contentPattern (string or null): optional second gate with the same semantics — useful for requiring keywords like "purchased|debited".
- amountRegex (string, required): new RegExp(amountRegex, "i").exec(fullSms) is run and CAPTURE GROUP 1 must contain the numeric amount. Commas are stripped from the capture and it is parsed with parseFloat, so "1,234.56" is fine.
- merchantRegex (string, required): same execution; CAPTURE GROUP 1 must contain the merchant / payee name.
- currencyRegex (string or null): optional. If set, capture group 1 should be a 3-letter currency code; when the captured code is one of the supported currencies it overrides the static currency field.
- type: "in" for money received, "out" for money spent.
- defaultCategory: exactly one of ${CANONICAL_CATEGORIES.join(", ")}.
- currency: one of ${CURRENCY_CODES.join(", ")} — the currency the SMS amounts are denominated in (use USD if unsure).

Guidelines:
- Regexes are plain JavaScript regex source strings (no surrounding slashes, no flags — they are always compiled with the "i" flag).
- Make amountRegex robust to small variations: amounts with or without thousands separators or decimals, e.g. ([\\d,]+(?:\\.\\d+)?).
- Make merchantRegex tolerant of different merchant names: capture a general token anchored by the surrounding template words, not the literal merchant from the sample.
- Anchor patterns to stable phrases from the bank's message template so the rule does not misfire on unrelated SMS. Use senderPattern/contentPattern as cheap gates when the SMS has a distinctive sender name or phrasing; use null when not needed.
- Provide a short descriptive name for the rule and a brief plain-English explanation (2-3 sentences) of what the rule matches and how it extracts the amount and merchant.

Sample SMS to build the rule for:
<<<
${sample}
>>>`;

  if (instructions) {
    prompt += `\n\nUser instructions:\n${instructions}`;
  }
  if (currentRuleJson) {
    prompt += `\n\nThe user already has a draft rule. Fix or improve it rather than ignoring it (keep whatever already works):\n${currentRuleJson}`;
  }
  return prompt;
}

function compilesI(pattern: string): boolean {
  try {
    new RegExp(pattern, "i");
    return true;
  } catch {
    return false;
  }
}

function captureCount(pattern: string): number {
  try {
    const m = new RegExp(pattern + "|").exec("");
    return m ? m.length - 1 : 0;
  } catch {
    return 0;
  }
}

function group1(pattern: string, text: string): string | null {
  try {
    const m = new RegExp(pattern, "i").exec(text);
    return m && m[1] ? m[1] : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  if (typeof b.sample !== "string" || !b.sample.trim()) {
    return NextResponse.json({ error: "sample is required" }, { status: 400 });
  }
  if (b.instructions !== undefined && typeof b.instructions !== "string") {
    return NextResponse.json({ error: "Bad instructions" }, { status: 400 });
  }
  if (
    b.currentRule !== undefined &&
    (typeof b.currentRule !== "object" || b.currentRule === null || Array.isArray(b.currentRule))
  ) {
    return NextResponse.json({ error: "Bad currentRule" }, { status: 400 });
  }
  if (b.sample.length > 4000) {
    return NextResponse.json({ error: "sample too long — paste a single SMS" }, { status: 400 });
  }
  if (typeof b.instructions === "string" && b.instructions.length > 2000) {
    return NextResponse.json({ error: "instructions too long" }, { status: 400 });
  }
  const sample = b.sample;
  const instructions =
    typeof b.instructions === "string" && b.instructions.trim() ? b.instructions.trim() : null;
  const currentRule = (b.currentRule as Record<string, unknown> | undefined) ?? null;
  const currentRuleJson = currentRule ? JSON.stringify(currentRule) : null;
  if (currentRuleJson !== null && currentRuleJson.length > 5000) {
    return NextResponse.json({ error: "current rule too large" }, { status: 400 });
  }

  const anthropic = getAnthropic();
  if (!anthropic) return aiNotConfigured();

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { format: { type: "json_schema", schema: REGEX_SCHEMA } },
      messages: [{ role: "user", content: buildPrompt(sample, instructions, currentRuleJson) }],
    });
  } catch (err) {
    return aiErrorResponse(err);
  }

  if (response.stop_reason === "refusal") {
    return NextResponse.json({ error: "AI declined this request" }, { status: 502 });
  }
  if (response.stop_reason === "max_tokens") {
    return NextResponse.json(
      { error: "AI response was cut off before completing — please retry" },
      { status: 502 }
    );
  }
  const text = firstText(response);
  if (!text) return NextResponse.json({ error: "AI returned no output" }, { status: 502 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 });
  }

  const root = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const rawRule =
    root.rule && typeof root.rule === "object" && !Array.isArray(root.rule)
      ? (root.rule as Record<string, unknown>)
      : null;
  if (!rawRule) {
    return NextResponse.json({ error: "AI returned an invalid rule" }, { status: 502 });
  }

  const optPattern = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v : null;

  const senderPattern = optPattern(rawRule.senderPattern);
  const contentPattern = optPattern(rawRule.contentPattern);
  const currencyRegex = optPattern(rawRule.currencyRegex);
  const amountRegex = typeof rawRule.amountRegex === "string" ? rawRule.amountRegex : "";
  const merchantRegex = typeof rawRule.merchantRegex === "string" ? rawRule.merchantRegex : "";

  const invalidPattern = () =>
    NextResponse.json({ error: "AI returned an invalid pattern" }, { status: 502 });

  for (const p of [senderPattern, contentPattern, currencyRegex]) {
    if (p !== null && !compilesI(p)) return invalidPattern();
  }
  if (!amountRegex || !compilesI(amountRegex) || captureCount(amountRegex) < 1) {
    return invalidPattern();
  }
  if (!merchantRegex || !compilesI(merchantRegex) || captureCount(merchantRegex) < 1) {
    return invalidPattern();
  }

  let explanation = typeof root.explanation === "string" ? root.explanation : "";
  const caveats: string[] = [];
  if (group1(amountRegex, sample) === null) {
    caveats.push("the amount pattern did not produce a group-1 match on your sample");
  }
  if (group1(merchantRegex, sample) === null) {
    caveats.push("the merchant pattern did not produce a group-1 match on your sample");
  }
  if (caveats.length) {
    explanation = `${explanation ? explanation + " " : ""}Heads up: ${caveats.join(
      " and "
    )} — tweak it in the live tester.`;
  }

  const type: "in" | "out" = rawRule.type === "in" ? "in" : "out";
  const currency = isCurrencyCode(rawRule.currency) ? rawRule.currency : "USD";
  const rawCategory = typeof rawRule.defaultCategory === "string" ? rawRule.defaultCategory : "";
  const defaultCategory = CANONICAL_CATEGORIES.includes(rawCategory) ? rawCategory : "Other";
  const name =
    typeof rawRule.name === "string" && rawRule.name.trim()
      ? rawRule.name.trim()
      : "AI generated rule";

  return NextResponse.json({
    rule: {
      name,
      senderPattern,
      contentPattern,
      amountRegex,
      merchantRegex,
      currencyRegex,
      type,
      defaultCategory,
      currency,
    },
    explanation,
  });
}
