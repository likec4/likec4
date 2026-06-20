import type { DynamicViewFlow } from '@likec4/core'
import { sva } from '@likec4/styles/css'
import { createStyleContext } from '@likec4/styles/jsx'
import type { Types } from '../../types'

const recipe = sva({
  slots: ['root', 'label'],
  base: {
    root: {
      width: '100%',
      height: '100%',
      border: 'default',
      rounded: 'md',
      padding: '0',
      borderWidth: '2',
      borderColor: 'colorPalette.border',
    },
    label: {
      color: 'colorPalette.text',
      fontSize: 'xs',
      fontWeight: 'bold',
      letterSpacing: '.75px',
      paddingLeft: '2',
      paddingRight: '4',
      paddingBlock: '0.5',
      textTransform: 'uppercase',
      background: 'black/50',
      clipPath: 'polygon(0px 0px, 100% 0px, calc(100% - 8px) 100%, 0px 100%)',
      width: 'max-content',
      borderTopLeftRadius: 'md',
    },
  },
  variants: {
    filled: {
      true: {
        root: {
          backgroundColor: 'colorPalette',
        },
      },
      false: {
        root: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        },
      },
    },
    subflow: {
      opt: {
        root: {
          colorPalette: 'sequence.opt',
        },
      },
      alt: {
        root: {
          colorPalette: 'sequence.alt',
        },
      },
      par: {
        root: {
          colorPalette: 'sequence.par',
        },
      },
      loop: {
        root: {
          colorPalette: 'sequence.loop',
        },
      },
      break: {
        root: {
          colorPalette: 'sequence.break',
        },
      },
    },
  },
  defaultVariants: {
    filled: true,
  },
})

const { withContext, withProvider } = createStyleContext(recipe)

const SubflowRoot = withProvider('div', 'root')
const SubflowLabel = withContext('div', 'label')

function flowtypeVariant(type: DynamicViewFlow.SubFlowType): 'opt' | 'alt' | 'par' | 'loop' | 'break' {
  switch (type) {
    case 'alt':
    case 'alt-when':
    case 'alt-else':
    case 'alt-if':
      return 'alt' as const
    case 'try':
    case 'try-block':
    case 'try-catch':
    case 'try-finally':
      return 'break' as const
    default:
      return type
  }
}

export function SequenceSubflowArea({
  data: {
    flowType,
    title,
    ...data
  },
}: Types.NodeProps<'seq-subflow'>) {
  const isHovered = data.hovered === true
  return (
    <SubflowRoot subflow={flowtypeVariant(flowType)}>
      <SubflowLabel>{flowType} - {title}</SubflowLabel>
    </SubflowRoot>
  )
}

// const SubflowTypeLabel = styled('div', {
//   base: {
//     fontSize: 'xs',
//     fontWeight: 'bold',
//     letterSpacing: '.75px',
//     paddingLeft: '2',
//     paddingRight: '4',
//     paddingBlock: '0.5',
//     textTransform: 'uppercase',
//     background: 'black/70',
//     clipPath: 'polygon(0px 0px, 100% 0px, calc(100% - 8px) 100%, 0px 100%)',
//     width: 'max-content',
//     borderTopLeftRadius: 'md',
//   },
// })
