/**
 * The scroll behaviour to ask for, given the viewer's motion preference.
 *
 * `scrollIntoView({ behavior: 'smooth' })` is a JavaScript argument and ignores
 * the CSS `scroll-behavior: auto` that the reduced-motion block in
 * `app/globals.css` sets — so a candidate who has asked for less motion would
 * still get the page gliding under them every time they jumped to a question.
 * Asking here keeps the two in step.
 */
export function scrollBehavior(): ScrollBehavior {
  if (typeof window === 'undefined' || !window.matchMedia) return 'auto'
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}
