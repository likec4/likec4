import { isAncestor } from '@likec4/core'
import { type AstNode, type ValidationAcceptor, type ValidationCheck, AstUtils } from 'langium'
import { isEmpty } from 'remeda'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { elementRef } from '../utils/elementRef'
import { tryOrLog } from './_shared'

// ---------------------------------------------------------------------------
// Helper: depth-first walker over all DynamicViewElement nodes in a DynamicView
// Yields { element, depth } in textual (pre-order) order.
// depth = 0 means the element is a direct child of DynamicViewBody.
// ---------------------------------------------------------------------------
type WalkEntry = { element: ast.DynamicViewElement; depth: number }

function* walkBlockBody(body: ast.DynamicBlockBody, depth: number): Generator<WalkEntry> {
  for (const el of body.elements) {
    yield { element: el, depth }
    yield* walkElement(el, depth)
  }
}

function* walkElement(el: ast.DynamicViewElement, parentDepth: number): Generator<WalkEntry> {
  const d = parentDepth + 1
  if (ast.isDynamicIfBlock(el)) {
    yield* walkBlockBody(el.thenBranch, d)
    for (const branch of el.elseIfBranches) {
      yield* walkBlockBody(branch.body, d)
    }
    if (el.elseBranch) {
      yield* walkBlockBody(el.elseBranch, d)
    }
  } else if (ast.isDynamicOptionalBlock(el)) {
    yield* walkBlockBody(el.body, d)
  } else if (ast.isDynamicRepeatBlock(el)) {
    yield* walkBlockBody(el.body, d)
  } else if (ast.isDynamicGroupBlock(el)) {
    yield* walkBlockBody(el.body, d)
  } else if (ast.isDynamicCriticalBlock(el)) {
    yield* walkBlockBody(el.body, d)
    for (const fb of el.fallbacks) {
      yield* walkBlockBody(fb.body, d)
    }
  } else if (ast.isDynamicBreakBlock(el)) {
    yield* walkBlockBody(el.body, d)
  } else if (ast.isDynamicViewParallelSteps(el)) {
    for (const step of el.steps) {
      yield { element: step, depth: d }
      yield* walkElement(step, d)
    }
    for (const branch of el.branches) {
      yield* walkBlockBody(branch.body, d)
    }
  }
  // leaf nodes: DynamicViewStep, DynamicNote, DynamicActivate, DynamicDeactivate,
  // DynamicCreate, DynamicDestroy produce no children
}

export function* walkDynamicView(view: ast.DynamicView): Generator<WalkEntry> {
  const body = view.body
  if (!body) return
  for (const el of body.steps) {
    yield { element: el, depth: 0 }
    yield* walkElement(el, 0)
  }
}

// ---------------------------------------------------------------------------
// Check #1: Actor existence for note/activate/deactivate/create/destroy
// ---------------------------------------------------------------------------
function makeActorExistsCheck(fqnIndex: LikeC4Services['likec4']['FqnIndex']) {
  return (node: { actor: ast.ElementRef } & AstNode, accept: ValidationAcceptor) => {
    const el = elementRef(node.actor)
    const fqn = el && fqnIndex.getFqn(el)
    if (!fqn) {
      accept('error', 'Actor not found (not parsed/indexed yet)', {
        node,
        property: 'actor',
      })
    }
  }
}

export const checkDynamicNoteActorsExist = (services: LikeC4Services): ValidationCheck<ast.DynamicNote> => {
  const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((node, accept) => {
    node.actors.forEach((actorRef, i) => {
      const el = elementRef(actorRef)
      const fqn = el && fqnIndex.getFqn(el)
      if (!fqn) {
        accept('error', 'Actor not found (not parsed/indexed yet)', {
          node,
          property: 'actors',
          index: i,
        })
      }
    })
  })
}

export const checkDynamicActivateActorExists = (services: LikeC4Services): ValidationCheck<ast.DynamicActivate> => {
  const fn = makeActorExistsCheck(services.likec4.FqnIndex)
  return tryOrLog((node, accept) => fn(node, accept))
}

export const checkDynamicDeactivateActorExists = (services: LikeC4Services): ValidationCheck<ast.DynamicDeactivate> => {
  const fn = makeActorExistsCheck(services.likec4.FqnIndex)
  return tryOrLog((node, accept) => fn(node, accept))
}

