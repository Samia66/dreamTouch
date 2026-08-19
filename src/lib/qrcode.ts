import QRCode from "qrcode";

/** Genere un QR Code (PNG buffer) encodant uniquement le token opaque —
 * jamais de donnees personnelles. */
export async function renderQrPng(qrToken: string): Promise<Buffer> {
  return QRCode.toBuffer(qrToken, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 480,
    color: { dark: "#08070A", light: "#F3F1EC" }
  });
}

export async function renderQrDataUrl(qrToken: string): Promise<string> {
  return QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 480,
    color: { dark: "#08070A", light: "#F3F1EC" }
  });
}
