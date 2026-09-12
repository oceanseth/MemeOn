import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { Panel, PanelHeading } from '../atoms/Panel'
import { cn } from '../lib/cn'
import type { SettingsScreenModel } from '../hooks/useSettingsScreen'
import { ThemeControl } from '../molecules/ThemeControl'

/**
 * The section card the Settings boards draw (`J52-0`, `J5E-0`, `MPJ-0`, `MPQ-0` and their iPhone
 * twins): `Panel`'s raised material at the board's 18/20 padding. Its head is a `PanelHeading` at
 * the shared intro step every card on this family uses.
 */
const CARD = 'px-5 py-[18px] max-md:px-5 max-md:py-[18px]'

/** The row under a section heading: 15 down on the boards, wrapping to a column on the phone. */
const ROW = 'mt-[15px] flex flex-wrap items-center gap-3'

/** 15/19 700 — the row's subject (`J55-0`, `MPO-0`). */
const SUBJECT = 'text-label font-bold text-ink'

/** 14/18 — the row's standing fact (`J56-0`, `MPN-0`). */
const FACT = 'text-small text-ink-muted'

/** The Alerts switches (`MPU-0`/`MPS-0`): 44 tall, radius 17, 14/18 600 — a chip, not a pill. */
const TOGGLE = 'h-11 rounded-[17px] px-3.5 text-small'

/** Account, Appearance, Connections, Alerts as a function of the model. Pure props → markup. */
export function SettingsScreen({
  title,
  intro,
  account,
  appearance,
  connections,
  alerts,
}: SettingsScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead level="h1" title={title} subtitle={intro} className="mb-5" />
      <div data-slot="settings-sections" className="flex flex-col gap-5">
        {account && (
          <Panel className={CARD}>
            <PanelHeading size="section" className="mb-0">{account.heading}</PanelHeading>
            <div data-slot="settings-account" className={cn(ROW, 'max-md:flex-col max-md:items-start max-md:gap-2.5')}>
              <span className={SUBJECT}>{account.nameLabel}</span>
              <span className={FACT}>{account.providerLabel}</span>
              <Button className="ms-auto max-md:ms-0" {...account.logoutButtonProps}>
                {account.logoutLabel}
              </Button>
            </div>
          </Panel>
        )}

        <Panel className={CARD}>
          <PanelHeading size="section" className="mb-0">{appearance.heading}</PanelHeading>
          <div data-slot="settings-appearance" className="mt-3.5">
            <ThemeControl model={appearance.theme} />
            <p className={cn(FACT, 'mt-2.5 mb-0')}>{appearance.caption}</p>
          </div>
        </Panel>

        <Panel className={CARD}>
          <PanelHeading size="section" className="mb-0">{connections.heading}</PanelHeading>
          <ul data-slot="settings-connections" className="m-0 list-none p-0">
            {connections.rows.map((row) => (
              <li key={row.key} className={ROW} data-slot="connection-row" data-linked={row.linked}>
                <span className={SUBJECT}>{row.serviceLabel}</span>
                <span className={FACT}>{row.stateLabel}</span>
                <Link
                  className={cn(buttonClasses(), 'ms-auto max-md:ms-0')}
                  {...row.actionLinkProps}
                >
                  {row.actionLabel}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className={CARD}>
          <PanelHeading size="section" className="mb-0">{alerts.heading}</PanelHeading>
          <div data-slot="settings-alerts" className="mt-4 flex flex-wrap items-center gap-2.5">
            {alerts.toggles.map((toggle) => (
              <Button
                key={toggle.key}
                className={TOGGLE}
                pressed={toggle.on}
                aria-describedby="settings-alerts-note"
                {...toggle.buttonProps}
              >
                {toggle.label}
              </Button>
            ))}
          </div>
          {/* never a switch that saves nothing: the caption is why they are inert */}
          <p id="settings-alerts-note" className={cn(FACT, 'mt-2.5 mb-0')}>
            {alerts.caption}
          </p>
        </Panel>
      </div>
    </PageContainer>
  )
}
