import { ActionIcon, Box, Button, CopyButton, Group, HoverCard, Stack, UnstyledButton } from '@mantine/core'
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
        width={320}
        position="bottom-start"
        shadow="lg"
        transitionProps={{
          transition: 'pop'
        }}
        closeDelay={500}
        offset={{
          mainAxis: 5,
          crossAxis: -10
        }}>
        <HoverCard.Target>
          <UnstyledButton className={clsx('nodrag nopan', css.button)}>
            <Link />
            <span>link</span>
          </UnstyledButton>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Stack onClick={e => e.stopPropagation()}>
            {element.links.map((link, i) => (
              <Group key={link} wrap="nowrap" gap={'xs'}>
                <Box flex={'1'} style={{ overflow: 'clip' }}>
                  <Button component="a" href={link} target="_blank" size="compact-xs" variant="subtle" w={'100%'}>
                    {link}
                  </Button>
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
