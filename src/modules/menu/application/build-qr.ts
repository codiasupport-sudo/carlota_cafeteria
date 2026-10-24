import QRCode from "qrcode";

/** RF-18: un solo QR hacia la dirección fija del menú. Colores de docs/diseno.md (vino sobre blanco). */
export async function buildQr(menuUrl: string): Promise<{ url: string; png: Buffer; svg: string }> {
  const url = new URL(menuUrl).toString(); // lanza si la dirección no es válida
  const options = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: "#62110D", light: "#FFFFFF" } };
  const png = await QRCode.toBuffer(url, { ...options, type: "png", width: 1024 });
  const svg = await QRCode.toString(url, { ...options, type: "svg" });
  return { url, png, svg };
}
