export default {
  stories: "src/**/*.stories.tsx",
  defaultStory: "development--diagram",

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
      defaultState: "full"
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
      defaultState: "dark"
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
