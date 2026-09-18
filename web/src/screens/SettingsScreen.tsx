import { Link } from 'react-router-dom'
import { Button, buttonVariants } from '@/atoms/button'
import { Card, CardTitle } from '@/atoms/card'
import { Item, ItemActions, ItemDescription, ItemTitle } from '@/atoms/item'
import { PageContainer } from '@/atoms/page-container'
import { PageHead } from '@/atoms/page-head'
import type { SettingsScreenModel } from '../hooks/useSettingsScreen'
import { ThemeControl } from '@/molecules/theme-control'
import { Icon } from '@/atoms/icon'

/** Account, Appearance, Connections as a function of the model. Pure props → markup. */
export function SettingsScreen({
  title,
  intro,
  account,
  appearance,
  connections,
}: SettingsScreenModel) {
  return (
    <PageContainer as="main" id="main" tabIndex={-1}>
      <PageHead level="h1" title={title} subtitle={intro} className="mb-5" />
      <div data-slot="settings-sections" className="flex flex-col gap-5">
        {account && (
          <Card size="xs">
            <CardTitle render={<h2 />}>{account.heading}</CardTitle>
            <Item
              size="flush"
              data-slot="settings-account"
              className="mt-4 max-md:flex-col max-md:items-start"
            >
              {/* the name stands alone: this row is an identity affordance, never MemeOn's mark */}
              <ItemTitle>{account.nameLabel}</ItemTitle>
              <ItemDescription>{account.providerLabel}</ItemDescription>
              <ItemActions className="ms-auto max-md:ms-0">
                <Button {...account.logoutButtonProps}>{account.logoutLabel}</Button>
              </ItemActions>
            </Item>
          </Card>
        )}

        <Card size="xs">
          <CardTitle render={<h2 />}>{appearance.heading}</CardTitle>
          <div data-slot="settings-appearance" className="mt-3.5">
            <ThemeControl model={appearance.theme} />
            <p className="mt-2.5 mb-0 text-sm text-muted-foreground">{appearance.caption}</p>
          </div>
        </Card>

        <Card size="xs">
          <CardTitle render={<h2 />}>{connections.heading}</CardTitle>
          <ul data-slot="settings-connections" className="m-0 list-none p-0">
            {connections.rows.map((row) => (
              <Item
                key={row.key}
                size="flush"
                render={<li />}
                data-slot="connection-row"
                data-linked={row.linked}
                className="mt-4 max-md:flex-col max-md:items-start"
              >
                <ItemTitle>
                  {/* whether a service gets a mark is the model's call — every row is text today */}
                  {row.icon ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true">
                        <Icon name={row.icon} size={16} />
                      </span>{' '}
                      {row.serviceLabel}
                    </span>
                  ) : (
                    row.serviceLabel
                  )}
                </ItemTitle>
                <ItemDescription>{row.stateLabel}</ItemDescription>
                <ItemActions className="ms-auto max-md:ms-0">
                  <Link className={buttonVariants()} {...row.actionLinkProps}>
                    {row.actionLabel}
                  </Link>
                </ItemActions>
              </Item>
            ))}
          </ul>
        </Card>
      </div>
    </PageContainer>
  )
}
