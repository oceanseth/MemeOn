/** Strings the alerts bell popover spells for chrome, empty states and overflow. */
export const alertsBellCopy = {
  title: 'Alerts',
  trigger: (unreadCount: number) => (unreadCount > 0 ? `Alerts, ${unreadCount} unread` : 'Alerts'),
  /** Beside the panel's title while anything in the list is new; the bell's bubble carries the number too. */
  unreadSummary: (unreadCount: number) => `${unreadCount} new`,
  unreadRow: 'Unread.',
  empty: 'No alerts yet — go make noise.',
  offline: "Alerts are offline — we'll retry in a moment.",
  overflow: (maxRows: number) => `Showing your ${maxRows} most recent alerts.`,
  justNow: 'just now',
} as const
