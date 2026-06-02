import crypto from "node:crypto";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not set.");
  }

  return crypto.scryptSync(secret, "pathly-secrets", 32);
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", getSecretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(payload: string) {
  const [ivHex, tagHex, encryptedHex] = payload.split(":");

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Encrypted secret payload is invalid.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getSecretKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
