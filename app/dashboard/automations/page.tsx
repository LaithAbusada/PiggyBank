"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { IconBolt, IconCategory, IconCheck, IconClose, IconPlus, IconShield } from "@/lib/icons";
import ParseRuleModal, { type ParseRuleData } from "@/components/dashboard/ParseRuleModal";
import PromotePendingModal, { type PromoteInput } from "@/components/dashboard/PromotePendingModal";
import CategoryAliasModal, { type CategoryAliasData } from "@/components/dashboard/CategoryAliasModal";

type PendingSms = {
  id: string;
  raw: string;
  receivedAt: string;
  createdAt: string;
};

export default function AutomationsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  const [pending, setPending] = useState<PendingSms[]>([]);
  const [rules, setRules] = useState<ParseRuleData[]>([]);
  const [aliases, setAliases] = useState<CategoryAliasData[]>([]);

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleEditing, setRuleEditing] = useState<ParseRuleData | undefined>(undefined);
  const [ruleSample, setRuleSample] = useState<string | undefined>(undefined);

  const [aliasModalOpen, setAliasModalOpen] = useState(false);
  const [aliasEditing, setAliasEditing] = useState<CategoryAliasData | undefined>(undefined);

  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<PendingSms | null>(null);

  const loadPending = async () => {
    const res = await fetch("/api/pending-sms");
    if (res.ok) setPending(await res.json());
  };
  const loadRules = async () => {
    const res = await fetch("/api/parse-rules");
    if (res.ok) setRules(await res.json());
  };
  const loadAliases = async () => {
    const res = await fetch("/api/category-aliases");
    if (res.ok) setAliases(await res.json());
  };

  useEffect(() => {
    setPageUrl(window.location.href);
    (async () => {
      try {
        const res = await fetch("/api/me/token");
        if (res.ok) {
          const data = await res.json();
          setToken(data.token);
        }
        await Promise.all([loadPending(), loadRules(), loadAliases()]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const copy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const rotate = async () => {
    if (
      !confirm(
        "Rotate your API token? Your current iOS Shortcut will stop working until you paste the new token."
      )
    )
      return;
    setRotating(true);
    try {
      const res = await fetch("/api/me/token/rotate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
      }
    } finally {
      setRotating(false);
    }
  };

  const openNewRule = (sampleRaw?: string) => {
    setRuleEditing(undefined);
    setRuleSample(sampleRaw);
    setRuleModalOpen(true);
  };
  const openEditRule = (rule: ParseRuleData) => {
    setRuleEditing(rule);
    setRuleSample(undefined);
    setRuleModalOpen(true);
  };

  const saveRule = async (data: ParseRuleData) => {
    const { id, ...payload } = data;
    const res = id
      ? await fetch(`/api/parse-rules/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/parse-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (!res.ok) throw new Error((await res.text()) || "Save failed");
    await loadRules();
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    await fetch(`/api/parse-rules/${id}`, { method: "DELETE" });
    await loadRules();
  };

  const toggleRule = async (rule: ParseRuleData) => {
    if (!rule.id) return;
    const { id, ...payload } = rule;
    await fetch(`/api/parse-rules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, active: !rule.active }),
    });
    await loadRules();
  };

  const openNewAlias = () => {
    setAliasEditing(undefined);
    setAliasModalOpen(true);
  };
  const openEditAlias = (a: CategoryAliasData) => {
    setAliasEditing(a);
    setAliasModalOpen(true);
  };
  const saveAlias = async (data: CategoryAliasData) => {
    const { id, ...payload } = data;
    const res = id
      ? await fetch(`/api/category-aliases/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/category-aliases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (!res.ok) throw new Error((await res.text()) || "Save failed");
    await loadAliases();
  };
  const deleteAlias = async (id: string) => {
    if (!confirm("Delete this alias?")) return;
    await fetch(`/api/category-aliases/${id}`, { method: "DELETE" });
    await loadAliases();
  };
  const toggleAlias = async (a: CategoryAliasData) => {
    if (!a.id) return;
    const { id, ...payload } = a;
    await fetch(`/api/category-aliases/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, active: !a.active }),
    });
    await loadAliases();
  };

  const dismissPending = async (id: string) => {
    if (!confirm("Dismiss this SMS?")) return;
    await fetch(`/api/pending-sms/${id}`, { method: "DELETE" });
    await loadPending();
  };

  const promote = async (data: PromoteInput) => {
    if (!promoteTarget) return;
    const res = await fetch(`/api/pending-sms/${promoteTarget.id}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    await loadPending();
  };

  const shortcutUrl = process.env.NEXT_PUBLIC_SHORTCUT_URL || "";

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "8px 0 96px" }}>
      <div style={{ marginBottom: 24 }}>
        <span className="kicker">Automations</span>
        <h1
          className="display"
          style={{ fontSize: "clamp(32px, 4.4vw, 52px)", fontWeight: 700, margin: "6px 0 0" }}
        >
          Automations
        </h1>
        <p style={{ color: "var(--ink-3)", fontSize: 14, marginTop: 8, maxWidth: 640 }}>
          Forward your bank SMS to piggybank via an iOS Shortcut, then teach the app how to read
          them. Every incoming message becomes a transaction automatically.
        </p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 18 }}>
        <h3 className="display" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          Connect your phone
        </h3>
        <p style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 4 }}>
          Copy your API token, install the Shortcut, paste when prompted.
        </p>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <code
            style={{
              flex: 1,
              minWidth: 280,
              padding: "10px 14px",
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 13,
              overflow: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Loading…" : token || "No token"}
          </code>
          <button
            className="btn btn--ink btn--sm"
            onClick={copy}
            disabled={!token || loading}
          >
            {copied ? (
              <>
                <IconCheck size={14} /> Copied
              </>
            ) : (
              "Copy"
            )}
          </button>
          <button
            className="btn btn--outline btn--sm"
            onClick={rotate}
            disabled={!token || rotating || loading}
          >
            {rotating ? "Rotating…" : "Rotate"}
          </button>
        </div>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>On your iPhone</div>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 13,
                color: "var(--ink-2)",
                lineHeight: 1.7,
              }}
            >
              <li>
                Tap <strong>Install Shortcut</strong> below.
              </li>
              <li>When prompted, paste the token above.</li>
              <li>
                In Shortcuts → Automation, add <em>When I receive a message from your bank → Run
                this Shortcut</em>.
              </li>
            </ol>
            {shortcutUrl ? (
              <a
                href={shortcutUrl}
                className="btn btn--ink btn--sm"
                style={{ marginTop: 14, display: "inline-flex" }}
              >
                <IconBolt size={14} /> Install Shortcut
              </a>
            ) : (
              <div
                style={{
                  marginTop: 14,
                  fontSize: 12,
                  color: "var(--ink-3)",
                  background: "var(--surface-2)",
                  border: "1px dashed var(--line)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  lineHeight: 1.55,
                }}
              >
                Shortcut URL not configured yet. Publish your Shortcut to iCloud, then set{" "}
                <code>NEXT_PUBLIC_SHORTCUT_URL</code> in the env to the{" "}
                <code>icloud.com/shortcuts/…</code> link.
              </div>
            )}
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>From desktop</div>
            <div
              style={{
                padding: 12,
                background: "#fff",
                borderRadius: 12,
                border: "1px solid var(--line)",
                display: "inline-flex",
              }}
            >
              {pageUrl ? (
                <QRCodeSVG value={pageUrl} size={160} />
              ) : (
                <div style={{ width: 160, height: 160 }} />
              )}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 6,
                maxWidth: 180,
              }}
            >
              Scan with your iPhone camera to continue setup on your phone.
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <IconShield size={16} />
          <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Keep this token secret — it lets anyone POST transactions to your account. Rotate
            immediately if it leaks.
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <h3 className="display" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              Pending SMS
            </h3>
            <p style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 4 }}>
              Messages that didn&apos;t match any rule. Promote them manually, or use one to build
              a new rule.
            </p>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-3)",
              background: "var(--surface-2)",
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            {pending.length}
          </div>
        </div>

        {pending.length === 0 ? (
          <div
            style={{
              padding: "20px 16px",
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 13,
              background: "var(--surface-2)",
              borderRadius: 12,
            }}
          >
            Nothing waiting — every SMS matched a rule.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pending.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: 14,
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 12,
                    color: "var(--ink-2)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {p.raw}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {new Date(p.receivedAt).toLocaleString()}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="btn btn--outline btn--sm"
                      onClick={() => openNewRule(p.raw)}
                    >
                      <IconBolt size={12} /> Create rule
                    </button>
                    <button
                      className="btn btn--ink btn--sm"
                      onClick={() => {
                        setPromoteTarget(p);
                        setPromoteOpen(true);
                      }}
                    >
                      Promote
                    </button>
                    <button
                      className="btn btn--outline btn--sm"
                      onClick={() => dismissPending(p.id)}
                      title="Dismiss"
                    >
                      <IconClose size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <h3 className="display" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              Parse rules
            </h3>
            <p style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 4 }}>
              Regex rules that turn SMS into transactions. Higher priority is tried first.
            </p>
          </div>
          <button className="btn btn--ink btn--sm" onClick={() => openNewRule()}>
            <IconPlus size={14} /> New rule
          </button>
        </div>

        {rules.length === 0 ? (
          <div
            style={{
              padding: "20px 16px",
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 13,
              background: "var(--surface-2)",
              borderRadius: 12,
            }}
          >
            No rules yet — add one to start parsing SMS automatically.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rules.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "12px 14px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  opacity: r.active ? 1 : 0.6,
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                    {r.type === "in" ? "Income" : "Expense"} · {r.defaultCategory} · priority{" "}
                    {r.priority}
                  </div>
                </div>
                <label
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    fontSize: 12,
                    color: "var(--ink-3)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={r.active}
                    onChange={() => toggleRule(r)}
                  />
                  Active
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => openEditRule(r)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => r.id && deleteRule(r.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 24, marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <h3 className="display" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              Category aliases
            </h3>
            <p style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 4 }}>
              When an SMS contains a keyword, override the rule&rsquo;s default category.
              Example: <code>CAREEM FOOD</code> → Restaurants. Higher priority wins first.
            </p>
          </div>
          <button className="btn btn--ink btn--sm" onClick={openNewAlias}>
            <IconPlus size={14} /> New alias
          </button>
        </div>

        {aliases.length === 0 ? (
          <div
            style={{
              padding: "20px 16px",
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 13,
              background: "var(--surface-2)",
              borderRadius: 12,
            }}
          >
            No aliases yet — add one to auto-categorize matching SMS.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {aliases.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: "12px 14px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  opacity: a.active ? 1 : 0.6,
                }}
              >
                <IconCategory size={16} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                    {a.keyword}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                    → {a.category} · priority {a.priority}
                  </div>
                </div>
                <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "var(--ink-3)" }}>
                  <input type="checkbox" checked={a.active} onChange={() => toggleAlias(a)} />
                  Active
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn--outline btn--sm" onClick={() => openEditAlias(a)}>
                    Edit
                  </button>
                  <button className="btn btn--outline btn--sm" onClick={() => a.id && deleteAlias(a.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ParseRuleModal
        open={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        onSave={saveRule}
        initial={ruleEditing}
        sampleRaw={ruleSample}
      />
      <PromotePendingModal
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        onPromote={promote}
        pending={promoteTarget}
      />
      <CategoryAliasModal
        open={aliasModalOpen}
        onClose={() => setAliasModalOpen(false)}
        onSave={saveAlias}
        initial={aliasEditing}
      />
    </main>
  );
}
