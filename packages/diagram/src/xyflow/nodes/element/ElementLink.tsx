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
import { useDiagramState } from '../../../hooks/useDiagramState'
import { type DiagramState } from '../../../state/diagramStore'
import type { XYFlowNode } from '../../types'
import { elementLink, trigger } from './ElementLink.css'

type ElementLinkProps = {
  element: XYFlowNode['data']['element']
}

const selector = (s: DiagramState) => {
  const target = s.getContainer()
  return target ? { target } : null
}

export function ElementLink({
  element
}: ElementLinkProps) {
  invariant(element.links, 'ElementLink: links are required')
  const id = useId()
  const portalProps = useDiagramState(selector)
  return (
    <div className={elementLink} data-likec4-linkid={id}>
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
        {...(portalProps ? { portalProps } : { withinPortal: false })}
        floatingStrategy={'fixed'}
        openDelay={350}
        closeDelay={800}
        offset={{
          mainAxis: 5,
          crossAxis: -10
        }}>
        <HoverCardTarget>
          <UnstyledButton
            className={clsx('nodrag nopan', trigger)}
            autoFocus={false}>
            <IconLink size={12} />
            <span>links</span>
          </UnstyledButton>
        </HoverCardTarget>
        <HoverCardDropdown
          onPointerDownCapture={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          p={'xs'}>
          <Stack gap={'xs'}>
            {element.links.map((link) => (
              <Group key={link} wrap="nowrap" gap={'sm'}>
                <Box flex={'1'} style={{ overflow: 'clip', maxWidth: clamp(element.width, { min: 200, max: 400 }) }}>
                  <Anchor href={link} target="_blank" fz="13" truncate="end">
                    {link}
                  </Anchor>
                </Box>
                <CopyButton value={link}>
                  {({ copied, copy }) => (
                    <Button
                      size="compact-xs"
                      fz={'10'}
                      variant="light"
                      onClick={copy}
                      color={copied
                        ? 'teal'
                        : 'gray'}>
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
