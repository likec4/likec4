import { type VirtualModule, k } from './_shared'

const code = () => `
import { jsx as _jsx } from "react/jsx-runtime";
import { LikeC4ModelProvider as Provider, LikeC4View as GenericLikeC4View, ReactLikeC4 as GenericReactLikeC4 } from 'likec4/react';
import { IconRenderer, useLikeC4Model, useLikeC4View } from 'virtual:likec4/single-project';

export function LikeC4ModelProvider({ children }) {
  const likeC4Model = useLikeC4Model()
  return (_jsx(Provider, { likec4model: likeC4Model, children: children }));
}
export function LikeC4View(props) {
  return (_jsx(GenericLikeC4View, { renderIcon: IconRenderer, ...props }));
}
export function ReactLikeC4(props) {
  return (_jsx(GenericReactLikeC4, { renderIcon: IconRenderer, ...props }));
}

export {
  useLikeC4Model,
  useLikeC4View,
}
`

export const reactModule = {
  id: 'virtual:likec4/react',
  virtualId: '\0likec4-plugin/react.js',
  async load({ likec4, logger, projects, assetsDir }) {
    logger.info(k.dim('generating virtual:likec4/react'))
    return code()
  },
} satisfies VirtualModule
