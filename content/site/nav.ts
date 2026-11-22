/**
 * The public site's navigation, as content rather than markup.
 *
 * Five destinations and no more. The product's own sidebar is held to five
 * rows for the same reason — a nav that grows quietly stops being a nav — and
 * the two are separate lists on purpose: this one is what a stranger needs,
 * that one is what somebody mid-preparation needs.
 */
export type SiteNavItem = { href: string; label: string }

export const SITE_NAV: SiteNavItem[] = [
  { href: '/exam', label: 'The exam' },
  { href: '/guides', label: 'Guides' },
  { href: '/faq', label: 'FAQ' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
]

/**
 * The three Core subtests, for the places the public site lists them.
 *
 * `href` points at each subtest's existing in-product overview — the page that
 * already explains the rules, the method and the worked examples. Writing a
 * second public explanation of the same material would split the content in
 * two and compete with itself in search results.
 */
export const CORE_SUBTESTS = [
  {
    id: 'figure-sequences',
    name: 'Figure Sequences',
    href: '/module-a/figure-sequences/overview',
    practiceHref: '/module-a/figure-sequences/practice',
    blurb:
      'Four matrices are shown and you work out the fifth and sixth. Symbols move, turn and change colour at the same time, and the rule has to be read off the sequence rather than guessed.',
  },
  {
    id: 'mathematical-equations',
    name: 'Mathematical Equations',
    href: '/module-a/mathematical-equations/overview',
    practiceHref: '/module-a/mathematical-equations/practice',
    blurb:
      'Small systems of equations where every letter is a whole number from 1 to 20 and exactly one solution fits. No notes, no calculator, so the work is done in your head.',
  },
  {
    id: 'latin-squares',
    name: 'Latin Squares',
    href: '/module-a/latin-squares/overview',
    practiceHref: '/module-a/latin-squares/practice',
    blurb:
      'A five-by-five grid where every letter appears once in each row and column. One cell is marked, and the chain of deductions that fixes it is the whole task.',
  },
] as const
