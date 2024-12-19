import { invariant } from '@likec4/core'
import {
  Anchor,
  Box,
  Button,
  CopyButton,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Stack,
  UnstyledButton
} from '@mantine/core'
import { IconLink } from '@tabler/icons-react'
import clsx from 'clsx'
import { useId } from 'react'
import { clamp } from 'remeda'
import { useMantinePortalProps } from '../../../hooks/useMantinePortalProps'
import { elementLink, trigger } from './ElementLink.css'
import type { DiagramFlowTypes } from '../../types'

type ElementLinkProps = {
  element: DiagramFlowTypes.Node['data']['element']
}

const stopEventPropagation = (e: React.MouseEvent) => e.stopPropagation()

export function ElementLink({
  element
}: ElementLinkProps) {
  invariant(element.links, 'ElementLink: links are required')
  const id = useId()
  const portalProps = useMantinePortalProps()
  return (
    <div
      className={elementLink}
      data-likec4-linkid={id}
      onPointerDownCapture={stopEventPropagation}
      onDoubleClick={stopEventPropagation}
      onClick={stopEventPropagation}>
      <HoverCard
        position="bottom-start"
        shadow="lg"
        radius="sm"
        classNames={{
          dropdown: clsx('nodrag', 'nopan')
        }}
        transitionProps={{
          transition: 'pop'
        }}
        {...portalProps}
        floatingStrategy={'fixed'}
        openDelay={350}
        closeDelay={800}
        offset={{
          mainAxis: 5,
          crossAxis: -10
        }}>
        <HoverCardTarget>
          <UnstyledButton
            tabIndex={-1}
            className={clsx('nodrag nopan', trigger)}
            autoFocus={false}>
            <IconLink size={12} />
            <span>links</span>
          </UnstyledButton>
        </HoverCardTarget>
        <HoverCardDropdown p={'xs'}>
          <Stack gap={'xs'}>
            {element.links.map((link) => (
              <Group key={link.url} wrap="nowrap" gap={'sm'}>
                <Box flex={'1'} style={{ overflow: 'clip', maxWidth: clamp(element.width, { min: 200, max: 400 }) }}>
                  <Anchor href={link.url} target="_blank" fz="13" truncate="end">
                    {link.title || link.url}
                  </Anchor>
                </Box>
                <CopyButton value={link.url}>
                  {({ copied, copy }) => (
                    <Button
                      size="compact-xs"
                      fz={'10'}
                      variant="light"
                      onClick={copy}
                      color={copied ? 'teal' : 'gray'}
                    >
                      {copied ? 'copied' : 'copy'}
                    </Button>
                  )}
                </CopyButton>
              </Group>
            ))}
          </Stack>
        </HoverCardDropdown>
      </HoverCard>
    </div>
  )
}
