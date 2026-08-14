import Image from 'next/image'

import { cn } from '@/lib/utils'

/**
 * The decorative artwork behind every teal surface.
 *
 * The fade is part of the asset, not something CSS adds: the artwork's left
 * edge is opaque `#025964` — exactly `--brand` — and its alpha ramps to zero
 * toward the right, so anchored to the right of a brand-teal banner it
 * dissolves into the surface on its own. That is why there is no gradient
 * overlay here; adding one would only fight the one already painted in.
 *
 * Width is a percentage of the banner and the height follows, so the artwork is
 * only ever scaled uniformly — never stretched, mirrored or rotated. Anything
 * taller than the banner is clipped by the parent's `overflow-hidden`, which is
 * the intended crop.
 *
 * `next/image` rather than a CSS background: the source is a 439KB PNG, and this
 * way it is served as AVIF/WebP at the size actually needed rather than in full
 * on every page load.
 */
export function BrandPattern({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/banner-pattern.png"
      alt=""
      aria-hidden
      width={808}
      height={510}
      sizes="(max-width: 640px) 50vw, 440px"
      priority={false}
      className={cn(
        'pointer-events-none absolute top-1/2 right-0 h-auto w-[45%] max-w-none -translate-y-1/2 select-none',
        className,
      )}
    />
  )
}
