import type { ProjectId } from '@likec4/core'
import { type Root, createRoot } from 'react-dom/client'
import { jsx } from 'react/jsx-runtime'
import type { LikeC4ViewProps } from '../LikeC4View'

type LikeC4ElementProps = {
  viewId: string
  browser: boolean
  dynamicViewVariant?: 'diagram' | 'sequence'
  colorScheme?: 'light' | 'dark'
}

const ObservedAttributes = ['view-id', 'browser', 'dynamic-variant', 'color-scheme'] as const

type AttributeName = (typeof ObservedAttributes)[number]

function readProps(element: HTMLElement): LikeC4ElementProps {
  function booleanAttribute(name: AttributeName, fallback: boolean) {
    const value = element.getAttribute(name)
    return value === null ? fallback : value.toLowerCase() !== 'false'
  }

  function enumAttribute<const V extends string[]>(
    name: AttributeName,
    values: V,
  ): V[number] | undefined {
    const value = element.getAttribute(name)
    return value !== null && values.includes(value as V[number]) ? value as V[number] : undefined
  }

  const props: LikeC4ElementProps = {
    viewId: element.getAttribute('view-id') ?? 'index',
    browser: booleanAttribute('browser', true),
  }
  const dynamicViewVariant = enumAttribute('dynamic-variant', ['diagram', 'sequence'])
  const colorScheme = enumAttribute('color-scheme', ['light', 'dark'])
  if (dynamicViewVariant) {
    props.dynamicViewVariant = dynamicViewVariant
  }
  if (colorScheme) {
    props.colorScheme = colorScheme
  }
  return props
}

type LikeC4ViewComponent = (props: LikeC4ViewProps) => React.ReactElement

/**
 * The class is created on demand: this module is also imported where `HTMLElement` does not exist (SSR, node).
 */
function createLikeC4ViewElement(component: LikeC4ViewComponent) {
  return class LikeC4ViewElement extends HTMLElement {
    static observedAttributes = ObservedAttributes

    readonly shadow: ShadowRoot
    readonly mount: HTMLDivElement
    root: Root | undefined

    constructor() {
      super()
      this.shadow = this.attachShadow({ mode: 'open', delegatesFocus: true })
      const style = document.createElement('style')
      style.textContent = ':host { display: contents; background-color: transparent; margin: 0; padding: 0; }'
      this.mount = document.createElement('div')
      this.mount.style.display = 'contents'
      this.shadow.append(style, this.mount)
    }

    connectedCallback() {
      this.root ??= createRoot(this.mount)
      this.render()
    }

    disconnectedCallback() {
      this.root?.unmount()
      this.root = undefined
    }

    attributeChangedCallback() {
      if (this.root) {
        this.render()
      }
    }

    render() {
      if (!this.root) {
        return
      }
      this.root.render(
        jsx(component, readProps(this)),
      )
    }
  }
}

const projectIdSymbol = Symbol.for('likec4.webcomponent.projectId')

/**
 * Defines a custom element for a LikeC4 view component.
 * Used by the LikeC4 Vite plugin.
 *
 * @internal
 */
export function defineLikeC4Webcomponent(
  name: string,
  viewComponent: LikeC4ViewComponent,
  projectId: ProjectId,
) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('name must be a non-empty string')
  }
  const existing = customElements.get(name)
  if (existing) {
    const existingProjectId = (existing as any)[projectIdSymbol]
    if (existingProjectId === projectId) {
      return existing
    }
    throw new Error('Custom element "' + name + '" is already defined')
  }

  const ViewElement = createLikeC4ViewElement(viewComponent)

  Object.defineProperty(ViewElement, projectIdSymbol, {
    enumerable: false,
    writable: false,
    value: projectId,
  })
  customElements.define(name, ViewElement)
  return ViewElement
}
