import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 15 * 60 * 1000;

function getSigningSecret(): string {
  const key = process.env.AUTH_ENCRYPTION_KEY;
  if (key && key.length >= 32) return key;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_ENCRYPTION_KEY must be set in production.");
  }
  return "northium-dev-human-check";
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
}

function randomDigit(): number {
  return randomInt(1, 10);
}

export type MathChallenge = {
  token: string;
  question: string;
};

export function createMathChallenge(): MathChallenge {
  const a = randomDigit();
  const b = randomDigit();
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${a}:${b}:${expiresAt}`;
  const token = `${Buffer.from(payload).toString("base64url")}.${signPayload(payload)}`;

  return {
    token,
    question: `What is ${a} + ${b}?`,
  };
}

export function verifyMathChallenge(token: string, answer: number): boolean {
  if (!Number.isInteger(answer) || answer < 2 || answer > 18) {
    return false;
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const expectedSig = signPayload(payload);
  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expectedSig);
  if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
    return false;
  }

  const [aRaw, bRaw, expiresRaw] = payload.split(":");
  const a = Number(aRaw);
  const b = Number(bRaw);
  const expiresAt = Number(expiresRaw);

  if (
    !Number.isInteger(a) ||
    !Number.isInteger(b) ||
    a < 1 ||
    a > 9 ||
    b < 1 ||
    b > 9 ||
    !Number.isFinite(expiresAt) ||
    Date.now() > expiresAt
  ) {
    return false;
  }

  return answer === a + b;
}
