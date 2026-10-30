import { css } from '@likec4/styles/css'
import { Tooltip, UnstyledButton } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { type ReactNode, useState } from 'react'
import { type LayoutStorage, Group, Panel, Separator, useDefaultLayout, usePanelRef } from 'react-resizable-panels'

const group = css({
  height: '100%',
  minHeight: '0',
})

const pane = css({
  height: '100%',
  minWidth: '0',
})

const separator = css({
  position: 'relative',
  width: '[16px]',
  outline: 'none',
  // the visible line
  _before: {
    content: '""',
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: '[7.5px]',
    width: '[1px]',
    backgroundColor: 'transparent',
    transition: 'fast',
  },
  // focus after a drag or a click on the toggle must not keep the line visible,
  // so only keyboard focus shows it
  '&:is([data-separator="hover"], :focus-visible)': {
    _before: {
      backgroundColor: 'border.default',
    },
  },
  '&[data-separator="active"]': {
    _before: {
      left: '[7px]',
      width: '[2px]',
      backgroundColor: 'primary.border',
    },
  },
})

const toggle = css({
  position: 'absolute',
  top: '1',
  left: '[50%]',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '[16px]',
  height: '[24px]',
  borderRadius: 'sm',
  color: 'text.dimmed',
  cursor: 'pointer',
  transition: 'fast',
  _hover: {
    color: 'text',
    backgroundColor: 'surface.hover',
  },
})

// localStorage is not available in SSR
const layoutStorage: LayoutStorage = typeof localStorage !== 'undefined'
  ? localStorage
  : { getItem: () => null, setItem: () => {} }

type PropertiesSplitProps = {
  main: ReactNode
  /**
   * Sidebar content, `null` if there is nothing to show
   */
  sidebar: ReactNode | null
}

/**
 * Two panes: main content and a resizable, collapsible sidebar on the right.
 * The layout (including collapsed state) is remembered across sessions.
 */
export function PropertiesSplit({ main, sidebar }: PropertiesSplitProps) {
  if (sidebar === null) {
    return <div className={pane}>{main}</div>
  }
  return <Split main={main} sidebar={sidebar} />
}

function Split({ main, sidebar }: { main: ReactNode; sidebar: ReactNode }) {
  const layout = useDefaultLayout({
    id: 'likec4-element-details-properties',
    storage: layoutStorage,
  })
  const sidebarRef = usePanelRef()
  const [collapsed, setCollapsed] = useState(false)

  const toggleSidebar = () => {
    const panel = sidebarRef.current
    if (!panel) {
      return
    }
    if (panel.isCollapsed()) {
      panel.expand()
    } else {
      panel.collapse()
    }
  }
  const label = collapsed ? 'Show sidebar' : 'Hide sidebar'

  return (
    <Group
      className={group}
      orientation="horizontal"
      defaultLayout={layout.defaultLayout}
      onLayoutChanged={layout.onLayoutChanged}>
      <Panel id="main" className={pane} minSize={280}>
        {main}
      </Panel>
      <Separator className={separator}>
        <Tooltip
          label={label}
          position="left"
          openDelay={400}
          // render inside the modal dialog, otherwise the tooltip is behind it
          withinPortal={false}>
          <UnstyledButton
            className={toggle}
            aria-label={label}
            aria-expanded={!collapsed}
            // do not start resizing from the toggle
            onPointerDown={e => e.stopPropagation()}
            onClick={toggleSidebar}
          >
            {collapsed ? <IconChevronLeft size={14} stroke={2} /> : <IconChevronRight size={14} stroke={2} />}
          </UnstyledButton>
        </Tooltip>
      </Separator>
      <Panel
        id="sidebar"
        className={pane}
        panelRef={sidebarRef}
        defaultSize={260}
        minSize={180}
        collapsible
        collapsedSize={0}
        onResize={size => setCollapsed(size.inPixels === 0)}>
        {sidebar}
      </Panel>
    </Group>
  )
}