export const checkDynamicCreateActorExists = (services: LikeC4Services): ValidationCheck<ast.DynamicCreate> => {
  const fn = makeActorExistsCheck(services.likec4.FqnIndex)
  return tryOrLog((node, accept) => fn(node, accept))
}

export const checkDynamicDestroyActorExists = (services: LikeC4Services): ValidationCheck<ast.DynamicDestroy> => {
  const fn = makeActorExistsCheck(services.likec4.FqnIndex)
  return tryOrLog((node, accept) => fn(node, accept))
}

// ---------------------------------------------------------------------------
// Check #2: DynamicViewParallelSteps cannot mix flat steps and labeled branches
// ---------------------------------------------------------------------------
export const checkDynamicParallelMixedChildren = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicViewParallelSteps> => {
  return tryOrLog((node, accept) => {
    if (node.steps.length > 0 && node.branches.length > 0) {
      accept('error', 'parallel block cannot mix flat steps and labeled branches', {
        node,
      })
    }
  })
}

// ---------------------------------------------------------------------------
// Check #3: DynamicNote with placement='over' must have >= 1 actor
// ---------------------------------------------------------------------------
export const checkDynamicNoteOverActors = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicNote> => {
  return tryOrLog((node, accept) => {
    try {
      if (node.placement === 'over' && node.actors.length < 1) {
        accept('error', 'note over requires at least one actor', {
          node,
        })
      }
    } catch {
      accept('error', 'note over requires at least one actor', {
        node,
      })
    }
  })
}

// ---------------------------------------------------------------------------
// Check #4: DynamicAutonumberProperty with increment but no start is invalid
// ---------------------------------------------------------------------------
export const checkDynamicAutonumberStep = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicAutonumberProperty> => {
  return tryOrLog((node, accept) => {
    if (node.increment !== undefined && node.start === undefined) {
      accept('error', 'autonumber "step" requires a preceding "from" start value', {
        node,
      })
    }
  })
}

// ---------------------------------------------------------------------------
// Check #5: DynamicDeactivate A requires a preceding activate/create A
// ---------------------------------------------------------------------------
export const checkDynamicDanglingDeactivate = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicDeactivate> => {
  const fqnIndex = _services.likec4.FqnIndex
  return tryOrLog((node, accept) => {
    const actorEl = elementRef(node.actor)
    const fqn = actorEl && fqnIndex.getFqn(actorEl)
    if (!fqn) return // actor not resolved — check #1 will report

    const view = AstUtils.getContainerOfType(node, ast.isDynamicView)
    if (!view) return

    let foundActivator = false
    for (const { element } of walkDynamicView(view)) {
      if (element === node) break
      if (ast.isDynamicActivate(element) || ast.isDynamicCreate(element)) {
        const aEl = elementRef(element.actor)
        const aFqn = aEl && fqnIndex.getFqn(aEl)
        if (aFqn === fqn) {
          foundActivator = true
          break
        }
      }
    }

    if (!foundActivator) {
      accept('warning', `deactivate without preceding activate or create for this actor`, {
        node,
      })
    }
  })
}

// ---------------------------------------------------------------------------
// Check #6: DynamicCreate A must precede first use of A as source/target
// ---------------------------------------------------------------------------
export const checkDynamicCreateBeforeFirstUse = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicCreate> => {
  const fqnIndex = _services.likec4.FqnIndex
  return tryOrLog((node, accept) => {
    const actorEl = elementRef(node.actor)
    const fqn = actorEl && fqnIndex.getFqn(actorEl)
    if (!fqn) return

    const view = AstUtils.getContainerOfType(node, ast.isDynamicView)
    if (!view) return

    let createIndex = -1
    let firstUseIndex = -1
    let idx = 0

    for (const { element } of walkDynamicView(view)) {
      if (element === node) {
        createIndex = idx
      }
      if (ast.isDynamicViewStep(element)) {
        let usedHere = false
        if (ast.isDynamicStepSingle(element)) {
          const srcEl = elementRef(element.source)
          const src = srcEl && fqnIndex.getFqn(srcEl)
          const tgtEl = elementRef(element.target)
          const tgt = tgtEl && fqnIndex.getFqn(tgtEl)
          if (src === fqn || tgt === fqn) {
            usedHere = true
          }
        } else if (ast.isDynamicStepChain(element)) {
          const tgtEl = elementRef(element.target)
          const tgt = tgtEl && fqnIndex.getFqn(tgtEl)
          if (tgt === fqn) {
            usedHere = true
          }
        }
        if (usedHere && firstUseIndex === -1) {
          firstUseIndex = idx
        }
      }
      idx++
    }

    if (firstUseIndex !== -1 && createIndex > firstUseIndex) {
      accept('warning', `create appears after the first use of this actor in the view`, {
        node,
      })
    }
  })
}

