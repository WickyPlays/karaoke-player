import transliterate from '@sindresorhus/transliterate';

export function formatLatinize(text: string): string {
  const result = transliterate(text);
  return result
}