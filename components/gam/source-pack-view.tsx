import { GamFigure } from '@/components/gam/figure'
import type { SourceBlock, SourcePack } from '@/lib/types/gam'

/**
 * The source, as the candidate sees it.
 *
 * This is the half of GAM that Module A has no equivalent for: the questions
 * mean nothing without it, so it is presented as a document rather than as a
 * preamble, and it stays on screen while the questions are answered.
 */
export function SourcePackView({ pack }: { pack: SourcePack }) {
  return (
    <article className="space-y-4">
      {pack.blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </article>
  )
}

function Block({ block }: { block: SourceBlock }) {
  switch (block.kind) {
    case 'heading':
      return <h2 className="text-xl tracking-tight">{block.text}</h2>

    case 'paragraph':
      return <p className="text-[15px] leading-relaxed">{block.text}</p>

    case 'list':
      return block.ordered ? (
        <ol className="list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )

    case 'formula':
      return (
        <div className="border-border bg-card space-y-3 rounded-xl border p-4">
          {/* Mono is reserved for equations, grid letters and ids. */}
          <p className="font-mono text-sm">{block.latex}</p>
          {block.caption ? (
            <p className="text-muted-foreground text-xs">{block.caption}</p>
          ) : null}
          {block.legend?.length ? (
            <dl className="grid gap-1.5 text-xs sm:grid-cols-2">
              {block.legend.map((entry) => (
                <div key={entry.symbol} className="flex gap-2">
                  <dt className="text-foreground font-mono">{entry.symbol}</dt>
                  <dd className="text-muted-foreground">{entry.meaning}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      )

    case 'table':
      return (
        <figure className="space-y-2">
          {/* Wide content scrolls inside its own box; the page never does. */}
          <div className="border-border overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  {block.columns.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i} className="border-border/60 border-b last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className={j === 0 ? 'px-3 py-2' : 'px-3 py-2 font-mono'}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <figcaption className="text-muted-foreground text-xs">{block.caption}</figcaption>
        </figure>
      )

    case 'figure':
      return <GamFigure spec={block.spec} caption={block.caption} />

    default:
      return null
  }
}
