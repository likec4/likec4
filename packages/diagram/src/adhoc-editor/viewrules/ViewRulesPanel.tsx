import { type ModelExpression, FqnRef, ModelFqnExpr } from '@likec4/core'
import { Box, HStack, styled, VStack } from '@likec4/styles/jsx'
import { IconCirclePlus } from '@tabler/icons-react'
import { useLikeC4Model } from '../../hooks/useLikeC4Model'
import type { AdhocRule } from '../actor.types'

export function ViewRulesPanel({ rules }: { rules: AdhocRule[] }) {
  return (
    <Box p="1">
      <styled.h4 mt="0" fontSize="md" fontWeight="normal">View Rules</styled.h4>
      <VStack gap={'1'}>
        {rules.map(rule => <ViewRule key={rule.id} {...rule} />)}
      </VStack>
    </Box>
  )
}

function ViewRule({ id, rule }: AdhocRule) {
  const isInclude = 'include' in rule
  const exprs = rule.include ?? rule.exclude

  return (
    <>
      {exprs.map((expr, i) => (
        <HStack
          key={id + '@' + i}
          css={{
            p: '1',
            px: '2',
            rounded: 'sm',
            colorPalette: isInclude ? 'grass' : 'red',
            gap: '2',
            border: 'default',
          }}>
          <PredicatIcon>
            <IconCirclePlus size={14} />
          </PredicatIcon>
          {renderExpression(expr)}
        </HStack>
      ))}
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
