import QRCode from "qrcode";
import crypto from "crypto";

/**
 * Human-readable, collision-resistant booking reference, e.g. "TBS-8F3K2Q7A".
 * This string is what gets encoded into the QR code and printed on the ticket.
 */
export function generateReference(): string {
  const raw = crypto.randomBytes(5).toString("hex").toUpperCase(); // 10 hex chars
  return `TBS-${raw}`;
}

/** Opaque, unguessable token for a time-limited waitlist offer link. */
export function generateOfferToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Render a booking reference as a QR-code PNG data-URL. The QR encodes the
 * booking reference (the spec's requirement: "QR encodes booking reference"),
 * which staff can scan and validate at the door.
 */
export function qrDataUrl(reference: string): Promise<string> {
  return QRCode.toDataURL(reference, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#0b0b12", light: "#ffffff" },
  });
}
