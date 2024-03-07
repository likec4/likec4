import { ActionIcon, Anchor, Box, Button, CopyButton, Group, HoverCard, Stack, UnstyledButton } from '@mantine/core'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { ClipboardCopy, Link } from '../../../icons'
import type { XYFlowNode } from '../../types'
import * as css from './ElementLink.css'

type ElementLinkProps = {
  element: XYFlowNode['data']['element']
}

export function ElementLink({
  element
}: ElementLinkProps) {
  if (!element.links) {
    return null
  }
  return (
    <motion.div
      className={css.elementLink}
      whileHover={{
        scale: 1.1
      }}>
      <HoverCard
        position="bottom-start"
        shadow="lg"
        transitionProps={{
          transition: 'pop'
        }}
        openDelay={300}
        closeDelay={500}
        offset={{
          mainAxis: 5,
          crossAxis: -10
        }}>
        <HoverCard.Target>
          <UnstyledButton className={clsx('nodrag nopan', css.trigger)}>
            <Link />
            <span>link</span>
          </UnstyledButton>
        </HoverCard.Target>
        <HoverCard.Dropdown p={'xs'}>
          <Stack onClick={e => e.stopPropagation()} gap={'xs'}>
            {element.links.map((link, i) => (
              <Group key={link} wrap="nowrap" gap={'xs'}>
                <Box flex={'1'} style={{ overflow: 'clip', maxWidth: 300 }}>
                  <Anchor href={link} target="_blank" fz="xs" truncate="end">
                    {link}
                  </Anchor>
                </Box>
                <CopyButton value={link}>
                  {({ copied, copy }) => (
                    <ActionIcon
                      onClick={copy}
                      size={'sm'}
                      variant={copied ? 'light' : 'subtle'}
                      {...(copied && ({ color: 'teal' }))}>
                      <ClipboardCopy />
                    </ActionIcon>
                  )}
                </CopyButton>
              </Group>
            ))}
          </Stack>
        </HoverCard.Dropdown>
      </HoverCard>
    </motion.div>
  )
}
