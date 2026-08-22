/**
 * Firestore has no native full-text search. We tokenize the searchable fields
 * into a flat lowercase array and query it with `array-contains` on a single
 * normalized token — a zero-infra compromise vs. Algolia/Typesense, at the
 * cost of no true substring or multi-word AND matching server-side.
 */
export function buildSearchKeywords(...fields: (string | null | undefined)[]): string[] {
  const tokens = new Set<string>();
  for (const field of fields) {
    if (!field) continue;
    for (const rawToken of field.toLowerCase().split(/[^a-z0-9]+/)) {
      if (rawToken.length > 1) tokens.add(rawToken);
    }
  }
  return Array.from(tokens);
}

export function normalizeSearchTerm(term: string): string {
  return term.trim().toLowerCase().split(/[^a-z0-9]+/)[0] ?? "";
}
