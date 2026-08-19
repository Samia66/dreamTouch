import PDFDocument from "pdfkit";
import { renderQrPng } from "./qrcode";

export interface TicketPdfData {
  eventName: string;
  eventEdition: string;
  experienceName: string;
  participantFullName: string;
  reference: string;
  ticketNumber: string;
  date: string; // libelle deja formate ("A definir" si NULL)
  location: string; // libelle deja formate
  duration: string;
  pricePaid: number;
  currency: string;
  qrToken: string;
}

const GOLD = "#D9B25C";
const BONE = "#F3F1EC";
const VOID = "#08070A";
const MIST = "#8B8894";

/** Genere un ticket PDF elegant noir/blanc/dore. Retourne un Buffer. */
export async function generateTicketPdf(data: TicketPdfData): Promise<Buffer> {
  const qrPng = await renderQrPng(data.qrToken);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [420, 720], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Fond
    doc.rect(0, 0, 420, 720).fill(VOID);

    // Bandeau superieur
    doc.rect(0, 0, 420, 8).fill(GOLD);

    doc
      .fillColor(GOLD)
      .fontSize(10)
      .font("Helvetica")
      .text("DREAMTOUCH EXPERIENCE", 40, 50, { characterSpacing: 2 });

    doc
      .fillColor(BONE)
      .fontSize(30)
      .font("Helvetica-Bold")
      .text(data.experienceName.toUpperCase(), 40, 72, { width: 340 });

    doc
      .fillColor(MIST)
      .fontSize(11)
      .font("Helvetica")
      .text(`${data.eventName} — Edition ${data.eventEdition}`, 40, 118);

    // Ligne dorée
    doc.moveTo(40, 150).lineTo(380, 150).lineWidth(1).strokeColor(GOLD).stroke();

    // Infos participant
    let y = 175;
    const row = (label: string, value: string) => {
      doc.fillColor(MIST).fontSize(9).font("Helvetica").text(label.toUpperCase(), 40, y, {
        characterSpacing: 1
      });
      doc
        .fillColor(BONE)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(value, 40, y + 13, { width: 340 });
      y += 48;
    };

    row("Participant", data.participantFullName);
    row("Numero de reservation", data.reference);
    row("Numero de ticket", data.ticketNumber);
    row("Date", data.date);
    row("Lieu", data.location);
    row("Duree", data.duration);
    row("Prix paye", `${data.pricePaid.toLocaleString("fr-FR")} ${data.currency}`);

    doc
      .fillColor(GOLD)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("STATUT : CONFIRME", 40, y + 4, { characterSpacing: 1 });

    // QR Code
    const qrSize = 220;
    const qrX = (420 - qrSize) / 2;
    const qrY = y + 50;
    doc.roundedRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 12).fill(BONE);
    doc.image(qrPng, qrX, qrY, { width: qrSize, height: qrSize });

    doc
      .fillColor(MIST)
      .fontSize(9)
      .font("Helvetica")
      .text("Presente ce QR Code a l'entree. Il est unique et personnel.", 40, qrY + qrSize + 34, {
        width: 340,
        align: "center"
      });

    doc
      .fillColor(GOLD)
      .fontSize(9)
      .font("Helvetica")
      .text("Le reste... reste UNKNOWN.", 40, 680, { width: 340, align: "center" });

    doc.rect(0, 712, 420, 8).fill(GOLD);

    doc.end();
  });
}
