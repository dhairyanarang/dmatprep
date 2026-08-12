
---

# Implementation in this project

> Everything above describes Linear's system as the reference. This section
> records how it is actually applied in the dMAT prep hub, including where and
> why it deviates. Keep it current — it is the bridge between the reference and
> the code.

## Where the system lives

| Concern | Location |
|---|---|
| All colour, radius and tracking tokens | `app/globals.css` (`:root` and `.dark`) |
| Fonts | `app/layout.tsx` — Inter Variable, JetBrains Mono |
| Shared visual primitives | `components/exam/visuals.tsx` |
| Explanatory diagrams | `components/exam/diagrams.tsx` |
| shadcn primitives (owned source) | `components/ui/` |

Change values in `globals.css`, never at the call site. Components reference
semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`,
`bg-success-tint`) so a token edit propagates everywhere, including Figma-facing
exports.

## Token mapping

| Reference | Token here | Light | Dark |
|---|---|---|---|
| Void | `--background`, `--sidebar` | `#ffffff` | `#08090a` |
| Carbon | `--card` | `#ffffff` | `#0f1011` |
| Obsidian | `--popover`, `--muted` | `#f6f6f7` | `#161718` |
| Slate | `--accent`, `--sidebar-accent` | `#f0f0f1` | `#23252a` |
| Graphite | `--border` | `#e5e5e6` | `#23252a` |
| Fog | `--muted-foreground` | `#62666d` | `#8a8f98` |
| Paper | `--foreground` | `#08090a` | `#ffffff` |
| Acid Lime | `--primary` | `#e4f222` | `#e4f222` |
| Iris Violet | `--figures` | `#6366f1` | `#6366f1` |
| Lavender | `--equations` | `#8b5cf6` | `#8b5cf6` |
| Signal Teal | `--latin` | `#02b8cc` | `#02b8cc` |
| Pulse Green | `--success` | `#27a644` | `#27a644` |
| Coral Red | `--danger` | `#eb5757` | `#eb5757` |

Each semantic colour has a `-fg` (text on tint) and `-tint` (fill) companion, so
a status surface is always `bg-*-tint` + `text-*-fg` + `border-*`.

## Rules this project holds itself to

1. **Acid lime plays exactly two roles**: the single primary button on a view,
   and the active nav marker. Not progress fills, not logos, not selection
   states, not links.
2. **Chromatic colours are fills, never text.** Acid lime as type is 1.23:1 on
   the light card. Anything coloured must be a fill with a dark foreground.
3. **Section hues are tags.** Dots, eyebrows and tab underlines only — they
   identify a subtest, they never signal an action.
4. **Weights cap at 590.** `font-semibold` → 590 and `font-medium` → 510 are
   remapped in the base layer, so nothing can render bold even if a class says so.
5. **Three radii**: 4 badges, 6 buttons/inputs, 12 cards. Tokens above 12 are
   capped at 12.
6. **Borders, not shadows.** The one exception the reference allows — an inset
   stack on the lime CTA — is not used here.
7. **Both themes, every time.** Dark is native, but nothing ships without
   checking light: the two failures found so far were both invisible on dark.

## Deviations, and why

- **Pulse Green and Coral Red carry status.** The reference calls them supporting
  accents, not status colours. A practice app's core interaction is right versus
  wrong; signalling that in greys would break the product to satisfy the guide.
- **No caution hue.** The reference has none, so "inferred" renders as a neutral
  marked state rather than an invented amber. "Unconfirmed" uses Coral Red.
- **Figure panels stay light in both themes.** Explanations refer to "the black
  diamond", so inverting the panel for dark mode would make a symbol the text
  calls black render white. Dark mode dims the panel to Mist instead of using
  Carbon.
- **The marketing type scale is unused.** 48–72px display sizes have no place in
  a dense dashboard; only the 10–32px UI end of the ramp is implemented.
