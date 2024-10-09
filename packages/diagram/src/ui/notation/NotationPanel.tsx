import { type ElementKind, type ElementNotation as ElementNotationData } from '@likec4/core'
import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Group,
  Paper,
  ScrollAreaAutosize,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
  ThemeIcon,
  Tooltip
} from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { IconAlertTriangle, IconArrowDownRight, IconHelpCircle } from '@tabler/icons-react'
import clsx from 'clsx'
import { AnimatePresence, m } from 'framer-motion'
import { useState } from 'react'
import { ceil, isNonNullish, isNullish } from 'remeda'
import { type DiagramState, useDiagramState, useDiagramStoreApi } from '../../hooks/useDiagramState'
import { useMantinePortalProps } from '../../hooks/useMantinePortalProps'
import { vars } from '../../theme-vars'
import { ElementShapeSvg } from '../../xyflow/nodes/element/ElementShapeSvg'
import * as css from './NotationPanel.css'

const ElementNotation = ({ value }: { value: ElementNotationData }) => {
  const {
    title,
    color = 'primary',
    shape = 'rectangle'
  } = value
  const [onlyKind, setOnlyKind] = useState<ElementKind | null>(null)
  const diagramStore = useDiagramStoreApi()
  const w = 300
  const h = 200
  return (
    <Card
      shadow="none"
      px={'xs'}
      py={'sm'}
      className={css.elementNotation}
      mod={{
        'data-likec4-color': color
      }}
      onMouseEnter={() => {
        setOnlyKind(null)
        diagramStore.getState().highlightByElementNotation(value)
      }}
      onMouseLeave={() => {
        setOnlyKind(null)
        diagramStore.setState({ dimmed: new Set() })
      }}
    >
      <Group
        gap={'sm'}
        align="stretch"
        wrap="nowrap"
      >
        <Box
          flex={'0 0 70px'}
          style={{
            width: 70,
            height: ceil(70 * (h / w), 0)
          }}>
          <svg
            className={clsx(
              css.shapeSvg
            )}
            viewBox={`0 0 ${w} ${h}`}
          >
            <ElementShapeSvg
              shape={shape}
              w={w}
              h={h}
            />
          </svg>
        </Box>
        <Stack gap={4} flex={1}>
          <Group gap={4} flex={'0 0 auto'}>
            {value.kinds.map((kind) => (
              <Badge
                key={kind}
                className={css.shapeBadge}
                onMouseEnter={() => {
                  setOnlyKind(kind)
                  diagramStore.getState().highlightByElementNotation(value, kind)
                }}
                onMouseLeave={() => {
                  setOnlyKind(null)
                  diagramStore.getState().highlightByElementNotation(value)
                }}
                opacity={isNonNullish(onlyKind) && onlyKind !== kind ? 0.25 : 1}
                color={isNonNullish(onlyKind) && onlyKind !== kind ? 'gray' : vars.element.fill}
              >
                {kind}
              </Badge>
            ))}
          </Group>
          <Text
            component="div"
            fz={'sm'}
            fw={500}
            lh="1.25"
            style={{
              textWrap: 'pretty'
            }}>
            {title}
          </Text>
        </Stack>
      </Group>
    </Card>
  )
}

const selector = (s: DiagramState) => ({
  id: s.view.id,
  notations: s.view.notation?.elements ?? [],
  height: s.xystore.getState().height,
  isVisible: isNullish(s.focusedNodeId ?? s.activeWalkthrough)
})

export function NotationPanel() {
  const {
    id,
    notations,
    isVisible,
    height
  } = useDiagramState(selector)
  const [isCollapsed, setCollapsed] = useLocalStorage({
    key: 'notation-webview-collapsed',
    defaultValue: true
  })
  const hasNotations = notations.length > 0
  const portalProps = useMantinePortalProps()

  return (
    <AnimatePresence>
      {!hasNotations && isVisible && (
        <m.div
          key={'empty'}
          initial={{ opacity: 0.75, translateX: '50%' }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{
            translateX: '100%',
            opacity: 0.6
          }}
          className={clsx('react-flow__panel', css.container)}>
          <Tooltip label="View has no notations" color="orange" {...portalProps}>
            <ThemeIcon
              size={'lg'}
              variant="light"
              color="orange"
              radius={'md'}
            >
              <IconAlertTriangle />
            </ThemeIcon>
          </Tooltip>
        </m.div>
      )}
      {hasNotations && isVisible && isCollapsed && (
        <m.div
          key={'collapsed'}
          initial={{ opacity: 0.75, translateX: '50%' }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{
            translateX: '100%',
            opacity: 0.6
          }}
          className={clsx('react-flow__panel', css.container)}
        >
          <Tooltip label="Show notation" color="dark" fz={'xs'} {...portalProps}>
            <ActionIcon
              size={'lg'}
              variant="default"
              color="gray"
              radius={'md'}
              onClick={() => setCollapsed(false)}
            >
              <IconHelpCircle stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </m.div>
      )}

      {hasNotations && isVisible && !isCollapsed && (
        <m.div
          key={id}
          initial={{
            opacity: 0.75,
            // translateX: '50%',
            scale: 0.2
          }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.25
          }}
          className={clsx('react-flow__panel', css.container)}
          style={{
            transformOrigin: 'bottom right'
          }}
        >
          <Paper
            radius="sm"
            withBorder
            shadow="lg"
            className={css.card}>
            {/* <Text fz={'sm'} fw={500} c={'dimmed'} ml={'md'}>diagram notation</Text> */}
            <Tabs defaultValue="first" radius={'xs'}>
              <TabsList>
                <ActionIcon
                  size={'md'}
                  variant="subtle"
                  color="gray"
                  ml={2}
                  style={{
                    alignSelf: 'center'
                  }}
                  onClick={() => setCollapsed(true)}
                >
                  <IconArrowDownRight stroke={2} />
                </ActionIcon>
                <TabsTab value="first" fz={'xs'}>Elements</TabsTab>
                <TabsTab value="second" fz={'xs'} disabled>
                  Relationships
                </TabsTab>
              </TabsList>

              <TabsPanel value="first" className={css.tabPanel} hidden={isCollapsed}>
                <ScrollAreaAutosize
                  viewportProps={{
                    style: {
                      maxHeight: `min(40vh, ${Math.max(height - 60, 50)}px)`
                    }
                  }}>
                  <Stack gap={0}>
                    {notations.map((n, i) => <ElementNotation key={i} value={n} />)}
                  </Stack>
                </ScrollAreaAutosize>
              </TabsPanel>
            </Tabs>
          </Paper>
        </m.div>
      )}
    </AnimatePresence>
  )
}
