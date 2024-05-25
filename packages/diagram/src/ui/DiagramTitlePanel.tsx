import { Anchor, Box, Button, CopyButton, Group, Paper, Spoiler, Stack, Text } from '@mantine/core'
import { useToggle } from '@react-hookz/web'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { type DiagramState, useDiagramState } from '../state'
import * as css from './DiagramTitlePanel.css'

const selector = (s: DiagramState) => ({
  id: s.view.id,
  title: s.view.title ?? 'untitled',
  description: s.view.description,
  links: s.view.links
})

export default function DiagramTitlePanel() {
  const { id, title, description, links } = useDiagramState(selector)
  const [isCollapsed, toggle] = useToggle(false)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0.05, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{
          opacity: 0.05,
          scale: 0.6
        }}
        className={clsx('react-flow__panel', css.container)}
        style={{
          transformOrigin: 'left center'
        }}
      >
        <Paper
          radius="sm"
          withBorder={!isCollapsed}
          className={css.paper}
          p={isCollapsed ? 'sm' : 'md'}
          onClick={toggle}
          style={{ cursor: 'pointer' }}
          onDoubleClick={e => e.stopPropagation()}>
          <Stack gap={'sm'} justify="stretch" align="stretch">
            <Group justify="stretch" wrap="nowrap">
              <Text
                component={'div'}
                flex={'1'}
                size={isCollapsed ? 'sm' : 'lg'}
                fw={500}
                lh={1.1}
                className={css.title}
              >
                {title}
              </Text>
              <Text
                hidden={isCollapsed}
                component={'div'}
                flex={'0 0 auto'}
                inline
                size="xs"
                fz={9}
                fw={500}
                c={'dimmed'}
                style={{
                  userSelect: 'all'
                }}>
                <span style={{ userSelect: 'none' }}>id:{' '}</span>
                {id}
              </Text>
            </Group>
            <Spoiler
              hidden={isCollapsed}
              maxHeight={42}
              showLabel={<Button color="gray" variant="light" fz={'10'} size="compact-xs">show more</Button>}
              hideLabel={<Button color="gray" variant="light" fz={'10'} size="compact-xs">hide</Button>}>
              <Text
                component={'div'}
                size="sm"
                className={css.description}>
                {description || 'no description'}
              </Text>
            </Spoiler>
            {links && !isCollapsed && (
              <Stack
                gap={3}
                justify="stretch"
                align="stretch"
                onClick={e => e.stopPropagation()}>
                {links.map((link) => (
                  <Group key={link} wrap="nowrap" gap={'sm'}>
                    <Box flex={'1'} style={{ overflow: 'hidden' }}>
                      <Anchor href={link} target="_blank" fz="xs" truncate="end" display={'inline-block'} w={'100%'}>
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
                          color={copied ? 'teal' : 'gray'}>
                          {copied ? 'copied' : 'copy'}
                        </Button>
                      )}
                    </CopyButton>
                  </Group>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>
      </motion.div>
    </AnimatePresence>
  )
}
