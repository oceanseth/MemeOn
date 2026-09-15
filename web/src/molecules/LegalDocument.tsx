import { Link } from 'react-router-dom'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { cn } from '../lib/cn'
import type { LegalBlock, LegalDocumentModel, LegalInline } from '../lib/legalDocumentModel'

export type { LegalDocumentModel, LegalDocumentSection } from '../lib/legalDocumentModel'

/** Legal page layout: 720 measure, section hairlines. */
const SECTION = 'mt-6 border-b border-line pb-5.5 last:border-b-0'
const H2 = cn(
  'm-0 font-display text-card-title font-medium tracking-card-title text-ink',
  '[scroll-margin-top:calc(var(--topbar-h)+16px)]',
)
const P = 'mt-4 mb-0 max-w-measure text-body text-ink'
const A = 'text-link underline underline-offset-3 decoration-1 font-semibold'
const LIST = 'mt-2.5 mb-0 list-disc pl-6'
const LIST_ITEM_FIRST = cn(P, 'mt-0')
const LIST_ITEM = cn(P, 'mt-2.5')
/** The cross-link that closes the document: 16/24, 600, ultraviolet, underline offset 3. */
const CROSS_LINK = cn(A, 'inline-block mt-2.5')

/* TOC chips: 44px target; current section is pressed, rest are outlined */
const TOC_CHIP = cn(
  'inline-flex min-h-11 items-center rounded-control px-3.5 text-small/5 text-ink no-underline',
  '[transition:background-color_var(--dur-base)_ease] motion-reduce:transition-none',
)
const TOC_CHIP_REST = cn(TOC_CHIP, 'border border-line hover:bg-surface-raised')
const TOC_CHIP_CURRENT = cn(TOC_CHIP, 'border-0 bg-surface-pressed shadow-pressed')

function Inline({ inline }: { inline: LegalInline }) {
  if (typeof inline === 'string') return inline
  switch (inline.kind) {
    case 'strong':
      return <strong>{inline.text}</strong>
    case 'code':
      return <code>{inline.text}</code>
    case 'link':
      return <Link className={A} to={inline.to}>{inline.text}</Link>
    case 'external':
      return <a className={A} href={inline.href} target="_blank" rel="noopener noreferrer">{inline.text}</a>
    case 'mailto':
      return <a className={A} href={inline.href}>{inline.text}</a>
  }
}

/* prose segments have no identity of their own; their order is the only key there is */
const inlines = (segments: readonly LegalInline[]) =>
  segments.map((inline, index) => <Inline key={index} inline={inline} />)

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === 'list') {
    return (
      <ul className={LIST}>
        {block.items.map((item, index) => (
          <li key={item.key} className={index === 0 ? LIST_ITEM_FIRST : LIST_ITEM}>{inlines(item.inlines)}</li>
        ))}
      </ul>
    )
  }
  return <p className={P}>{inlines(block.inlines)}</p>
}

/** Shared chrome for Privacy and Terms: TOC chips, section hairlines, cross-link. */
export function LegalDocument({ title, updated, tocLabel, toc, sections, crossLink }: LegalDocumentModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1} narrow className="pt-9">
      <PageHead
        level="h1"
        title={title}
        subtitle={<>{updated.prefix} <time dateTime={updated.datetime}>{updated.label}</time></>}
        className="mb-5"
      />

      <nav aria-label={tocLabel}>
        <ul data-slot="legal-toc" className="m-0 flex list-none flex-wrap gap-2 p-0">
          {toc.map((entry, index) => (
            <li key={entry.id}>
              <a className={index === 0 ? TOC_CHIP_CURRENT : TOC_CHIP_REST} href={`#${entry.id}`}>
                {entry.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {sections.map((section, index) => (
        <section
          key={section.id}
          data-slot="legal-section"
          className={cn(SECTION, index === 0 && 'mt-8')}
        >
          <h2 className={H2} id={section.id}>{section.heading}</h2>
          {section.blocks.map((block, blockIndex) => <Block key={blockIndex} block={block} />)}
          {index === sections.length - 1 && (
            <p className="m-0">
              <Link className={CROSS_LINK} to={crossLink.to}>
                {crossLink.label} <span aria-hidden="true">→</span>
              </Link>
            </p>
          )}
        </section>
      ))}
    </PageContainer>
  )
}
