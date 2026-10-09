import { randomInt } from "node:crypto";

export const PRIVATE_ROOM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export const PRIVATE_ROOM_CODE_LENGTH = 4;
export const BOMBERMAN_ROOM_CODE_LENGTH = 6;

export function normalizePrivateRoomCode(value: unknown, lengths: readonly number[] = [PRIVATE_ROOM_CODE_LENGTH]): string | undefined {
  if (typeof value !== "string") return undefined;
  const code = value.trim().toUpperCase();
  return lengths.includes(code.length) && /^[A-Z0-9]+$/.test(code) ? code : undefined;
}

export function generatePrivateRoomCode(isTaken: (code: string) => boolean, length = PRIVATE_ROOM_CODE_LENGTH): string {
  if (length !== PRIVATE_ROOM_CODE_LENGTH && length !== BOMBERMAN_ROOM_CODE_LENGTH) {
    throw new Error("Unsupported private room code length");
  }
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = "";
    for (let index = 0; index < length; index++) {
      code += PRIVATE_ROOM_CODE_ALPHABET[randomInt(PRIVATE_ROOM_CODE_ALPHABET.length)];
    }
    if (!isTaken(code)) return code;
  }
  throw new Error("Unable to allocate an unused private room code");
}

export class PrivateRoomCodeRateLimiter {
  private readonly attempts = new Map<string, { start: number; count: number }>();

  constructor(private readonly limit = 30, private readonly windowMs = 60_000) {}

  take(source: string, now = Date.now()): boolean {
    const key = source || "unknown";
    let bucket = this.attempts.get(key);
    if (!bucket || now - bucket.start >= this.windowMs) {
      bucket = { start: now, count: 0 };
      this.attempts.set(key, bucket);
    }
    if (bucket.count >= this.limit) return false;
    bucket.count++;
    if (this.attempts.size > 10_000) {
      for (const [address, current] of this.attempts) {
        if (now - current.start >= this.windowMs) this.attempts.delete(address);
      }
    }
    return true;
  }
}
