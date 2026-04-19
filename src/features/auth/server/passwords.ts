import { hash, compare } from "bcryptjs";

export const DEFAULT_PASSWORD_SUFFIX = "123456";
export const MIN_PASSWORD_LENGTH = 8;

export function buildDefaultPasswordFromMobile(mobileNumber: string) {
  const digits = mobileNumber.replace(/\D/g, "");
  const lastFourDigits = digits.slice(-4).padStart(4, "0");
  return `${lastFourDigits}${DEFAULT_PASSWORD_SUFFIX}`;
}

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export function validatePasswordRules(password: string) {
  const checks = {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  return {
    valid: Object.values(checks).every(Boolean),
    checks,
  };
}
