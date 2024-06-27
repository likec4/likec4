import type { AutoLayoutDirection, DiagramView } from '@likec4/core'
import {
  ActionIcon,
  ActionIconGroup,
  Box,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  SimpleGrid,
  Text,
  Tooltip,
  TooltipGroup
} from '@mantine/core'
import {
  IconArrowAutofitDown,
  IconArrowAutofitLeft,
  IconArrowAutofitRight,
  IconArrowAutofitUp,
  IconLayout2Filled
} from '@tabler/icons-react'
import { toolbar } from './Toolbar.css'
import { extensionApi } from './vscode'

export function Toolbar({ view }: { view: DiagramView }) {
  const changeLayout = (layout: AutoLayoutDirection) => () => {
    if (layout === view.autoLayout) return
    extensionApi.change(view.id, {
      op: 'change-autolayout',
      layout
    })
  }

  const buttonProps = (layout: AutoLayoutDirection) => ({
    size: 'md',
    // fz: 'xs',
    variant: layout === view.autoLayout ? 'filled' : 'light',
    color: layout === view.autoLayout ? 'blue' : 'gray',
    onClick: changeLayout(layout)
  })

  return (
    <ActionIconGroup className={toolbar}>
      <HoverCard
        position="bottom-end"
        closeDelay={300}
        transitionProps={{
          transition: 'pop'
        }}
      >
        <HoverCardTarget>
          <ActionIcon color="gray" variant="light">
            <IconLayout2Filled />
          </ActionIcon>
        </HoverCardTarget>
        <HoverCardDropdown p={'xs'}>
          <Box>
            <Text inline fz={'xs'} c={'dimmed'}>Auto direction:</Text>
          </Box>
          <TooltipGroup openDelay={100}>
            <SimpleGrid cols={3} mt={'xs'} verticalSpacing={1} spacing={4}>
              {/* 1 row */}
              <div></div>
              <div>
                <Tooltip label={'Bottom to Top'} fz={'sm'}>
                  <ActionIcon {...buttonProps('BT')}>
                    <IconArrowAutofitUp />
                  </ActionIcon>
                </Tooltip>
              </div>
              <div></div>
              {/* 2 row */}
              <div>
                <Tooltip label={'Right to Left'} fz={'sm'}>
                  <ActionIcon {...buttonProps('RL')}>
                    <IconArrowAutofitLeft />
                  </ActionIcon>
                </Tooltip>
              </div>
              <div></div>
              <div>
                <Tooltip label={'Left to Right'} fz={'sm'}>
                  <ActionIcon {...buttonProps('LR')}>
                    <IconArrowAutofitRight />
                  </ActionIcon>
                </Tooltip>
              </div>
              {/* 3 row */}
              <div></div>
              <div>
                <Tooltip label={'Top to Bottom'} fz={'sm'}>
                  <ActionIcon {...buttonProps('TB')}>
                    <IconArrowAutofitDown />
                  </ActionIcon>
                </Tooltip>
              </div>
              <div></div>
            </SimpleGrid>
          </TooltipGroup>
        </HoverCardDropdown>
      </HoverCard>
    </ActionIconGroup>
  )
}
