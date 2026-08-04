import type { AnyStoryView, DiagramView, Fqn } from '@likec4/core/types'
import { scalar } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import type { Types } from '../types'
import { findCorrespondingNode, findNodeByModelFqn } from './utils'

describe('findNodeByModelFqn', () => {
  it('returns null when xynodes array is empty', () => {
    const result = findNodeByModelFqn([], 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('returns null when no node has matching modelFqn', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: 'cloud.frontend' as Fqn } },
      { id: 'node2', data: { modelFqn: 'cloud.backend' as Fqn } },
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('returns node when modelFqn matches', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: 'cloud.frontend' as Fqn } },
      { id: 'node2', data: { modelFqn: 'cloud.api' as Fqn } },
      { id: 'node3', data: { modelFqn: 'cloud.backend' as Fqn } },
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toEqual({ id: 'node2', data: { modelFqn: 'cloud.api' as Fqn } })
  })

  it('returns first matching node when multiple nodes have same modelFqn', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: 'cloud.api' as Fqn } },
      { id: 'node2', data: { modelFqn: 'cloud.api' as Fqn } },
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toEqual({ id: 'node1', data: { modelFqn: 'cloud.api' as Fqn } })
  })

  it('returns null when node has null modelFqn', () => {
    const xynodes = [
      { id: 'node1', data: { modelFqn: null } },
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('returns null when node has no modelFqn property', () => {
    const xynodes = [
      { id: 'node1', data: {} },
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toBeNull()
  })

  it('handles nodes with mixed data shapes', () => {
    const xynodes = [
      { id: 'node1', data: {} }, // no modelFqn
      { id: 'node2', data: { modelFqn: null } }, // null modelFqn
      { id: 'node3', data: { modelFqn: 'cloud.frontend' as Fqn } }, // different FQN
      { id: 'node4', data: { modelFqn: 'cloud.api' as Fqn } }, // matching FQN
    ]
    const result = findNodeByModelFqn(xynodes, 'cloud.api' as Fqn)
    expect(result).toEqual({ id: 'node4', data: { modelFqn: 'cloud.api' as Fqn } })
  })
})

describe('findCorrespondingNode', () => {
  // Partial stubs: findCorrespondingNode only reads `id`/`type`/`data.modelFqn` off a
  // node, `id` off a view, and `view`/`anchor` off a scene — satisfying the full
  // Types.Node / DiagramView / AnyStoryView shapes here would be noise unrelated to
  // what's under test.
  const mkNode = (id: string, type: Types.Node['type'], modelFqn: string | null): Types.Node =>
    ({ id, type, data: { modelFqn: modelFqn ? (modelFqn as Fqn) : null } }) as unknown as Types.Node

  const mkView = (id: string): DiagramView => ({ id: scalar.ViewId(id) }) as unknown as DiagramView

  const mkStory = (scenes: ReadonlyArray<{ view: string; anchor?: string }>): AnyStoryView =>
    ({
      scenes: scenes.map(s => ({
        view: scalar.ViewId(s.view),
        ...(s.anchor ? { anchor: s.anchor as Fqn } : {}),
      })),
    }) as unknown as AnyStoryView

  it('returns null/null when neither lastOnNavigate nor a story anchor is present', () => {
    const context = { lastOnNavigate: null, xynodes: [], story: null, view: mkView('view:a') }
    const event = { view: mkView('view:b'), xynodes: [] }
    expect(findCorrespondingNode(context, event)).toEqual({ fromNode: null, toNode: null })
  })

  it('resolves via the incoming scene anchor when lastOnNavigate is absent', () => {
    const fromNode = mkNode('n1', 'element', 'cloud.api')
    const toNode = mkNode('n2', 'element', 'cloud.api')
    const context = {
      lastOnNavigate: null,
      xynodes: [fromNode],
      story: mkStory([{ view: 'view:a' }, { view: 'view:b', anchor: 'cloud.api' }]),
      view: mkView('view:a'),
    }
    const event = { view: mkView('view:b'), xynodes: [toNode] }
    expect(findCorrespondingNode(context, event)).toEqual({ fromNode, toNode })
  })

  it('returns null/null when the anchor FQN is not found in the outgoing node list', () => {
    const toNode = mkNode('n2', 'element', 'cloud.api')
    const context = {
      lastOnNavigate: null,
      xynodes: [], // anchor's element isn't actually rendered in the outgoing view
      story: mkStory([{ view: 'view:a' }, { view: 'view:b', anchor: 'cloud.api' }]),
      view: mkView('view:a'),
    }
    const event = { view: mkView('view:b'), xynodes: [toNode] }
    expect(findCorrespondingNode(context, event)).toEqual({ fromNode: null, toNode: null })
  })

  it('returns fromNode with toNode null when the anchor FQN is not found in the incoming node list', () => {
    const fromNode = mkNode('n1', 'element', 'cloud.api')
    const context = {
      lastOnNavigate: null,
      xynodes: [fromNode],
      story: mkStory([{ view: 'view:a' }, { view: 'view:b', anchor: 'cloud.api' }]),
      view: mkView('view:a'),
    }
    const event = { view: mkView('view:b'), xynodes: [] } // anchor's element isn't rendered in the incoming view
    expect(findCorrespondingNode(context, event)).toEqual({ fromNode, toNode: null })
  })

  it('prefers lastOnNavigate over the story anchor when both resolve, even to different elements', () => {
    const navFromNode = mkNode('nav-from', 'element', 'cloud.frontend')
    const navToNode = mkNode('nav-to', 'element', 'cloud.frontend')
    const anchorFromNode = mkNode('anchor-from', 'element', 'cloud.api')
    const anchorToNode = mkNode('anchor-to', 'element', 'cloud.api')
    const context = {
      lastOnNavigate: {
        fromView: scalar.ViewId('view:a'),
        toView: scalar.ViewId('view:b'),
        fromNode: scalar.NodeId('nav-from'),
      },
      xynodes: [navFromNode, anchorFromNode],
      story: mkStory([{ view: 'view:a' }, { view: 'view:b', anchor: 'cloud.api' }]),
      view: mkView('view:a'),
    }
    const event = { view: mkView('view:b'), xynodes: [navToNode, anchorToNode] }
    expect(findCorrespondingNode(context, event)).toEqual({ fromNode: navFromNode, toNode: navToNode })
  })

  it('falls back to the story anchor when lastOnNavigate does not resolve to a real node', () => {
    const anchorFromNode = mkNode('anchor-from', 'element', 'cloud.api')
    const anchorToNode = mkNode('anchor-to', 'element', 'cloud.api')
    const context = {
      // lastOnNavigate points at a node id that no longer exists in xynodes
      lastOnNavigate: {
        fromView: scalar.ViewId('view:a'),
        toView: scalar.ViewId('view:b'),
        fromNode: scalar.NodeId('stale-node'),
      },
      xynodes: [anchorFromNode],
      story: mkStory([{ view: 'view:a' }, { view: 'view:b', anchor: 'cloud.api' }]),
      view: mkView('view:a'),
    }
    const event = { view: mkView('view:b'), xynodes: [anchorToNode] }
    expect(findCorrespondingNode(context, event)).toEqual({ fromNode: anchorFromNode, toNode: anchorToNode })
  })

  it('does not apply the anchor when the outgoing view was not part of the same story', () => {
    const fromNode = mkNode('n1', 'element', 'cloud.api')
    const toNode = mkNode('n2', 'element', 'cloud.api')
    const context = {
      lastOnNavigate: null,
      xynodes: [fromNode],
      // 'view:outside' is not one of this story's scenes — e.g. deep-linking into a
      // mid-story scene from an unrelated view that happens to render the same element
      story: mkStory([{ view: 'view:b', anchor: 'cloud.api' }]),
      view: mkView('view:outside'),
    }
    const event = { view: mkView('view:b'), xynodes: [toNode] }
    expect(findCorrespondingNode(context, event)).toEqual({ fromNode: null, toNode: null })
  })

  it('degrades gracefully when the incoming scene renders as a sequence-mode seq-actor node', () => {
    const fromNode = mkNode('n1', 'element', 'cloud.api')
    const seqActorToNode = mkNode('seq1', 'seq-actor', 'cloud.api')
    const context = {
      lastOnNavigate: null,
      xynodes: [fromNode],
      story: mkStory([{ view: 'view:a' }, { view: 'view:b', anchor: 'cloud.api' }]),
      view: mkView('view:a'),
    }
    const event = { view: mkView('view:b'), xynodes: [seqActorToNode] }
    // seq-actor nodes are excluded from the anchor lookup: their position is a
    // lifeline-header slot, not a comparable free-form layout position, so this
    // falls through to fromNode-with-null-toNode — same as "not found in the
    // incoming list" — and the caller's ordinary fit-to-bounds path applies.
    expect(findCorrespondingNode(context, event)).toEqual({ fromNode, toNode: null })
  })

  it('degrades gracefully when the outgoing side is itself a sequence-mode seq-actor node', () => {
    const seqActorFromNode = mkNode('seq0', 'seq-actor', 'cloud.api')
    const toNode = mkNode('n2', 'element', 'cloud.api')
    const context = {
      lastOnNavigate: null,
      xynodes: [seqActorFromNode],
      story: mkStory([{ view: 'view:a' }, { view: 'view:b', anchor: 'cloud.api' }]),
      view: mkView('view:a'),
    }
    const event = { view: mkView('view:b'), xynodes: [toNode] }
    expect(findCorrespondingNode(context, event)).toEqual({ fromNode: null, toNode: null })
  })

  it('fails safe (no anchor pan) when the incoming view id appears twice in the story with different anchors', () => {
    // Same view referenced from two different `alt` branches (e.g. examples/cloud-system/story.c4):
    // one occurrence declares an anchor, the other (or a differing one) declares a different
    // anchor. `story.scenes` is keyed by view id, not by which occurrence is actually being
    // entered, so this can't be resolved confidently — it must degrade to the ordinary
    // fit-to-bounds path (fromNode: null, toNode: null), not silently pick the first match.
    const fromNode = mkNode('n1', 'element', 'cloud.api')
    const toNode = mkNode('n2', 'element', 'cloud.api')
    const context = {
      lastOnNavigate: null,
      xynodes: [fromNode],
      story: mkStory([
        { view: 'view:a' },
        { view: 'view:b', anchor: 'cloud.api' },
        { view: 'view:b' }, // same view id, no anchor — disagrees with the occurrence above
      ]),
      view: mkView('view:a'),
    }
    const event = { view: mkView('view:b'), xynodes: [toNode] }
    expect(findCorrespondingNode(context, event)).toEqual({ fromNode: null, toNode: null })
  })

  it('still resolves the anchor when the incoming view id appears twice but all occurrences agree', () => {
    // Repeated view id is not by itself disqualifying — only disagreement about the anchor is.
    // Every occurrence declaring the same anchor (or all being anchor-less) must resolve exactly
    // as if the view id were unique, so this isn't overly conservative.
    const fromNode = mkNode('n1', 'element', 'cloud.api')
    const toNode = mkNode('n2', 'element', 'cloud.api')
    const context = {
      lastOnNavigate: null,
      xynodes: [fromNode],
      story: mkStory([
        { view: 'view:a' },
        { view: 'view:b', anchor: 'cloud.api' },
        { view: 'view:b', anchor: 'cloud.api' }, // same view id, same anchor — agrees
      ]),
      view: mkView('view:a'),
    }
    const event = { view: mkView('view:b'), xynodes: [toNode] }
    expect(findCorrespondingNode(context, event)).toEqual({ fromNode, toNode })
  })
})
