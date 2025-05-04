import { type ProjectId, imap, toArray } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import type { LikeC4LanguageServices } from '../LikeC4LanguageServices'

export function elementResource(
  languageServices: LikeC4LanguageServices,
  el: LikeC4Model.Element,
  projectId?: ProjectId,
) {
  return {
    id: el.id,
    parent: !el.parent ? null : {
      id: el.parent.id,
      title: el.parent.title,
      kind: el.parent.kind,
    },
    projectId,
    title: el.title,
    kind: el.kind,
    shape: el.shape,
    technology: el.technology,
    description: el.description,
    tags: el.tags,
    children: toArray(imap(el.children(), c => ({
      id: c.id,
      title: c.title,
      kind: el.kind,
    }))),
    relations: {
      incoming: toArray(imap(el.incoming(), r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        technology: r.technology,
        source: {
          id: r.source.id,
          title: r.source.title,
          kind: r.source.kind,
        },
        ...(r.target.id === el.id
          ? {
            type: 'direct',
          }
          : {
            type: 'implicit, to nested',
            target: {
              id: r.target.id,
              title: r.target.title,
              kind: r.target.kind,
            },
          }),
      }))),
      outgoing: toArray(imap(el.outgoing(), r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        technology: r.technology,
        target: {
          id: r.target.id,
          title: r.target.title,
          kind: r.target.kind,
        },
        ...(r.source.id === el.id
          ? {
            type: 'direct',
          }
          : {
            type: 'implicit, from nested',
            source: {
              id: r.source.id,
              title: r.source.title,
              kind: r.source.kind,
            },
          }),
      }))),
    },
    views: toArray(imap(el.views(), v => ({
      id: v.id,
      title: v.title,
    }))),
    sourceFile: languageServices.locate({
      element: el.id,
      projectId,
    }),
  }
}

export function modelViewResource(
  languageServices: LikeC4LanguageServices,
  view: LikeC4Model.View,
  projectId?: ProjectId,
) {
  return {
    id: view.id,
    title: view.title,
    projectId,
    viewType: view.__,
    description: view.$view.description ?? '',
    tags: view.tags,
    nodes: toArray(imap(view.nodes(), node => ({
      id: node.id,
      title: node.title,
      represents: node.element
        ? {
          element: node.element.id,
        }
        : {},
    }))),
    sourceFile: languageServices.locate({
      view: view.id,
      projectId,
    }),
    // edges: toArray(imap(view.edges(), edge => ({
    //   id: edge.id,
    //   title: edge.title,
    // }))),
    // elements: toArray(imap(view.elements(), el => ({
    //   id: el.id,
    //   title: el.title,
    // }))),
  }
}
