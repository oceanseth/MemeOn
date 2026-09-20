import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Heading } from '@/atoms/heading'
import { InlineLink } from '@/atoms/inline-link'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import { Separator } from '@/atoms/separator'
import { toggleVariants } from '@/atoms/toggle'
import { cn } from '../lib/cn'
import type { LegalBlock, LegalDocumentModel, LegalInline } from '../lib/legalDocumentModel'

export type {
  LegalDocumentModel,
  LegalDocumentSection,
} from '../lib/legalDocumentModel'

/** Legal page layout: 720 measure, a hairline between sections. */
const SECTION = 'mt-6 pb-5.5'
/** The heading a TOC chip jumps to docks under the phone's sticky header. */
const H2_SCROLL = '[scroll-margin-top:calc(var(--topbar-h)+16px)]'
const P = 'mt-4 mb-0 max-w-[65ch] text-base text-foreground'
const LIST = 'mt-2.5 mb-0 list-disc pl-6'
const LIST_ITEM_FIRST = cn(P, 'mt-0')
const LIST_ITEM = cn(P, 'mt-2.5')

/**
 * TOC chips are anchors, so they wear the `Toggle` atom's classes rather than its element (a
 * chip that navigates is a link, not a button): the small chip, and the section the page opens
 * on is the pressed one. `data-pressed` is the state Base UI would write on a real toggle.
 */
const TOC_CHIP = toggleVariants({ size: 'sm' })

function Inline({ inline }: { inline: LegalInline }) {
  if (typeof inline === 'string') return inline
  switch (inline.kind) {
    case 'strong':
      return <strong>{inline.text}</strong>
    case 'code':
      return <code>{inline.text}</code>
    case 'link':
      return (
        <InlineLink variant="strong" render={<Link to={inline.to} />}>
          {inline.text}
        </InlineLink>
      )
    case 'external':
      return (
        <InlineLink variant="strong" href={inline.href} target="_blank" rel="noopener noreferrer">
          {inline.text}
        </InlineLink>
      )
    case 'mailto':
      return (
        <InlineLink variant="strong" href={inline.href}>
          {inline.text}
        </InlineLink>
      )
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
          <li key={item.key} className={index === 0 ? LIST_ITEM_FIRST : LIST_ITEM}>
            {inlines(item.inlines)}
          </li>
        ))}
      </ul>
    )
  }
  return <p className={P}>{inlines(block.inlines)}</p>
}

/** Shared chrome for Privacy and Terms: TOC chips, section hairlines, cross-link. */
export function LegalDocument({
  title,
  updated,
  tocLabel,
  toc,
  sections,
  crossLink,
}: LegalDocumentModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1} width="narrow" className="pt-9">
      <PageHead
        level="h1"
        title={title}
        subtitle={
          <>
            {updated.prefix} <time dateTime={updated.datetime}>{updated.label}</time>
          </>
        }
        className="mb-5"
      />

      <nav aria-label={tocLabel}>
        <ul data-slot="legal-toc" className="m-0 flex list-none flex-wrap gap-2 p-0">
          {toc.map((entry, index) => (
            <li key={entry.id}>
              <a
                className={TOC_CHIP}
                href={`#${entry.id}`}
                data-pressed={index === 0 ? '' : undefined}
              >
                {entry.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {sections.map((section, index) => (
        <Fragment key={section.id}>
          <section data-slot="legal-section" className={cn(SECTION, index === 0 && 'mt-8')}>
            <Heading as="h2" size="card-title" id={section.id} className={H2_SCROLL}>
              {section.heading}
            </Heading>
            {section.blocks.map((block, blockIndex) => (
              <Block key={blockIndex} block={block} />
            ))}
            {index === sections.length - 1 && (
              <p className="m-0">
                <InlineLink
                  variant="strong"
                  className="mt-2.5 inline-block"
                  render={<Link to={crossLink.to} />}
                >
                  {crossLink.label} <span aria-hidden="true">→</span>
                </InlineLink>
              </p>
            )}
          </section>
          {index < sections.length - 1 && <Separator />}
        </Fragment>
      ))}
    </PageContainer>
  )
}
