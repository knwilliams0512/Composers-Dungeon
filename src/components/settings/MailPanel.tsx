"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Callout, Panel } from "@/components/ui/primitives";
import {
  clearMailSettings,
  saveMailSettings,
  sendTestEmail,
} from "@/server/actions/auth-actions";
import { RELAY_PROVIDERS, type MailConfigView } from "@/lib/mail-providers";

/**
 * The sender this install borrows.
 *
 * Presented as what it is — somebody's own account, lent to the app — rather
 * than as a service the app provides, because it is not one. Nothing ships
 * with a mailbox inside it; see lib/mail.ts.
 *
 * The leading note matters as much as the fields: most people who open this
 * panel do not need it. The reset flow already works on the machine the app is
 * installed on, so email is for reaching yourself somewhere else.
 */

const SMTP_PRESETS = [
  { name: "Gmail", host: "smtp.gmail.com", port: 587, secure: false },
  { name: "Outlook", host: "smtp-mail.outlook.com", port: 587, secure: false },
  { name: "iCloud", host: "smtp.mail.me.com", port: 587, secure: false },
  { name: "Fastmail", host: "smtp.fastmail.com", port: 465, secure: true },
];

export function MailPanel({ saved }: { saved: MailConfigView | null }) {
  const [mode, setMode] = useState<"smtp" | "relay">(saved?.mode ?? "relay");
  const [host, setHost] = useState(saved?.host ?? "");
  const [port, setPort] = useState(String(saved?.port ?? 587));
  const [secure, setSecure] = useState(saved?.secure ?? false);
  const [username, setUsername] = useState(saved?.username ?? "");
  const [password, setPassword] = useState("");
  const [provider, setProvider] = useState(saved?.provider || "resend");
  const [apiKey, setApiKey] = useState("");
  const [domain, setDomain] = useState(saved?.domain ?? "");
  const [fromName, setFromName] = useState(saved?.fromName ?? "Composer's Dungeon");
  const [fromEmail, setFromEmail] = useState(saved?.fromEmail ?? "");
  const [configured, setConfigured] = useState(Boolean(saved));
  const [busy, setBusy] = useState<"save" | "test" | "clear" | null>(null);
  const [message, setMessage] = useState<{
    kind: "note" | "warning" | "insight";
    text: string;
  } | null>(null);

  const chosen = RELAY_PROVIDERS.find((p) => p.id === provider) ?? RELAY_PROVIDERS[0];

  function usePreset(preset: (typeof SMTP_PRESETS)[number]) {
    setHost(preset.host);
    setPort(String(preset.port));
    setSecure(preset.secure);
    setMessage(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy("save");
    setMessage(null);
    const result = await saveMailSettings({
      mode,
      host,
      port: Number(port) || 587,
      secure,
      username,
      password,
      provider,
      apiKey,
      domain,
      fromName,
      fromEmail,
    });
    setBusy(null);
    if (!result.ok) {
      setMessage({ kind: "warning", text: result.error ?? "Could not save" });
      return;
    }
    setConfigured(true);
    setPassword("");
    setApiKey("");
    setMessage({ kind: "note", text: "Saved. Send a test to check it works." });
  }

  async function test() {
    setBusy("test");
    setMessage(null);
    const result = await sendTestEmail();
    setBusy(null);
    setMessage(
      result.ok
        ? { kind: "insight", text: `Sent to ${result.data?.sentTo}. Check your inbox.` }
        : { kind: "warning", text: result.error ?? "Could not send" }
    );
  }

  async function forget() {
    setBusy("clear");
    await clearMailSettings();
    setBusy(null);
    setConfigured(false);
    setHost("");
    setUsername("");
    setPassword("");
    setApiKey("");
    setDomain("");
    setFromEmail("");
    setMessage({
      kind: "note",
      text: "Forgotten. Reset links are handed over on this machine instead, which needs nothing.",
    });
  }

  return (
    <Panel
      title="Email"
      icon="scroll"
      subtitle="Optional. Only used to send a password reset link."
      className="mt-6"
    >
      <p className="text-sm leading-relaxed text-parchment-400">
        You probably do not need this. Composer&rsquo;s Dungeon runs entirely on this machine,
        so when you ask for a password reset while sitting at it, the app hands you the link
        directly — no email, no setup, one click. Email is worth setting up only if you want
        to be able to reset from somewhere else, or from another machine on your network.
      </p>

      <p className="mt-3 text-sm leading-relaxed text-parchment-400">
        The app has no mailbox of its own and never will: a password shipped inside a
        download is a password everyone who downloads it can read. So it borrows one. Mail
        goes out as{" "}
        <span className="text-parchment-200">Composer&rsquo;s Dungeon (no-reply)</span> and
        replies to it go nowhere.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("relay")}
          className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition ${
            mode === "relay"
              ? "border-gold-500/60 bg-gold-500/10 text-gold-100"
              : "border-parchment-100/15 text-parchment-400 hover:border-parchment-100/30"
          }`}
        >
          <span className="block text-sm text-parchment-100">A sending service</span>
          One key, no ports. Easiest if you have no mailbox to spare.
        </button>
        <button
          type="button"
          onClick={() => setMode("smtp")}
          className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition ${
            mode === "smtp"
              ? "border-gold-500/60 bg-gold-500/10 text-gold-100"
              : "border-parchment-100/15 text-parchment-400 hover:border-parchment-100/30"
          }`}
        >
          <span className="block text-sm text-parchment-100">Your own mailbox</span>
          Gmail, Outlook, iCloud and the rest, over SMTP.
        </button>
      </div>

      <form onSubmit={save} className="mt-4 space-y-4">
        {mode === "relay" ? (
          <>
            <div className="flex flex-wrap gap-2">
              {RELAY_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    provider === p.id
                      ? "border-gold-500/60 bg-gold-500/10 text-gold-100"
                      : "border-parchment-100/15 text-parchment-300 hover:border-gold-500/50"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-parchment-500">
              {chosen.blurb} Make a key at{" "}
              <code className="text-gold-300">{chosen.keysAt}</code> and paste it below.
            </p>

            <div>
              <label className="label" htmlFor="mail-key">
                {saved?.hasApiKey ? "API key (leave blank to keep)" : "API key"}
              </label>
              <input
                id="mail-key"
                type="password"
                className="input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="new-password"
                placeholder="re_…"
              />
            </div>

            {chosen.needsDomain && (
              <div>
                <label className="label" htmlFor="mail-domain">Sending domain</label>
                <input
                  id="mail-domain"
                  className="input"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="mg.example.com"
                />
              </div>
            )}
          </>
        ) : (
          <>
            <Callout kind="warning">
              Use an <strong>app password</strong>, not your real one. It is stored in this
              machine&rsquo;s own database in plain text, next to everything else the app
              keeps.
            </Callout>

            <div className="flex flex-wrap gap-2">
              {SMTP_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => usePreset(preset)}
                  className="rounded-full border border-parchment-100/15 px-3 py-1 text-xs text-parchment-300 transition hover:border-gold-500/50 hover:text-gold-200"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <div>
                <label className="label" htmlFor="mail-host">Mail server</label>
                <input
                  id="mail-host"
                  className="input"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="label" htmlFor="mail-port">Port</label>
                <input
                  id="mail-port"
                  className="input"
                  inputMode="numeric"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-parchment-300">
              <input
                type="checkbox"
                checked={secure}
                onChange={(e) => setSecure(e.target.checked)}
                className="h-4 w-4 accent-gold-500"
              />
              This port uses TLS from the start (usually port 465)
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="mail-user">Username</label>
                <input
                  id="mail-user"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="label" htmlFor="mail-pass">
                  {saved?.hasPassword ? "App password (leave blank to keep)" : "App password"}
                </label>
                <input
                  id="mail-pass"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="mail-from-name">Sender name</label>
            <input
              id="mail-from-name"
              className="input"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="mail-from">Send from</label>
            <input
              id="mail-from"
              type="email"
              className="input"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder={mode === "relay" ? "onboarding@resend.dev" : "you@example.com"}
              required
            />
          </div>
        </div>

        {message && <Callout kind={message.kind}>{message.text}</Callout>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={busy !== null}>
            {busy === "save" ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={test}
            className="btn-secondary"
            disabled={busy !== null || !configured}
          >
            <Icon name="share" size={14} />
            {busy === "test" ? "Sending…" : "Send a test to myself"}
          </button>
          {configured && (
            <button
              type="button"
              onClick={forget}
              className="btn-ghost text-parchment-400"
              disabled={busy !== null}
            >
              {busy === "clear" ? "Forgetting…" : "Forget these settings"}
            </button>
          )}
        </div>
      </form>
    </Panel>
  );
}
