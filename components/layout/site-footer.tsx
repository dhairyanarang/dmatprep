import Link from 'next/link'

/**
 * The independence statement, on every page.
 *
 * It used to live on `/privacy` alone, which is linked from the account menu
 * and the search dialog and nowhere else — and in guest mode the account menu
 * renders an inert icon with no link at all. So for the product's primary
 * audience the only "not affiliated with g.a.s.t." sentence in the whole
 * product was reachable only by opening the command palette and searching for
 * it. A build-output grep for `href="/privacy"` on the home page returned zero.
 *
 * The originality sentence went in on 18 November 2026, under the condition
 * this comment used to set: when the provenance audit supports it, and not
 * before. It now does. All 384 active Core questions carry
 * `provenance.originality = 'original-generated'`, every GAM pack carries
 * `originality: 'original'`, and the originality corpus — 14,656 hashed 8-grams
 * from both builds of the official preparatory materials — finds zero overlap
 * in Figure Sequences and Mathematical Equations and four incidental
 * solver-generated phrases in Latin Squares.
 *
 * What is NOT claimed here, because the records do not support it: that any of
 * it has been reviewed or approved. The GAM packs sit at `automated-pass` and
 * Module B says so on its own page. "Independently developed" is a statement
 * about where the material came from, not about who has checked it.
 *
 * Short on purpose. The full statement lives at /about; a practice screen is
 * not the place for three paragraphs of legal text.
 */
export function SiteFooter() {
  return (
    <footer className="border-border bg-card mt-auto border-t">
      <div className="text-muted-foreground mx-auto w-full max-w-5xl px-5 py-6 text-xs leading-relaxed sm:px-8">
        <p>
          <span className="text-foreground font-medium">dMAT Prep is an independent preparation resource.</span>{' '}
          It is not affiliated with, endorsed by, or sponsored by g.a.s.t. (Gesellschaft für
          Akademische Studienvorbereitung und Testentwicklung e.&nbsp;V.) or APS India. The
          examination name is used only to identify the examination this resource prepares
          candidates for.
        </p>

        <p className="mt-3">
          Practice questions here are independently developed study exercises. They are not
          official examination questions and are not reproduced from the live examination; the
          real examination may differ in content, difficulty and structure. Using dMAT Prep
          guarantees no examination result or admission outcome. dMAT is a trademark of g.a.s.t.{' '}
          <Link className="hover:text-foreground underline underline-offset-2" href="/about">
            More about this resource
          </Link>
          .
        </p>

        <nav aria-label="Site information" className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <Link className="hover:text-foreground underline underline-offset-2" href="/about">
            About this resource
          </Link>
          <Link className="hover:text-foreground underline underline-offset-2" href="/privacy">
            Your data
          </Link>
          <Link className="hover:text-foreground underline underline-offset-2" href="/exam/sources">
            Sources
          </Link>
          <a
            className="hover:text-foreground underline underline-offset-2"
            href="https://www.d-mat.de/en/"
            rel="noreferrer noopener"
            target="_blank"
          >
            Official dMAT information
          </a>
        </nav>
      </div>
    </footer>
  )
}