// ---------------------------------------------------------------------------
// Check #7: DynamicDestroy A must be A's last reference in the view
// ---------------------------------------------------------------------------
export const checkDynamicDestroyIsLastUse = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicDestroy> => {
  const fqnIndex = _services.likec4.FqnIndex
  return tryOrLog((node, accept) => {
    const actorEl = elementRef(node.actor)
    const fqn = actorEl && fqnIndex.getFqn(actorEl)
    if (!fqn) return

    const view = AstUtils.getContainerOfType(node, ast.isDynamicView)
    if (!view) return

    let destroyIndex = -1
    let lastUseAfterDestroy = false
    let idx = 0

    for (const { element } of walkDynamicView(view)) {
      if (element === node) {
        destroyIndex = idx
      } else if (destroyIndex !== -1) {
        // any reference after destroy
        let referencedHere = false
        if (ast.isDynamicViewStep(element)) {
          if (ast.isDynamicStepSingle(element)) {
            const srcEl = elementRef(element.source)
            const src = srcEl && fqnIndex.getFqn(srcEl)
            const tgtEl = elementRef(element.target)
            const tgt = tgtEl && fqnIndex.getFqn(tgtEl)
            if (src === fqn || tgt === fqn) referencedHere = true
          } else if (ast.isDynamicStepChain(element)) {
            const tgtEl = elementRef(element.target)
            const tgt = tgtEl && fqnIndex.getFqn(tgtEl)
            if (tgt === fqn) referencedHere = true
          }
        } else if (ast.isDynamicActivate(element) || ast.isDynamicDeactivate(element) || ast.isDynamicCreate(element)) {
          const aEl = elementRef(element.actor)
          const aFqn = aEl && fqnIndex.getFqn(aEl)
          if (aFqn === fqn) referencedHere = true
        } else if (ast.isDynamicNote(element)) {
          for (const actorRef of element.actors) {
            const aEl = elementRef(actorRef)
            const aFqn = aEl && fqnIndex.getFqn(aEl)
            if (aFqn === fqn) {
              referencedHere = true
              break
            }
          }
        }
        if (referencedHere) lastUseAfterDestroy = true
      }
      idx++
    }

    if (lastUseAfterDestroy) {
      accept('warning', `destroy is not the last reference to this actor in the view`, {
        node,
      })
    }
  })
}

// ---------------------------------------------------------------------------
// Check #8: Sequence-only constructs in a 'diagram' variant view → info
// ---------------------------------------------------------------------------
const isSequenceOnlyElement = (el: ast.DynamicViewElement): boolean => {
  return (
    ast.isDynamicNote(el) ||
    ast.isDynamicActivate(el) ||
    ast.isDynamicDeactivate(el) ||
    ast.isDynamicCreate(el) ||
    ast.isDynamicDestroy(el) ||
    ast.isDynamicIfBlock(el) ||
    ast.isDynamicOptionalBlock(el) ||
    ast.isDynamicRepeatBlock(el) ||
    ast.isDynamicGroupBlock(el) ||
    ast.isDynamicCriticalBlock(el) ||
    ast.isDynamicBreakBlock(el) ||
    (ast.isDynamicViewParallelSteps(el) && el.branches.length > 0)
  )
}

export const checkDynamicSequenceOnlyInDiagramVariant = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicView> => {
  return tryOrLog((view, accept) => {
    const body = view.body
    if (!body) return

    const variantProp = body.props.find(ast.isDynamicViewDisplayVariantProperty)
    if (!variantProp || variantProp.value !== 'diagram') return

    // Check autonumber property
    for (const prop of body.props) {
      if (ast.isDynamicAutonumberProperty(prop)) {
        accept('info', `this construct is ignored in 'diagram' variant`, {
          node: prop,
        })
      }
    }

    // Check sequence-only elements in the step tree
    for (const { element } of walkDynamicView(view)) {
      if (isSequenceOnlyElement(element)) {
        accept('info', `this construct is ignored in 'diagram' variant`, {
          node: element,
        })
      }
    }
  })
}

