import { type scalar, hasProp, RichText } from '@likec4/core'
import { stringHash } from '@likec4/core/utils'
import { css, cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { nodeNotes } from '@likec4/styles/recipes'
import { ScrollAreaAutosize } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { ViewportPortal } from '@xyflow/react'
import { type Variants, AnimatePresence, m } from 'motion/react'
import type { MouseEvent } from 'react'
import { clamp, isEmptyish } from 'remeda'
import { Markdown } from '../../../base-primitives'
import type { BaseNodePropsWithData } from '../../../base/types'
import { useCallbackRef, useOnDiagramEvent } from '../../../hooks'
import type { Types } from '../../types'

type RequiredData = Pick<Types.NodeData, 'id' | 'notes' | 'width' | 'height' | 'x' | 'y'>

export type NodeNotesProps = BaseNodePropsWithData<RequiredData>

export function NodeNotes({ data }: NodeNotesProps) {
  if (!hasProp(data, 'notes') || isEmptyish(data.notes.md || data.notes.txt)) {
    return null
  }

  return <NodeNotesInternal2 data={data} />
}

function stopPropagation(e: MouseEvent): void {
  e.nativeEvent.stopImmediatePropagation()
  e.stopPropagation()
}

function NodeNotesInternal2({ data }: Pick<NodeNotesProps, 'data'> & {
  data: {
    notes: scalar.MarkdownOrString
  }
}) {
  return <NodeNotesInternal data={data} />
  // return (
  //   <div className={nodeNotes({})}>
  //     <div className="__paper"></div>
  //   </div>
  // )
}

function NodeNotesInternal({ data }: Pick<NodeNotesProps, 'data'> & {
  data: {
    notes: scalar.MarkdownOrString
  }
}) {
  const markdown = data.notes
  const width = clamp(data.width ?? 0, {
    min: 250,
    max: 500,
  })
  const height = clamp(data.height ?? 0, {
    min: 200,
    max: 600,
  })

  const [expanded, handlers] = useDisclosure(false, {})

  const id = stringHash(data.id + (markdown.md ?? markdown.txt))

  const onClickCapture = useCallbackRef((e?: PointerEvent | MouseEvent) => {
    if (e) {
      e.preventDefault()
      if ('nativeEvent' in e) {
        e.nativeEvent.stopImmediatePropagation()
      }
      e.stopPropagation()
    }
    handlers.toggle()
  })

  const hovered = data.hovered ?? false
  const layoutDependency = expanded // || hovered

  return (
    <>
      <AnimatePresence>
        <m.div
          key={`node-notes-${id}`}
          // layoutDependency={layoutDependency}
          className={cx(
            'nopan nodrag',
            nodeNotes({ opened: expanded }),
          )}
          variants={variants.root}
          initial={'initial'}
          animate={expanded ? 'expanded' : hovered ? 'hovered' : 'initial'}
          whileHover={'whileHover'}
          exit={'exit'}
          {...(!expanded && { onPointerDownCapture: onClickCapture })}
          onMouseDownCapture={onClickCapture}
          onClickCapture={onClickCapture}
          onClick={stopPropagation}
          data-state={expanded ? 'expanded' : 'collapsed'}
        >
          <m.div
            key="paper-back"
            variants={variants.paper1}
            className={'__paper __paper-back'}
          />
          {!expanded && (
            <m.div
              key={id}
              layout
              layoutId={id}
              variants={variants.paper2}
              data-state={expanded ? 'expanded' : 'collapsed'}
              className={'__paper __paper-front'}
            />
          )}
        </m.div>
        {expanded && (
          <ViewportPortal key={'portal'}>
            <m.div
              key={id}
              layout
              layoutDependency={layoutDependency}
              layoutId={id}
              className={css({
                position: 'absolute',
                zIndex: 300,
                top: '0',
                left: '0',
                display: 'flex',
                pointerEvents: 'all',
                rounded: 'sm',
                backgroundColor: 'likec4.overlay.body',
                padding: '0',
                alignItems: 'stretch',
                justifyContent: 'stretch',
                overflow: 'hidden',
                width: 'fit-content',
                height: 'fit-content',
                maxHeight: '70cqh',
                maxWidth: '50cqw',
                // minHeight: '60cqh',
              })}
              data-likec4-notes={id}
              style={{
                top: data.y + 20,
                left: data.x + 10,
                maxWidth: `min(calc(${width}px * 2), 50cqw)`,
                // minHeight: `max(${height}px, 60cqh)`,
                // maxHeight: height,
              }}
              onMouseDownCapture={stopPropagation}
              onClickCapture={stopPropagation}
              onClick={stopPropagation}
            >
              <ScrollAreaAutosize
                component={m.div}
                className={cx(
                  'nowheel',
                  css({
                    flex: '1',
                    padding: 'xs',
                    paddingRight: 'xxs',
                  }),
                )}>
                <Markdown
                  className={css({
                    paddingRight: 'xxs',
                  })}
                  value={RichText.from(markdown)} />
              </ScrollAreaAutosize>
            </m.div>
          </ViewportPortal>
        )}
      </AnimatePresence>
      {expanded && (
        <Catch
          data={data}
          onCatchClick={onClickCapture}
        />
      )}
    </>
  )
}

const base_paper1 = {
  rotateZ: '-5deg',
  y: 0,
  x: 1,
  scale: 1,
  originX: '55%',
  originY: '80%',
}

const base_paper2 = {
  rotateZ: '3deg',
  y: -2,
  scale: 1,
  backgroundColor: 'color-mix(in oklab, var(--likec4-palette-fill) 8%, #FFF)',
  originX: '45%',
  originY: '80%',
}

const variants = {
  root: {
    initial: {
      ['--paper-bg']: 'color-mix(in oklab, var(--likec4-palette-fill) 50%, #EEE)',
    },
    hovered: {},
    whileHover: {
      ['--paper-bg']: 'color-mix(in oklab, var(--likec4-palette-fill) 3%, #FFF)',
    },
    exit: {
      ['--paper-bg']: 'color-mix(in oklab, var(--likec4-palette-fill) 50%, #EEE)',
    },
  },
  // PAPER BACK
  paper1: {
    initial: {
      ...base_paper1,
      rotateZ: '-3.5deg',
      y: 1,
      scale: .95,
    },
    hovered: {
      ...base_paper1,
    },
    whileHover: {
      ...base_paper1,
      ['--paper-bg']: 'color-mix(in oklab, var(--likec4-palette-fill) 3%, #FFF)',
      scale: 1.04,
    },
    expanded: {
      ...base_paper1,
      y: [0, 1, 20],
      scale: .95,
    },
    exit: {
      ...base_paper1,
      rotateZ: '-3.5deg',
      y: 1,
      scale: .95,
    },
  },
  // PAPER FRONT
  paper2: {
    initial: {
      ...base_paper2,
      rotateZ: '2deg',
      y: 2,
      scale: .95,
      backgroundColor: 'color-mix(in oklab, var(--likec4-palette-fill) 50%, #EEE)',
    },
    hovered: {
      ...base_paper2,
    },
    whileHover: {
      ...base_paper2,
      scale: 1.08,
    },
    expanded: {
      ...base_paper2,
      y: [0, 1, 20],
      scale: .95,
    },
    exit: {
      ...base_paper2,
      rotateZ: '2deg',
      y: 2,
      scale: .95,
      backgroundColor: 'color-mix(in oklab, var(--likec4-palette-fill) 50%, #EEE)',
    },
  },
} satisfies Record<string, Variants>

function Catch({
  data,
  onCatchClick,
}: {
  data: {
    x: number
    y: number
    width?: number
    height?: number
  }
  onCatchClick: (e?: MouseEvent) => void
}) {
  useOnDiagramEvent('paneClick', () => {
    onCatchClick()
  })
  return (
    <ViewportPortal key="catch-all">
      <Box
        css={{
          display: 'block',
          position: 'absolute',
          zIndex: 200,
          pointerEvents: 'all',
          left: '0',
          top: '0',
          cursor: 'zoom-out',
        }}
        style={{
          transform: `translate(${data.x - 40}px, ${data.y - 40}px)`,
          width: (data.width ?? 250) + 80,
          height: (data.height ?? 200) + 80,
        }}
        onMouseDownCapture={onCatchClick}
        onClickCapture={onCatchClick}
        onClick={stopPropagation}
      >
      </Box>
    </ViewportPortal>
  )
}
