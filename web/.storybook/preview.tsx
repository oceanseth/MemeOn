import type { Preview } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import '../src/index.css'
import { useMountEffect } from '../src/hooks/useMountEffect'
import { createStores } from '../src/stores/createStores'
import { StoresProvider } from '../src/stores/StoresContext'

function FreshStores({ children }: { children: ReactNode }) {
  const [stores] = useState(() => createStores())
  useMountEffect(() => () => stores.dispose())
  return <StoresProvider stores={stores}>{children}</StoresProvider>
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Anatomy', 'Atoms', 'Molecules', 'Organisms', 'Screens', 'Views'],
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <FreshStores>
        <Story />
      </FreshStores>
    ),
  ],
}

export default preview
