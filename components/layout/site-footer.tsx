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
 * Three sentences, not four. The fourth — that every practice question is
 * independently authored — is true of the GAM packs, which carry an originality
 * gate and recorded adjudication, and is *unevidenced* for the 473 Core
 * questions, which have no originality field and no originality gate. The claim
 * goes in when the provenance audit supports it, and not before.
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
          dMAT is a trademark of g.a.s.t. Practice material in this hub is written for dMAT Prep
          and is not official examination material.
        </p>

        <nav aria-label="Site information" className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
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
