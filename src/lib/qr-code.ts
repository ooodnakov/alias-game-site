import QRCode from "qrcode";
import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, Promise<string>>({
  max: 500,
});

export function getQrCodeDataUrl(value: string): Promise<string> {
  const cached = cache.get(value);
  if (cached) {
    return cached;
  }

  const qrPromise = QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
    color: {
      dark: "#1f2937",
      light: "#ffffff",
    },
  });

  cache.set(value, qrPromise);

  return qrPromise;
}
