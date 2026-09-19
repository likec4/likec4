import { type scalar, RichText } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { Box, HStack, styled, Txt, VStack } from '@likec4/styles/jsx'
import { CloseButton, Spoiler } from '@mantine/core'
import { IconDirectionSignFilled } from '@tabler/icons-react'
import { Markdown } from '../../../base-primitives/Markdown'
import { useDiagram } from '../../../hooks/safeContext'
import { useSelectContext } from './StoreProvider'

// export type OutlineHeaderProps = {
//   title: string | null
//   description: scalar.MarkdownOrString | null
//   /** Global number of the step the walkthrough is on (1-based). */
//   stepnum: number
//   stepCount: number
// }

/** View title, walkthrough progress and the (optional) view description. */
export const OutlineHeader = () => {
  const diagram = useDiagram()
  const { title, description, stepnum, stepCount } = useSelectContext(s => ({
    title: s.title,
    description: s.description,
    stepnum: s.stepNum,
    stepCount: s.flow.steps.length,
  }))
  const pad = String(stepCount).length
  return (
    <VStack
      css={{
        gap: '2.5',
        width: '100%',
        paddingInline: '2.5',
        paddingBlock: '2',
        borderBottom: 'panel',
      }}>
      <HStack
        css={{
          gap: '2.5',
          alignItems: 'flex-start',
          width: '100%',
          padding: '0',
        }}
      >
        <Box
          css={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSize: '[20px]',
            rounded: 'sm',
            colorPalette: 'subflow.loop',
            bg: 'colorPalette.label',
            color: 'colorPalette.text',
          }}
        >
          <IconDirectionSignFilled size={14} />
        </Box>
        <VStack css={{ gap: '0', alignItems: 'stretch', flex: '1', minWidth: '0' }}>
          <styled.div
            css={{
              fontSize: 'sm',
              fontWeight: 'semibold',
              color: 'text',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title ?? 'Sequence'}
          </styled.div>
          <styled.div
            css={{
              marginTop: '0.5',
              textStyle: 'dimmed.xxs',
              fontWeight: 'medium',
              letterSpacing: 'caps.sm',
              textTransform: 'uppercase',
              fontVariantNumeric: 'tabular-nums',
              userSelect: 'none',
            }}
          >
            Step {String(stepnum).padStart(pad, '0')} / {stepCount}
          </styled.div>
          <Box
            css={{
              height: '[2px]',
              marginTop: '1.5',
              rounded: 'xs',
              bg: 'border.subtle',
              overflow: 'hidden',
            }}
          >
            <styled.div
              css={{
                height: '100%',
                rounded: 'xs',
                bg: 'primary.body',
                transitionProperty: '[width]',
                transition: 'slow',
              }}
              style={{ width: `${stepnum / stepCount * 100}%` }}
            />
          </Box>
        </VStack>
        <Box
          css={{
            flex: 'none',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CloseButton size="sm" onClick={() => diagram.stopWalkthrough()} />
        </Box>
      </HStack>
      {description && (
        <Spoiler
          showLabel={<Txt size="xxs">show description</Txt>}
          hideLabel={<Txt size="xxs">hide</Txt>}
          maxHeight={16}
        >
          <Markdown
            value={RichText.from(description)}
            className={css({
              color: 'text.dimmed',
            })}
            fontSize={'xxs'}
          />
        </Spoiler>
      )}
    </VStack>
  )
}
