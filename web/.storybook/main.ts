import type { StorybookConfig } from '@storybook/react-vite';

import { dirname } from "path"

import { fileURLToPath } from "url"
import { mergeConfig } from 'vite'

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}
const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs')
  ],
  "framework": getAbsolutePath('@storybook/react-vite'),
  staticDirs: ['../public'],
  viteFinal: async (baseConfig) => mergeConfig(baseConfig, {
    resolve: {
      alias: [
        { find: './authNavigation', replacement: fileURLToPath(new URL('./mocks/authNavigation.ts', import.meta.url)) },
        { find: '../lib/firebase', replacement: fileURLToPath(new URL('./mocks/firebase.ts', import.meta.url)) },
        { find: '../lib/presence', replacement: fileURLToPath(new URL('./mocks/presence.ts', import.meta.url)) },
        { find: /\/src\/lib\/authNavigation(?:\.ts)?$/, replacement: fileURLToPath(new URL('./mocks/authNavigation.ts', import.meta.url)) },
        { find: /\/src\/lib\/firebase(?:\.ts)?$/, replacement: fileURLToPath(new URL('./mocks/firebase.ts', import.meta.url)) },
        { find: /\/src\/lib\/presence(?:\.ts)?$/, replacement: fileURLToPath(new URL('./mocks/presence.ts', import.meta.url)) },
      ],
    },
  }),
};
export default config;
