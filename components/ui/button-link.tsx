import Link from 'next/link'
import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'

/**
 * A button-styled link.
 *
 * Base UI's Button assumes a native `<button>` unless told otherwise, and warns
 * — correctly — that rendering an anchor through `render` strips button
 * semantics. Rather than repeating `nativeButton={false}` at every call site and
 * eventually forgetting it, navigation gets its own component.
 */
export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  ...props
}: { href: string } & Omit<ComponentProps<typeof Button>, 'render' | 'nativeButton'>) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      nativeButton={false}
      render={<Link href={href} />}
      {...props}
    >
      {children}
    </Button>
  )
}
