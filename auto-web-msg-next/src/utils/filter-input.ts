export function parseDelimitedInput(value: string): string[] {
  return String(value || "")
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseNonNegativeIntegerInput(value: string): number | null {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  return Math.max(0, parsed);
}

export function parsePositiveIntegerInput(value: string): number | null {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}
