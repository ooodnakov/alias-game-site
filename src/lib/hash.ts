import { createHash } from "node:crypto";

export function sha256FromString(input: string) {
  return createHash("sha256").update(input).digest("hex");
}
