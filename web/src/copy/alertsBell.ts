/** Strings the alerts bell popover spells for chrome, empty states and overflow. */
export const alertsBellCopy = {
  title: 'Alerts',
  trigger: (unreadCount: number) => (unreadCount > 0 ? `Alerts, ${unreadCount} unread` : 'Alerts'),
  unreadRow: 'Unread.',
  empty: 'No alerts yet — go make noise.',
  offline: "Alerts are offline — we'll retry in a moment.",
  overflow: (maxRows: number) => `Showing your ${maxRows} most recent alerts.`,
  justNow: 'just now',
} as const
