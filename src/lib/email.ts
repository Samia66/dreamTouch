import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null; // pas de config SMTP -> on log seulement (dev/sandbox)
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function sendConfirmationEmail(params: {
  to: string;
  firstName: string;
  ticketNumber: string;
  amountPaid: number;
  currency: string;
  whatsappNumber: string;
  pdfBuffer: Buffer;
}) {
  const subject = "🎟️ Ta place pour DreamTouch THE UNKNOWN est confirmée";
  const text = `Bonjour ${params.firstName},

Ton inscription à DreamTouch Experience #001 — THE UNKNOWN est confirmée.

Tu fais officiellement partie des 20 participants.

Numéro de ticket : ${params.ticketNumber}
Montant payé : ${params.amountPaid.toLocaleString("fr-FR")} ${params.currency}

Tu trouveras ton ticket en pièce jointe.

Prépare-toi.

Le reste...
reste UNKNOWN. 👀

DreamTouch Experience
WhatsApp : ${params.whatsappNumber}`;

  const transport = getTransport();

  if (!transport) {
    // Sandbox / SMTP non configure: on trace sans bloquer le flux metier.
    console.info(`[email:sandbox] Aurait envoye "${subject}" a ${params.to}`);
    return { sent: false, reason: "SMTP_NOT_CONFIGURED" as const };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "DreamTouch Experience <no-reply@dreamtouch.example>",
    to: params.to,
    subject,
    text,
    attachments: [
      {
        filename: `${params.ticketNumber}.pdf`,
        content: params.pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });

  return { sent: true as const };
}
