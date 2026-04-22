export function parseReceiptPaths(value: string | null | undefined): string[] {
  if (!value) return [];
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((s): s is string => typeof s === "string" && s.length > 0);
      }
    } catch {
      // Fall through to legacy handling
    }
  }
  return [value];
}

export function serializeReceiptPaths(paths: string[]): string | null {
  const cleaned = paths.filter((p) => p && p.length > 0);
  if (cleaned.length === 0) return null;
  return JSON.stringify(cleaned);
}
