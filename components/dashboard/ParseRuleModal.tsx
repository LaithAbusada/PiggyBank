"use client";

import { useEffect, useMemo, useState } from "react";
import { IconClose } from "@/lib/icons";
import { CATEGORIES_OPTIONS } from "@/lib/dashboard-data";

export type ParseRuleData = {
  id?: string;
  name: string;
  senderPattern: string | null;
  contentPattern: string | null;
  amountRegex: string;
  merchantRegex: string;
  type: "in" | "out";
  defaultCategory: string;
  priority: number;
  active: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: ParseRuleData) => Promise<void>;
  initial?: ParseRuleData;
  sampleRaw?: string;
};

const emptyRule: ParseRuleData = {
  name: "",
  senderPattern: null,
  contentPattern: null,
  amountRegex: "",
  merchantRegex: "",
  type: "out",
  defaultCategory: "Other",
  priority: 0,
  active: true,
};

type ExtractResult = { ok: true; value: string } | { ok: false; error: string };
type TestResult = { ok: true } | { ok: false; error: string };

function tryExtract(pattern: string, text: string): ExtractResult {
  if (!pattern) return { ok: false, error: "empty" };
  try {
    const m = new RegExp(pattern, "i").exec(text);
    if (!m) return { ok: false, error: "no match" };
    if (m[1] === undefined) return { ok: false, error: "no capture group" };
    return { ok: true, value: m[1] };
  } catch {
    return { ok: false, error: "invalid regex" };
  }
}

function tryTest(pattern: string | null, text: string): TestResult {
  if (!pattern) return { ok: true };
  try {
    if (new RegExp(pattern, "i").test(text)) return { ok: true };
    return { ok: false, error: "no match" };
  } catch {
    return { ok: false, error: "invalid regex" };
  }
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--ink-3)",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  fontWeight: 600,
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={labelStyle}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{hint}</span>}
    </label>
  );
}

function TestRow({
  label,
  res,
}: {
  label: string;
  res: ExtractResult | TestResult;
}) {
  const value = "value" in res ? res.value : res.ok ? "match" : undefined;
  const error = !res.ok ? res.error : undefined;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 12 }}>
      <span style={{ minWidth: 110, color: "var(--ink-3)" }}>{label}</span>
      <span
        style={{
          color: res.ok ? "oklch(0.42 0.16 155)" : "oklch(0.5 0.2 25)",
          fontFamily:
            value && value !== "match"
              ? "ui-monospace, SFMono-Regular, Menlo, monospace"
              : "inherit",
        }}
      >
        {res.ok ? value : error}
      </span>
    </div>
  );
}

