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
import clsx from 'clsx'
import { useId } from 'react'
import { clamp } from 'remeda'
import { Link } from '../../../icons'
import type { XYFlowNode } from '../../types'
import { elementLink, trigger } from './ElementLink.css'

type ElementLinkProps = {
  element: XYFlowNode['data']['element']
}

export function ElementLink({
  element
}: ElementLinkProps) {
  invariant(element.links, 'ElementLink: links are required')
  const id = useId()
  // const mantineCtx = useMantineContext()
  // const root = mantineCtx.getRootElement()

  // const targetSelector = `.react-flow:has([data-likec4-linkid="${id}"])`
  // // const target = root?.querySelector<HTMLDivElement>(targetSelector) ?? targetSelector

  // const portalProps = useMemo(() => ({
  //   get target(): HTMLElement | string {
  //     const root = mantineCtx.getRootElement()
  //     return root?.querySelector<HTMLDivElement>(targetSelector) ?? targetSelector
  //   }
  // }), [targetSelector])
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
        // portalProps={portalProps}
        withinPortal={false}
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
            <Link />
            <span>links</span>
          </UnstyledButton>
        </HoverCardTarget>
        <HoverCardDropdown p={'xs'}>
          <Stack onClick={e => e.stopPropagation()} gap={'xs'}>
            {element.links.map((link, i) => (
              <Group key={link} wrap="nowrap" gap={'sm'}>
                <Box flex={'1'} style={{ overflow: 'clip', maxWidth: clamp(element.width, { min: 200, max: 400 }) }}>
                  <Anchor href={link} target="_blank" fz="13" truncate="end">
                    {link}
                  </Anchor>
                </Box>
                <CopyButton value={link}>
                  {({ copied, copy }) => (
                    <Button size="compact-xs" fz={'12'} onClick={copy} color={copied ? 'teal' : 'gray'}>
                      {copied ? 'Copied' : 'Copy'}
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
