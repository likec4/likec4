import { configureLogger, getAnsiColorFormatter, getConsoleSink } from '@likec4/log'
import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import ReactDOM from 'react-dom/client'
import { theme } from './mantine'
import { Routes } from './router'

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
})

ReactDOM.createRoot(document.getElementById('likec4-root')!).render(
  <MantineProvider defaultColorScheme="dark" theme={theme}>
    <ModalsProvider>
      <Routes />
    </ModalsProvider>
  </MantineProvider>,
)
