import { first } from 'remeda'
import { type ProjectVirtualModule, type VirtualModule, generateMatches, k } from './_shared'

const projectCode = (id: string) => `
import { jsx as _jsx } from "react/jsx-runtime";
import { LikeC4ModelProvider as Provider, LikeC4View as GenericView, ReactLikeC4 as GenericReactLikeC4 } from 'likec4/react';
import { IconRenderer } from 'likec4:icons/${id}'

import { useLikeC4Model, useLikeC4Views, useLikeC4View } from 'likec4:model/${id}'

export function LikeC4ModelProvider({ children }) {
  const likeC4Model = useLikeC4Model()
  return (_jsx(Provider, { likec4model: likeC4Model, children: children }));
}
export function LikeC4View(props) {
  return (_jsx(LikeC4ModelProvider, { children: _jsx(GenericView, { renderIcon: IconRenderer, ...props }) }));
}
export function ReactLikeC4(props) {
  return (_jsx(LikeC4ModelProvider, { children: _jsx(GenericReactLikeC4, { renderIcon: IconRenderer, ...props }) }));
}

export {
  useLikeC4Model,
  useLikeC4View,
  useLikeC4Views
}
`

export const projectReactModule = {
  ...generateMatches('react'),
  async load({ projectId, logger }) {
    logger.info(k.dim(`generating likec4:react/${projectId}`))
    return projectCode(projectId)
  },
} satisfies ProjectVirtualModule

export const singleProjectReactModule = {
  id: 'likec4:react',
  virtualId: 'likec4:plugin/react.js',
  async load({ logger, projects }) {
    const project = first(projects)
    logger.info(k.dim('generating likec4:react for') + ' ' + project.id)
    return projectCode(project.id)
  },
} satisfies VirtualModule
