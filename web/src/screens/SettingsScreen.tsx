import { Link } from 'react-router-dom'
import { Button, buttonClasses } from '../atoms/Button'
import { PageContainer } from '../atoms/PageContainer'
import { PageHead } from '../atoms/PageHead'
import { Panel, PanelHeading } from '../atoms/Panel'
import { cn } from '../lib/cn'
import type { SettingsScreenModel } from '../hooks/useSettingsScreen'
import { ThemeControl } from '../molecules/ThemeControl'

/** Settings section card — Panel raised material. */
const CARD = 'px-5 py-[18px] max-md:px-5 max-md:py-[18px]'

const ROW = 'mt-[15px] flex flex-wrap items-center gap-3'
const SUBJECT = 'text-label font-bold text-ink'
const FACT = 'text-small text-ink-muted'
/** Alerts toggles are chips, not pills. */
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
