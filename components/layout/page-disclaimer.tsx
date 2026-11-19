import Link from 'next/link'

import { cn } from '@/lib/utils'

/**
 * The independence statement, where someone would actually read it.
 *
 * It used to sit in a global footer under every screen, including practice and
 * the mocks — three paragraphs of legal text below a question someone was in
 * the middle of answering. The wording here is unchanged from that footer,
 * deliberately: it is a disclosure, not copy to improve.
 *
 * What changed is where it lives. The informational pages carry it in full;
 * every other page keeps the one-line version in the sidebar, which is what
 * holds `release:check`'s "on every page" assertion. Repeating the full block
 * on a practice screen is what made the product feel like a brochure.
 *
 * Visually secondary on purpose — no card, no border box, no heading. A quiet
 * block at the end of the content, not a second footer.
 */
export function PageDisclaimer({
  className,
  showMoreLink = true,
}: {
  className?: string
  /** Omitted on /about, which IS the fuller statement. */
  showMoreLink?: boolean
}) {
  return (
    <aside
      aria-label="About this resource"
      className={cn('border-border/70 text-muted-foreground border-t pt-5 text-xs leading-relaxed', className)}
    >
      <p>
        <span className="text-foreground font-medium">
          dMAT Prep is an independent preparation resource.
        </span>{' '}
        It is not affiliated with, endorsed by, or sponsored by g.a.s.t. (Gesellschaft für
        Akademische Studienvorbereitung und Testentwicklung e.&nbsp;V.) or APS India. The
        examination name is used only to identify the examination this resource prepares candidates
        for.
      </p>

      <p className="mt-2.5">
        Practice questions here are independently developed study exercises. They are not official
        examination questions and are not reproduced from the live examination; the real
        examination may differ in content, difficulty and structure. Using dMAT Prep guarantees no
        examination result or admission outcome. dMAT is a trademark of g.a.s.t.
        {showMoreLink ? (
          <>
            {' '}
            <Link className="hover:text-foreground underline underline-offset-2" href="/about">
              More about this resource
            </Link>
            .
          </>
        ) : null}
      </p>
    </aside>
  )
}
