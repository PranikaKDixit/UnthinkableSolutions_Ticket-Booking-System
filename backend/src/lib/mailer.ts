import nodemailer, { Transporter } from "nodemailer";
import { env } from "./env";

/**
 * Lazily-created mail transport.
 *
 * - If SMTP_HOST is configured, we use those real credentials (Gmail, Mailtrap,
 *   SendGrid SMTP, etc — "any free tier service" per the spec).
 * - Otherwise we spin up a throwaway Ethereal test account so the whole booking
 *   flow works with zero setup; every send logs a preview URL you can open to
 *   see the rendered email.
 */
let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (env.smtp.host) {
      return nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure,
        auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
      });
    }

    // No real SMTP configured — fall back to Ethereal (dev-friendly).
    const test = await nodemailer.createTestAccount();
    console.log("[mailer] No SMTP_HOST set — using Ethereal test account:", test.user);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: test.user, pass: test.pass },
    });
  })();

  return transporterPromise;
}

type SendArgs = { to: string; subject: string; html: string };

/**
 * Send an email. Never throws to the caller — email is best-effort so a mail
 * outage can't fail a confirmed booking. Errors are logged; Ethereal sends log
 * a preview URL.
 */
export async function sendMail({ to, subject, html }: SendArgs): Promise<void> {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({ from: env.smtp.from, to, subject, html });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`[mailer] "${subject}" -> ${to} | preview: ${preview}`);
    else console.log(`[mailer] "${subject}" -> ${to} sent (${info.messageId})`);
  } catch (err) {
    console.error(`[mailer] failed to send "${subject}" to ${to}:`, err);
  }
}

/* --------------------------- email templates --------------------------- */

function shell(title: string, body: string): string {
  return `
  <div style="background:#07070c;padding:32px 0;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#12121b;border:1px solid #23232f;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#f6c453,#d4a017);padding:20px 28px;">
        <span style="font-size:20px;font-weight:800;color:#0b0b12;">${env.appName}</span>
      </div>
      <div style="padding:28px;color:#e5e7eb;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#fff;">${title}</h1>
        ${body}
      </div>
      <div style="padding:16px 28px;border-top:1px solid #23232f;color:#6b7280;font-size:12px;">
        ${env.appName} · This is an automated message.
      </div>
    </div>
  </div>`;
}

export type TicketEmailData = {
  to: string;
  name: string;
  reference: string;
  eventTitle: string;
  venueName: string;
  startsAt: Date;
  seats: string[];
  totalAmount: number;
  qr: string; // data-URL
};

export function sendTicketEmail(d: TicketEmailData): Promise<void> {
  const rupees = `₹${(d.totalAmount / 1).toLocaleString("en-IN")}`;
  const body = `
    <p style="margin:0 0 16px;color:#9ca3af;">Hi ${d.name}, your booking is confirmed. Show this QR code at the entrance.</p>
    <div style="text-align:center;margin:20px 0;">
      <img src="${d.qr}" alt="Ticket QR code" width="200" height="200" style="border-radius:12px;background:#fff;padding:8px;" />
      <div style="margin-top:10px;font-family:monospace;font-size:16px;color:#f6c453;">${d.reference}</div>
    </div>
    <table style="width:100%;font-size:14px;color:#d1d5db;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#9ca3af;">Event</td><td style="text-align:right;">${d.eventTitle}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af;">Venue</td><td style="text-align:right;">${d.venueName}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af;">When</td><td style="text-align:right;">${d.startsAt.toLocaleString("en-IN")}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af;">Seats</td><td style="text-align:right;">${d.seats.join(", ")}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af;">Total paid</td><td style="text-align:right;color:#f6c453;font-weight:700;">${rupees}</td></tr>
    </table>`;
  return sendMail({ to: d.to, subject: `Your ${env.appName} ticket — ${d.reference}`, html: shell("Booking confirmed 🎟️", body) });
}

export type OfferEmailData = {
  to: string;
  name: string;
  eventTitle: string;
  categoryName: string;
  seatLabel: string;
  offerUrl: string;
  expiresAt: Date;
};

export function sendOfferEmail(d: OfferEmailData): Promise<void> {
  const body = `
    <p style="margin:0 0 16px;color:#9ca3af;">Good news ${d.name} — a <strong>${d.categoryName}</strong> seat (${d.seatLabel}) has opened up for <strong>${d.eventTitle}</strong>.</p>
    <p style="margin:0 0 20px;color:#9ca3af;">You're next on the waitlist. Claim it before <strong>${d.expiresAt.toLocaleString("en-IN")}</strong> or it passes to the next person.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${d.offerUrl}" style="display:inline-block;background:linear-gradient(135deg,#f6c453,#d4a017);color:#0b0b12;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;">Claim my seat</a>
    </div>
    <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">Or paste this link: ${d.offerUrl}</p>`;
  return sendMail({ to: d.to, subject: `A seat opened up for ${d.eventTitle} — claim it now`, html: shell("You've been offered a seat ⏳", body) });
}