export default function ParseRuleModal({ open, onClose, onSave, initial, sampleRaw }: Props) {
  const [rule, setRule] = useState<ParseRuleData>(emptyRule);
  const [testSms, setTestSms] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRule(initial ?? emptyRule);
    setTestSms(sampleRaw ?? "");
    setErr(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, initial, sampleRaw, onClose]);

  const senderOk = useMemo(() => tryTest(rule.senderPattern, testSms), [rule.senderPattern, testSms]);
  const contentOk = useMemo(() => tryTest(rule.contentPattern, testSms), [rule.contentPattern, testSms]);
  const amountRes = useMemo(() => tryExtract(rule.amountRegex, testSms), [rule.amountRegex, testSms]);
  const merchantRes = useMemo(() => tryExtract(rule.merchantRegex, testSms), [rule.merchantRegex, testSms]);
  const overallMatch = !!testSms && senderOk.ok && contentOk.ok && amountRes.ok && merchantRes.ok;

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!rule.name.trim()) return setErr("Name required");
    if (!rule.amountRegex.trim()) return setErr("Amount regex required");
    if (!rule.merchantRegex.trim()) return setErr("Merchant regex required");
    if (!rule.defaultCategory.trim()) return setErr("Default category required");
    setSubmitting(true);
    setErr(null);
    try {
      await onSave({
        ...rule,
        name: rule.name.trim(),
        defaultCategory: rule.defaultCategory.trim(),
      });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--line)",
    background: "var(--surface-2)",
    fontSize: 13,
    outline: "none",
    width: "100%",
    fontFamily: "inherit",
  };
  const monoFieldStyle: React.CSSProperties = {
    ...fieldStyle,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,15,35,0.48)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          background: "var(--surface)",
          borderRadius: 24,
          width: "100%",
          maxWidth: 720,
          padding: 26,
          boxShadow: "var(--shadow-lg)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 18,
          }}
        >
          <div>
            <div className="kicker">Automation</div>
            <h3 className="display" style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0" }}>
              {initial ? "Edit parse rule" : "New parse rule"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-2)",
            }}
          >
            <IconClose size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Name">
            <input
              style={fieldStyle}
              value={rule.name}
              onChange={(e) => setRule({ ...rule, name: e.target.value })}
              placeholder="My bank card transactions"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Sender pattern (optional)" hint="Regex prefilter. Leave blank for none.">
              <input
                style={monoFieldStyle}
                value={rule.senderPattern ?? ""}
                onChange={(e) => setRule({ ...rule, senderPattern: e.target.value || null })}
                placeholder="MyBank"
              />
            </Field>
            <Field label="Content pattern (optional)" hint="Required keywords.">
              <input
                style={monoFieldStyle}
                value={rule.contentPattern ?? ""}
                onChange={(e) => setRule({ ...rule, contentPattern: e.target.value || null })}
                placeholder="purchased|debited"
              />
            </Field>
          </div>

          <Field label="Amount regex" hint="First capture group is the amount.">
            <input
              style={monoFieldStyle}
              value={rule.amountRegex}
              onChange={(e) => setRule({ ...rule, amountRegex: e.target.value })}
              placeholder="AED\s*([\d,]+(?:\.\d+)?)"
            />
          </Field>

          <Field label="Merchant regex" hint="First capture group is the merchant / title.">
            <input
              style={monoFieldStyle}
              value={rule.merchantRegex}
              onChange={(e) => setRule({ ...rule, merchantRegex: e.target.value })}
              placeholder="at\s+([A-Z0-9 ]+?)\s+on"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Type">
              <select
                style={fieldStyle}
                value={rule.type}
                onChange={(e) => setRule({ ...rule, type: e.target.value as "in" | "out" })}
              >
                <option value="out">Expense (out)</option>
                <option value="in">Income (in)</option>
              </select>
            </Field>
            <Field label="Default category">
              <select
                style={fieldStyle}
                value={rule.defaultCategory}
                onChange={(e) => setRule({ ...rule, defaultCategory: e.target.value })}
              >
                {CATEGORIES_OPTIONS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.key}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Priority" hint="Higher wins first.">
              <input
                type="number"
                style={fieldStyle}
                value={rule.priority}
                onChange={(e) =>
                  setRule({ ...rule, priority: parseInt(e.target.value) || 0 })
                }
              />
            </Field>
          </div>

          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input
              type="checkbox"
              checked={rule.active}
              onChange={(e) => setRule({ ...rule, active: e.target.checked })}
            />
            Active
          </label>

          <div
            style={{
              marginTop: 6,
              padding: 14,
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              borderRadius: 12,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Test against an SMS</div>
            <textarea
              style={{ ...monoFieldStyle, minHeight: 72, resize: "vertical" }}
              value={testSms}
              onChange={(e) => setTestSms(e.target.value)}
              placeholder="Paste a sample SMS to see what your regex extracts"
            />
            {testSms && (
              <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
                <TestRow label="Sender filter" res={senderOk} />
                <TestRow label="Content filter" res={contentOk} />
                <TestRow label="Amount" res={amountRes} />
                <TestRow label="Merchant" res={merchantRes} />
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    color: overallMatch ? "oklch(0.42 0.16 155)" : "oklch(0.5 0.2 25)",
                  }}
                >
                  {overallMatch ? "Rule would fire" : "Rule would not fire"}
                </div>
              </div>
            )}
          </div>
        </div>

        {err && (
          <div style={{ marginTop: 12, color: "oklch(0.5 0.2 25)", fontSize: 13 }}>{err}</div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn--outline"
            style={{ flex: 1, justifyContent: "center" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--ink"
            disabled={submitting}
            style={{ flex: 1, justifyContent: "center" }}
          >
            {submitting ? "Saving…" : initial ? "Save changes" : "Create rule"}
          </button>
        </div>
      </form>
    </div>
  );
}
