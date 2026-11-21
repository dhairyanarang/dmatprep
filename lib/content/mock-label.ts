/**
 * "core-mock-3" → "Core mock 3", and null for anything that is not one.
 *
 * Its own module, with no imports at all, for two reasons that pull the same
 * way. `lib/breadcrumbs.ts` runs in the top bar, which is on every page, so
 * reaching into `content/access/core-mocks.json` to read four strings would
 * ship all 240 question ids into every route's bundle. And the test that keeps
 * this honest runs under plain Node, which cannot resolve the `@/` alias — so
 * anything it needs to import has to stand alone.
 *
 * `scripts/test/core-mocks.test.mjs` asserts that what this derives equals the
 * label each mock actually carries, so the saving cannot cost accuracy.
 */
export function coreMockLabel(id: string): string | null {
  const m = /^core-mock-([1-9][0-9]*)$/.exec(id)
  return m ? `Core mock ${m[1]}` : null
}

/**
 * How many fixed mocks there are, and their ids, for the places that need to
 * name them without reading the file — global search, which ships to the
 * client on every page.
 *
 * Covered by the same test as `coreMockLabel`: it asserts these ids ARE the
 * committed ones, so adding a fifth mock to `core-mocks.json` without
 * updating this fails rather than quietly hiding it from search.
 */
export const CORE_MOCK_COUNT = 4

export const CORE_MOCK_IDS: string[] = Array.from(
  { length: CORE_MOCK_COUNT },
  (_, i) => `core-mock-${i + 1}`,
)

/** Questions in one mock — three subtests of twenty. */
export const CORE_MOCK_SIZE = 60
