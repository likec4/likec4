import { type ModelExpression, FqnRef, ModelFqnExpr } from '@likec4/core'
import { cx } from '@likec4/styles/css'
import { Box, styled } from '@likec4/styles/jsx'
import { hstack, txt, vstack } from '@likec4/styles/patterns'
import { ActionIcon } from '@mantine/core'
import { IconCirclePlus, IconTrash } from '@tabler/icons-react'
import { AnimatePresence, LayoutGroup, m } from 'motion/react'
import { useLikeC4Model } from '../../hooks/useLikeC4Model'
import type { AdhocRule } from '../actor.types'

export function ViewRulesPanel({
  rules,
  onToggle,
  onDelete,
}: {
  rules: AdhocRule[]
  onToggle: (rule: AdhocRule) => void
  onDelete: (rule: AdhocRule) => void
}) {
  return (
    <Box p="1">
      <styled.h4 mt="0" fontSize="md" fontWeight="normal">View Rules</styled.h4>
      <AnimatePresence mode="popLayout" propagate>
        <LayoutGroup>
          <m.div layout layoutRoot className={vstack({ gap: '1' })}>
            {rules.map(rule => (
              <m.div
                layout="position"
                key={rule.id}
                onClick={() => {
                  return onToggle(rule)
                }}
                initial={{
                  opacity: 0,
                  y: -50,
                }}
                animate={{
                  opacity: rule.enabled ? 1 : 0.5,
                  scale: rule.enabled ? 1 : 0.98,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  y: -50,
                }}
                className={cx(
                  hstack({
                    p: '1',
                    px: '2',
                    flexWrap: 'nowrap',
                    rounded: 'sm',
                    colorPalette: 'teal',
                    // colorPalette: rule.type === 'include' ? 'green' : 'red',
                    gap: '2',
                    border: 'default',
                    // opacity: rule.enabled ? 1 : 0.5,
                  }),
                  // rule.type !== 'include' && css({ colorPalette: 'red' }),
                )}>
                <ViewRule
                  key={rule.id}
                  rule={rule}
                  onToggle={() => onToggle(rule)}
                  onDelete={() => onDelete(rule)}
                />
              </m.div>
            ))}
          </m.div>
        </LayoutGroup>
      </AnimatePresence>
    </Box>
  )
}

function ViewRule(
  { rule, onToggle, onDelete }: {
    rule: AdhocRule
    onToggle: () => void
    onDelete: () => void
  },
) {
  const isInclude = rule.type === 'include'
  // const exprs = rule.include ?? rule.exclude

  return (
    <>
      <PredicatIcon>
        <IconCirclePlus size={14} />
      </PredicatIcon>
      <m.div
        layout
        animate={{
          originX: 0,
          scale: rule.enabled ? 1 : 0.9,
        }}
        className={txt({ flex: 1, truncate: true })}>
        {JSON.stringify(rule.expr)}
      </m.div>
      <ActionIcon
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        variant="subtle"
        color="red">
        <IconTrash />
      </ActionIcon>
    </>
  )
}

function renderExpression(expr: ModelExpression) {
  if (ModelFqnExpr.isModelRef(expr)) {
    return <ExpressionRef expr={expr} />
  }
  return null
}

// function renderPredicate(predicate)
function useElementByFqnRef(ref: FqnRef.ModelRef<any>) {
  const fqn = FqnRef.flatten(ref)
  return useLikeC4Model().findElement(fqn)?.$element ?? null
}

function ExpressionRef({ expr }: { expr: ModelFqnExpr.Ref<any> }) {
  const el = useElementByFqnRef(expr.ref)

  if (!el) {
    return <div>{FqnRef.flatten(expr.ref)}</div>
  }

  return <styled.div fontSize="xs">{el.title}</styled.div>
}

const PredicatIcon = styled('div', {
  base: {
    display: 'contents',
    color: 'colorPalette.9',
  },
})
