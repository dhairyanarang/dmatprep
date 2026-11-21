/**
 * How large the free Core sample is.
 *
 * The list itself lives in `content/access/free-set.json`, which carries 150
 * question ids. This is the count alone, because the sidebar shows "N of 150
 * used" on every page and importing the file to count it would ship all 150
 * ids into every route's bundle.
 *
 * `scripts/test/free-set.test.mjs` asserts these match the file, so the saving
 * cannot cost accuracy.
 */
export const FREE_PER_SECTION = 50
export const FREE_SECTIONS = 3
export const FREE_TOTAL = FREE_PER_SECTION * FREE_SECTIONS
