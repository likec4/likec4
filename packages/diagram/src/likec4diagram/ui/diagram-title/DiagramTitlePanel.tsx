import { Button, Card, CardSection, Group, Spoiler, Stack, Text } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { IconMenu } from '@tabler/icons-react'
import clsx from 'clsx'
import { AnimatePresence, m } from 'framer-motion'
import { useDiagramContext } from '../../../hooks2'
import type { DiagramContext } from '../../state/machine'
import * as css from './DiagramTitlePanel.css'
import { Link } from './Link'

const selector = (s: DiagramContext) => ({
  id: s.view.id,
  title: s.view.title ?? 'untitled',
  description: s.view.description,
  links: s.view.links,
})

export function DiagramTitlePanel() {
  const { id, title, description, links } = useDiagramContext(selector)
  const [isCollapsed, setCollapsed] = useLocalStorage({
    key: 'diagram-title-webview-collapsed',
    defaultValue: false,
  })
  const toggle = () => setCollapsed(v => !v)

  return (
    <AnimatePresence mode="wait">
      {
        /* <ViewportPortal>
        <div className={css.inlineTitle} style={{ transform: `translate(0px,${height}px)` }}>
          <m.div
            key={id}
            animate={{ opacity: 0.7, scale: .92 }}
            whileHover={{ opacity: 1, scale: 1 }}
            style={{
              transformOrigin: 'left bottom'
            }}
          >
            <Title order={1}>{title}</Title>
          </m.div>
        </div>
      </ViewportPortal> */
      }
      <m.div
        key={id}
        initial={{ opacity: 0.05, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{
          opacity: 0.05,
          scale: 0.6,
        }}
        className={clsx('react-flow__panel', css.container)}
        style={{
          transformOrigin: 'left center',
        }}
      >
        <Card
          radius="sm"
          className={css.card}
          withBorder={!isCollapsed}
          p={isCollapsed ? 'sm' : 'md'}
          onDoubleClick={e => e.stopPropagation()}>
          {isCollapsed && (
            <CardSection>
              <Button
                fullWidth
                justify="stretch"
                size="md"
                radius={'0'}
                variant={'subtle'}
                color="gray"
                onClick={toggle}
                fw={500}
                fz={'sm'}
                tabIndex={-1}
              >
                {title}
              </Button>
            </CardSection>
          )}
          {!isCollapsed && (
            <>
              <CardSection mb={'xs'}>
                <Button
                  fullWidth
                  size="xs"
                  h={'sm'}
                  py={2}
                  radius={'0'}
                  variant={'subtle'}
                  color="gray"
                  onClick={toggle}
                  tabIndex={-1}
                >
                  <IconMenu size={11} opacity={0.7} />
                </Button>
              </CardSection>

              <Group justify="stretch" wrap="nowrap" mb={'sm'}>
                <Text
                  component={'div'}
                  flex={'1'}
                  size={'md'}
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
                    userSelect: 'all',
                  }}>
                  <span style={{ userSelect: 'none' }}>id:{' '}</span>
                  {id}
                </Text>
              </Group>
              {description && (
                <Spoiler
                  maxHeight={42}
                  showLabel={
                    <Button color="gray" variant="light" fz={'10'} size="compact-xs" tabIndex={-1}>show more</Button>
                  }
                  hideLabel={
                    <Button color="gray" variant="light" fz={'10'} size="compact-xs" tabIndex={-1}>hide</Button>
                  }>
                  <Text
                    component={'div'}
                    size="sm"
                    className={css.description}>
                    {description || 'no description'}
                  </Text>
                </Spoiler>
              )}
              {!description && (
                <Text
                  component={'div'}
                  size="xs"
                  c={'dimmed'}>
                  no description
                </Text>
              )}
              {links && (
                <Stack
                  gap={3}
                  justify="stretch"
                  align="stretch">
                  {links.map((link) => <Link link={link} key={link.url} />)}
                </Stack>
              )}
            </>
          )}
        </Card>
      </m.div>
    </AnimatePresence>
  )
}
