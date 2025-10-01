import QRCode from "qrcode";

const cache = new Map<string, Promise<string>>();

export function getQrCodeDataUrl(value: string): Promise<string> {
  if (!cache.has(value)) {
    cache.set(
      value,
      QRCode.toDataURL(value, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 280,
        color: {
          dark: "#1f2937",
          light: "#ffffff",
        },
      }),
    );
  }

  return cache.get(value)!;
}
