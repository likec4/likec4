// dprint-ignore
import '@mantine/core/styles.layer.css'
import '@xyflow/react/dist/style.css'
import './main.css'

import { configureLogger, getAnsiColorFormatter, getConsoleSink } from '@likec4/log'
import { MantineProvider } from '@mantine/core'
import ReactDOM from 'react-dom/client'
import { Routes } from './router'
import { theme } from './theme'

configureLogger({
  sinks: {
    console: getConsoleSink({
      formatter: getAnsiColorFormatter({
        format: ({ level, category, message }) => {
          return `${level} ${category} ${message}`
        },
      }),
    }),
  },
  loggers: [
    {
      category: 'likec4',
      sinks: ['console'],
      lowestLevel: 'debug',
    },
  ],
}).then(() => {
  ReactDOM.createRoot(document.getElementById('like4-root')!).render(
    <MantineProvider
      defaultColorScheme="dark"
      theme={theme}>
      <Routes />
    </MantineProvider>,
  )
})
