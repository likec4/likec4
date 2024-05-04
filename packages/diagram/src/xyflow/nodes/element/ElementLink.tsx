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
  UnstyledButton,
  useMantineContext
} from '@mantine/core'
import clsx from 'clsx'
import { motion } from 'framer-motion'
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
  // const mantineCtx = useMantineContext()
  // const root = mantineCtx.getRootElement()
  return (
    <div className={elementLink}>
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
        withinPortal={false}
        // {...(root && root !== document.documentElement
        //   ? {
        //     portalProps: { target: root }
        //   }
        //   : {
        //     // withinPortal: false
        //   })}
        floatingStrategy={'fixed'}
        openDelay={350}
        closeDelay={800}
        offset={{
          mainAxis: 5,
          crossAxis: -10
        }}>
        <HoverCardTarget>
          <UnstyledButton className={clsx('nodrag nopan', trigger)} autoFocus={false}>
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
