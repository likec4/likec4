import { Stack } from '@mantine/core'
import { clsx } from 'clsx'
import { memo } from 'react'
import { IfEnabled } from '../../../context'
import { NavigationButtons } from './NavigationButtons'
import * as css from './styles.css'

export const Controls = memo(() => {
  return (
    <>
      <Stack
        className={clsx(
          'react-flow__panel',
          css.panel,
          'likec4-top-left-panel',
        )}
        align="flex-start"
        onClick={e => e.stopPropagation()}
        gap={'xs'}>
        <IfEnabled feature="NavigationButtons">
          <NavigationButtons />
        </IfEnabled>
      </Stack>
    </>
  )
})
