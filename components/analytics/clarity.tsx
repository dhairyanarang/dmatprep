import Script from 'next/script'

/** Public by design — it appears in the page source of every site using Clarity. */
const CLARITY_PROJECT_ID = 'y23r5jb7md'

/**
 * Microsoft Clarity, loaded once for the whole app.
 *
 * Gated on `VERCEL_ENV` rather than `NODE_ENV`, which is deliberate: `NODE_ENV`
 * is `production` for any local production build too, so it would send a
 * developer's own clicking around into the same funnel as real candidates.
 * `VERCEL_ENV` is only `production` on a production deployment, so previews and
 * localhost are both excluded without needing a second flag.
 *
 * This is a server component and every route is static, so the branch is
 * resolved at build time — outside production the tag is not in the HTML at
 * all, rather than shipped and then skipped.
 *
 * The loader is the whole integration. Nothing here calls `clarity('identify')`
 * or sets custom tags, so no user id, email or session token is ever handed
 * over; what Clarity sees is what any visitor's browser already renders. The
 * one place the product puts an email on screen — the account menu — carries
 * `data-clarity-mask` so it is redacted in replays.
 *
 * `afterInteractive` keeps it off the critical path: it loads once the page is
 * usable, so it cannot delay hydration, the search dialog or a practice answer.
 */
export function Clarity() {
  if (process.env.VERCEL_ENV !== 'production') return null

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
    </Script>
  )
}
