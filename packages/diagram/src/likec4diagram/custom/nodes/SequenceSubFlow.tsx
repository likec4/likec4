import { type DynamicViewFlow } from '@likec4/core'
import { type RecipeVariant, css, cx, sva } from '@likec4/styles/css'
import { hstack } from '@likec4/styles/patterns'
import { useDiagram } from '../../../hooks'
import type { Types } from '../../types'

const labelStyle = css.raw({
  color: 'colorPalette.text',
  fontSize: '[9px]',
  fontWeight: 'bold',
  lineHeight: 'xs',
  letterSpacing: 'tight',
  textTransform: 'uppercase',
})

const withBorder = css.raw({
  border: '{borderWidths.2} solid {colors.colorPalette.border}',
})

const withBackground = css.raw({
  background: 'colorPalette',
  ['&[data-state="hovered"]']: {
    background: 'colorPalette.hovered',
    transition: 'faster',
    transitionDelay: 'faster',
    transitionTimingFunction: 'out',
    transitionProperty: 'background',
  },
  ['&[data-state="collapsed"]']: {
    background: 'colorPalette.label',
  },
})

const recipe = sva({
  slots: ['root', 'content', 'label', 'title'],
  base: {
    root: css.raw({
      width: '100%',
      height: '100%',
      padding: '0',
    }),
    content: hstack.raw({
      gap: '2',
      width: '100%',
      alignItems: 'center',
    }),
    label: css.raw(labelStyle),
    title: css.raw({
      flex: '1',
      color: `[oklch(from {colors.colorPalette.text} l calc(c - 0.15) h)]`,
      fontSize: 'xs',
      lineHeight: 'xxs',
      fontWeight: 'medium',
      truncate: true,
    }),
  },
  variants: {
    variant: {
      subflow: {
        root: css.raw(withBackground, withBorder, {
          rounded: 'md',
        }),
        label: css.raw(withBorder, {
          alignSelf: 'stretch',
          paddingInline: '2',
          paddingBlock: '1',
          background: 'colorPalette.label',
          // clipPath: 'polygon(0px 0px, 100% 0px, calc(100% - 8px) 100%, 0px 100%)',
          width: 'max-content',
          borderTopLeftRadius: 'sm',
          borderBottomRightRadius: 'sm',
          borderTop: 'none',
          borderLeft: 'none',
          [':is([data-state="collapsed"]) &']: {
            // alignSelf: 'stretch',
            background: 'none',
            borderColor: 'transparent',
          },
        }),
      },
      branch: {
        root: css.raw(withBackground, withBorder, {
          rounded: '0',
          borderTopWidth: '1',
          ['&[data-is-last="true"]']: {
            borderBottomLeftRadius: 'md',
            borderBottomRightRadius: 'md',
          },
          ['&:not([data-is-last="true"])']: {
            borderBottomWidth: '1',
          },
          ['&[data-state="collapsed"]']: {
            background: 'colorPalette.header',
          },
        }),
        label: css.raw({
          position: 'relative',
          background: 'colorPalette.label',
          paddingLeft: '4.5',
          paddingRight: '2',
          paddingBlock: '1',
          marginBlock: '2',
          marginInlineStart: '2',
          rounded: 'sm',
          minWidth: '[40px]',
          width: 'min-content',
          textAlign: 'center',
          _before: {
            position: 'absolute',
            content: '" "',
            background: 'currentColor',
            width: '[5px]',
            height: '[5px]',
            opacity: '[.6]',
            rounded: 'pill',
            top: '[50%]',
            left: '2',
            transform: 'translateY(-50%)',
          },
        }),
      },
      // alt and try
      withbranches: {
        content: css.raw(withBorder, {
          width: '100%',
          borderTopLeftRadius: 'md',
          borderTopRightRadius: 'md',
          paddingInline: '2',
          borderBottomWidth: '1',
          background: 'colorPalette.header',
        }),
      },
    },
  },
  defaultVariants: {
    variant: 'subflow',
  },
  className: 'seq-subflow',
})

type FlowType = DynamicViewFlow.SubFlowType
/**
 * PandaCSS `colorPalette` classes for each sub-flow palette.
 * Declared as literals so the static analyzer can extract them.
 */
const palette = {
  loop: css({ colorPalette: 'subflow.loop' }),
  opt: css({ colorPalette: 'subflow.opt' }),
  par: css({ colorPalette: 'subflow.par' }),
  break: css({ colorPalette: 'subflow.break' }),
  alt: css({ colorPalette: 'subflow.alt' }),
  try: css({ colorPalette: 'subflow.try' }),
} as const

type FlowPresentation = {
  readonly paletteClass: string
  readonly variant: NonNullable<RecipeVariant<typeof recipe>['variant']>
  readonly label: string
}

const flowPresentation: Record<FlowType, FlowPresentation> = {
  loop: { paletteClass: palette.loop, variant: 'subflow', label: 'loop' },
  opt: { paletteClass: palette.opt, variant: 'subflow', label: 'opt' },
  par: { paletteClass: palette.par, variant: 'subflow', label: 'par' },
  break: { paletteClass: palette.break, variant: 'subflow', label: 'break' },
  alt: { paletteClass: palette.alt, variant: 'withbranches', label: 'alt' },
  'alt-when': { paletteClass: palette.alt, variant: 'branch', label: 'when' },
  'alt-else': { paletteClass: palette.alt, variant: 'branch', label: 'else' },
  'alt-if': { paletteClass: palette.alt, variant: 'branch', label: 'if' },
  try: { paletteClass: palette.try, variant: 'withbranches', label: 'try' },
  'try-block': { paletteClass: palette.try, variant: 'branch', label: 'block' },
  'try-catch': { paletteClass: palette.break, variant: 'branch', label: 'catch' },
  'try-finally': { paletteClass: palette.break, variant: 'branch', label: 'finally' },
}

export function SequenceSubflowArea(props: Types.NodeProps<'seq-subflow'>) {
  const { data } = props
  const isDimmed = data.dimmed ?? false
  const diagram = useDiagram()

  const toggleSequenceFlow = (event: React.MouseEvent) => {
    event.stopPropagation()
    diagram.toggleSequenceFlow(data.flowId)
  }

  const { paletteClass, variant, label } = flowPresentation[data.flowType]

  const classes = recipe({ variant })
  const headerHeight = data.flowType === 'alt' || data.flowType === 'try' ? data.headerHeight : undefined

  let state = undefined
  if (data.collapsed === true) {
    state = 'collapsed'
  } else if (data.hovered) {
    state = 'hovered'
  }

  return (
    <div
      className={cx(classes.root, paletteClass)}
      data-is-first={data.isFirst === true}
      data-is-last={data.isLast === true}
      data-state={state}
      {...(isDimmed !== false && {
        'data-likec4-dimmed': isDimmed,
      })}
    >
      <div className={classes.content} style={{ height: headerHeight }}>
        <div className={classes.label} onClick={toggleSequenceFlow}>{label}</div>
        {data.title && <div className={classes.title} onClick={toggleSequenceFlow}>{data.title}</div>}
      </div>
    </div>
  )
}
