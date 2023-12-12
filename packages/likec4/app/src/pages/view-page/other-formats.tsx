import { Box, Flex, Tabs } from '@radix-ui/themes'
import { updateSearchParams, type ViewMode } from '../../router'
import ViewAsD2 from './other-formats/ViewAsD2'
import ViewAsDot from './other-formats/ViewAsDot'
import ViewAsMmd from './other-formats/ViewAsMmd'
import styles from './view-page.module.css'
import { SWRConfig } from 'swr'

function localStorageProvider() {
  // When initializing, we restore the data from `localStorage` into a map.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = new Map<string, any>(JSON.parse(localStorage.getItem('swr-cache') || '[]'))

  // Before unloading the app, we write back all the data into `localStorage`.
  window.addEventListener('beforeunload', () => {
    const appCache = JSON.stringify(Array.from(map.entries()))
    localStorage.setItem('swr-cache', appCache)
  })

  // We still use the map for write & read for performance.
  return map
}

type Props = {
  viewMode: Exclude<ViewMode, 'react'>
  viewId: string
}
export default function ViewDiagramInOtherFormats({ viewId, viewMode }: Props) {
  return (
    <SWRConfig
      value={{
        keepPreviousData: true,
        errorRetryCount: 5,
        provider: localStorageProvider
      }}
    >
      <Flex
        asChild
        position={'fixed'}
        inset={'0'}
        pt={'8'}
        pl={'8'}
        pr={'2'}
        align={'stretch'}
        direction={'column'}
      >
        <Tabs.Root
          value={viewMode}
          onValueChange={mode =>
            mode !== viewMode && updateSearchParams({ mode: mode as ViewMode })
          }
        >
          <Box asChild shrink={'0'} grow={'0'}>
            <Tabs.List>
              <Tabs.Trigger value='react'>React</Tabs.Trigger>
              <Tabs.Trigger value='dot'>Graphviz</Tabs.Trigger>
              <Tabs.Trigger value='mmd'>Mermaid</Tabs.Trigger>
              <Tabs.Trigger value='d2'>D2</Tabs.Trigger>
            </Tabs.List>
          </Box>

          <Box p='2' className={styles.otherFormats} position={'relative'}>
            <Tabs.Content value='react'>{''}</Tabs.Content>

            <Tabs.Content value='dot'>
              <ViewAsDot viewId={viewId} />
            </Tabs.Content>

            <Tabs.Content value='mmd'>
              <ViewAsMmd viewId={viewId} />
            </Tabs.Content>

            <Tabs.Content value='d2'>
              <ViewAsD2 viewId={viewId} />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Flex>
    </SWRConfig>
  )

  // switch (viewMode) {
  //   case 'dot':
  //     return <ViewAsDot viewId={viewId} />
  //   case 'd2':
  //     return <ViewAsD2 viewId={viewId} />
  //   case 'mmd':
  //     return <ViewAsMmd viewId={viewId} />
  //   default:
  //     nonexhaustive(viewMode)
  // }
}
