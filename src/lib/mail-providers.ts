/**
 * The sending services this app knows how to talk to, and the shape of the
 * stored settings.
 *
 * Separate from lib/mail.ts because that module is `server-only` — it holds
 * credentials and opens sockets — and the Settings panel is a client
 * component. Importing a server-only module from the client does not fail
 * loudly; every export becomes a client reference stub, and the first one
 * called throws something meaningless. So the parts both sides need live here,
 * where neither side is lying about what it is.
 */

export type MailMode = "smtp" | "relay";

export interface RelayProvider {
  id: string;
  name: string;
  /** Where a key is created, shown next to the field. */
  keysAt: string;
  needsDomain: boolean;
  blurb: string;
}

/**
 * All four take one key and a verified sender address. None can be pre-filled
 * by the installer: the key belongs to whoever owns the account, and a key
 * shipped inside a download is a key everyone who downloads it has.
 */
export const RELAY_PROVIDERS: RelayProvider[] = [
  {
    id: "resend",
    name: "Resend",
    keysAt: "resend.com/api-keys",
    needsDomain: false,
    blurb: "Sends from onboarding@resend.dev to your own address without a domain.",
  },
  {
    id: "brevo",
    name: "Brevo",
    keysAt: "app.brevo.com/settings/keys/api",
    needsDomain: false,
    blurb: "Free tier sends a few hundred a day from a verified address.",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    keysAt: "app.sendgrid.com/settings/api_keys",
    needsDomain: false,
    blurb: "Needs the sender address verified under Single Sender Verification.",
  },
  {
    id: "mailgun",
    name: "Mailgun",
    keysAt: "app.mailgun.com/settings/api_security",
    needsDomain: true,
    blurb: "Needs your sending domain as well as the key.",
  },
];

export function relayProvider(id: string): RelayProvider | null {
  return RELAY_PROVIDERS.find((p) => p.id === id) ?? null;
}

export interface MailConfig {
  mode: MailMode;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  provider: string;
  apiKey: string;
  domain: string;
  fromName: string;
  fromEmail: string;
}

/** What the Settings panel is allowed to see: everything but the secrets. */
export type MailConfigView = Omit<MailConfig, "password" | "apiKey"> & {
  hasPassword: boolean;
  hasApiKey: boolean;
};
