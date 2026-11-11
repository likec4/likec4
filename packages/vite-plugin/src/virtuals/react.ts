import { first } from 'remeda'
import { logGenerating } from '../logger'
import { type ProjectVirtualModule, type VirtualModule, generateMatches } from './_shared'

/**
 * With the customization file configured, the project provider also applies its UI overrides
 */
const modelProviderCode = (customized: boolean) =>
  customized
    ? `
import { CustomizationProvider } from 'likec4/react';
import { useCustomComponents } from 'likec4:customization'

export function LikeC4ModelProvider({ children }) {
  const likec4model = useLikeC4Model()
  const components = useCustomComponents()
  return (jsx(CustomizationProvider, { components, children: jsx(Provider, { likec4model, children }) }));
}`
    : `
export function LikeC4ModelProvider({ children }) {
  const likec4model = useLikeC4Model()
  return (jsx(Provider, { likec4model, children }));
}`

export const generateProjectReactCode = (id: string, customized: boolean): string => `
import { jsx } from "react/jsx-runtime";
import { LikeC4ModelProvider as Provider, LikeC4View as GenericView, ReactLikeC4 as GenericReactLikeC4 } from 'likec4/react';
import { IconRenderer as renderIcon } from 'likec4:icons/${id}'
import { useLikeC4Model } from 'likec4:model/${id}'
${modelProviderCode(customized)}
export function LikeC4View(props) {
  return (jsx(LikeC4ModelProvider, { children: jsx(GenericView, { renderIcon, ...props }) }));
}
export function ReactLikeC4(props) {
  return (jsx(LikeC4ModelProvider, { children: jsx(GenericReactLikeC4, { renderIcon, ...props }) }));
}

export { IconRenderer } from 'likec4:icons/${id}'

export {
  useLikeC4Model, 
  useLikeC4Views, 
  useLikeC4View, 
  $likec4model,
  $likec4data,
  isLikeC4ViewId
} from 'likec4:model/${id}'
`

export const projectReactModule: ProjectVirtualModule = {
  ...generateMatches('react'),
  async load({ project, customizationFile }) {
    logGenerating('react', project.id)
    return {
      code: generateProjectReactCode(project.id, !!customizationFile),
      moduleType: 'js',
    }
  },
}

export const singleProjectReactModule: VirtualModule = {
  id: 'likec4:react',
  virtualId: 'likec4:plugin/react.js',
  async load({ projects }) {
    const project = first(projects)
    logGenerating('react-default-project')
    const code = `export {
  $likec4data,
  $likec4model,
  useLikeC4Model,
  useLikeC4View,
  useLikeC4Views,
  isLikeC4ViewId,
  IconRenderer,
  LikeC4ModelProvider,
  LikeC4View,
  ReactLikeC4,
} from 'likec4:react/${project.id}'`
    return {
      code,
      moduleType: 'js',
    }
  },
}
