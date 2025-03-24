import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'
import likec4grammar from './likec4.tmLanguage.json' with { type: 'json' }
import structurizr from './structurizr.tmLanguage.json' with { type: 'json' }

export default {
  plugins: [
    pluginLineNumbers(),
    pluginCollapsibleSections(),
  ],
  styleOverrides: {
    borderRadius: '4px',
  },
  defaultProps: {
    // Disable line numbers by default
    showLineNumbers: false,
  },
  shiki: {
    langs: [
      likec4grammar,
      structurizr,
    ],
  },
}
