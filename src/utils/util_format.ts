import latinize from "latinize";

export function formatLatinize(text: string): string {
  const result = latinize(text);
  return result
}