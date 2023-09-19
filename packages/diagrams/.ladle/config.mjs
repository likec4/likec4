import { ThemeState, ModeState } from '@ladle/react'

/**
 * @type {import("@ladle/react/typings-for-build/shared/types").UserConfig}
 */
export default {
  stories: "src/**/*.stories.tsx",
  outDir: "build",
  addons: {
    a11y: {
      enabled: false,
    },
    action: {
      enabled: true,
      defaultState: [],
    },
    control: {
      enabled: true,
      defaultState: {},
    },
    ladle: {
      enabled: false,
    },
    mode: {
      enabled: true,
      defaultState: ModeState.Full,
    },
    rtl: {
      enabled: false,
    },
    source: {
      enabled: false,
      defaultState: false,
    },
    theme: {
      enabled: true,
      defaultState: ThemeState.Dark
    },
    width: {
      enabled: true,
      options: {
        xsmall: 414,
        small: 640,
        medium: 768,
        large: 1024,
      },
      defaultState: 0,
    },
  },
};
