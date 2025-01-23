import { Stack } from '@mantine/core'
import { clsx } from 'clsx'
import { memo } from 'react'
import { IfEnabled, useEnabledFeatures } from '../../../context'
import { stopPropagation } from '../../../xyflow/utils'
import { NavigationButtons } from './NavigationButtons'
import * as css from './styles.css'

export const Controls = memo(() => {
  const { enableNavigationButtons } = useEnabledFeatures()
  return (
    <>
      <Stack
        className={clsx(
          'react-flow__panel',
          css.panel,
          'likec4-top-left-panel',
        )}
        align="flex-start"
        onClick={stopPropagation}
        gap={'xs'}>
        {enableNavigationButtons && <NavigationButtons />}
      </Stack>
    </>
  )
})