// ---------------------------------------------------------------------------
// Check #9: Empty DynamicBlockBody
// ---------------------------------------------------------------------------
export const checkDynamicEmptyBlockBody = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicBlockBody> => {
  return tryOrLog((node, accept) => {
    if (node.elements.length === 0) {
      accept('warning', 'block body is empty', {
        node,
      })
    }
  })
}

// ---------------------------------------------------------------------------
// Check #10: Block nesting depth > 6
// ---------------------------------------------------------------------------
export const checkDynamicBlockNestingDepth = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicBlockBody> => {
  return tryOrLog((node, accept) => {
    let depth = 0
    let container: { $container?: unknown } = node
    while (container.$container) {
      const parent = container.$container
      if (ast.isDynamicBlockBody(parent)) {
        depth++
      }
      if (ast.isDynamicView(parent)) break
      container = parent as { $container?: unknown }
    }
    if (depth >= 6) {
      accept('warning', `block nesting depth exceeds the maximum of 6`, {
        node,
      })
    }
  })
}

// ---------------------------------------------------------------------------
// Existing checks (unchanged)
// ---------------------------------------------------------------------------
export const dynamicViewStepSingle = (services: LikeC4Services): ValidationCheck<ast.DynamicStepSingle> => {
  const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((el, accept) => {
    const sourceEl: ast.Element | undefined = elementRef(el.source)
    const source = sourceEl && fqnIndex.getFqn(sourceEl)
    if (!source) {
      accept('error', 'Source not found (not parsed/indexed yet)', {
        node: el,
        property: 'source',
      })
    }

    const targetEl: ast.Element | undefined = elementRef(el.target)
    const target = targetEl && fqnIndex.getFqn(targetEl)
    if (!target) {
      accept('error', 'Target not found (not parsed/indexed yet)', {
        node: el,
        property: 'target',
      })
    }

    if (source && target && (isAncestor(source, target) || isAncestor(target, source))) {
      accept('error', 'Invalid parent-child relationship', {
        node: el,
      })
    }
  })
}

export const dynamicViewStepChain = (services: LikeC4Services): ValidationCheck<ast.DynamicStepChain> => {
  const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((el, accept) => {
    const source = el.source
    if (ast.isDynamicStepSingle(source) && source.isBackward) {
      accept('error', 'Invalid chain after backward step', {
        node: el,
      })
    }

    const targetEl: ast.Element | undefined = elementRef(el.target)
    const target = targetEl && fqnIndex.getFqn(targetEl)
    if (!target) {
      accept('error', 'Target not found (not parsed/indexed yet)', {
        node: el,
        property: 'target',
      })
    }
  })
}

export const dynamicViewParallelSteps = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicViewParallelSteps> => {
  return tryOrLog((el, accept) => {
    // #988: a parallel block must not be nested inside another parallel — whether
    // reached via a flat `steps` child or through a labeled `branch` body (possibly
    // via intervening if/optional/repeat/group/critical/break blocks). Checking the
    // parallel's own ancestors and reporting from the inner node yields exactly one
    // diagnostic per nested parallel, regardless of nesting depth or path.
    if (AstUtils.getContainerOfType(el.$container, ast.isDynamicViewParallelSteps)) {
      accept('error', 'Nested parallel blocks are not allowed', {
        node: el,
      })
    }
  })
}

export const dynamicViewDisplayVariant = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicViewDisplayVariantProperty> => {
  return tryOrLog((prop, accept) => {
    if (isEmpty(prop.value) || (prop.value !== 'diagram' && prop.value !== 'sequence')) {
      accept('error', 'Invalid display variant: "diagram" or "sequence" are allowed', {
        node: prop,
        property: 'value',
      })
      return
    }
    if (!AstUtils.hasContainerOfType(prop, ast.isDynamicViewBody)) {
      accept('error', `Display mode can be defined only inside dynamic view`, {
        node: prop,
      })
    }
  })
}
