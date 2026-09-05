import { LikeC4MantineProvider } from '@likec4/diagram'
import { configureLogger, getAnsiColorFormatter, getConsoleSink } from '@likec4/log'
import { ModalsProvider } from '@mantine/modals'
import ReactDOM from 'react-dom/client'
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
  <LikeC4MantineProvider defaultColorScheme="dark">
    <ModalsProvider>
      <Routes />
    </ModalsProvider>
  </LikeC4MantineProvider>,
)
