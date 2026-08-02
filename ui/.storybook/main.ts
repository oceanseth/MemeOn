import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    // No "Storybook X.Y — learn what's new" notification.
    disableWhatsNewNotifications: true,
  },
  features: {
    // No "Get started" onboarding checklist in the sidebar or the menu.
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
}

export default config
