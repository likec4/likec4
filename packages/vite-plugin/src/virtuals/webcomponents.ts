import type { ProjectId } from '@likec4/core/types'
import { logGenerating } from '../logger'
import { type ProjectVirtualModule, generateMatches } from './_shared'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'

const jsStringLiteral = (value: string) => hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(value))

export const generateWebcomponentsCode = (projectId: ProjectId): string => {
  const projectIdLiteral = jsStringLiteral(projectId)
  const reactModuleLiteral = jsStringLiteral(`likec4:react/${projectId}`)

  return `
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { LikeC4View } from ${reactModuleLiteral}

const projectId = ${projectIdLiteral}
const projectIdSymbol = Symbol.for('likec4.webcomponent.projectId')

function booleanAttribute(element, name, fallback) {
  const value = element.getAttribute(name)
  return value === null ? fallback : value.toLowerCase() !== 'false'
}

function enumAttribute(element, name, values) {
  const value = element.getAttribute(name)
  return value !== null && values.includes(value) ? value : undefined
}

function propsFrom(element) {
  const props = {
    viewId: element.getAttribute('view-id') ?? 'index',
    browser: booleanAttribute(element, 'browser', true),
  }
  const dynamicViewVariant = enumAttribute(element, 'dynamic-variant', ['diagram', 'sequence'])
  const colorScheme = enumAttribute(element, 'color-scheme', ['light', 'dark'])
  if (dynamicViewVariant) {
    props.dynamicViewVariant = dynamicViewVariant
  }
  if (colorScheme) {
    props.colorScheme = colorScheme
  }
  return props
}

function createLikeC4ViewElement() {
  return class LikeC4ViewElement extends HTMLElement {
    static observedAttributes = ['view-id', 'browser', 'dynamic-variant', 'color-scheme']

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
      this.root.render(createElement(LikeC4View, propsFrom(this)))
    }
  }
}

export function defineWebcomponent(name) {
  const existing = customElements.get(name)
  if (existing) {
    if (existing[projectIdSymbol] === projectId) {
      return existing
    }
    throw new Error('Custom element "' + name + '" is already defined')
  }

  const LikeC4ViewElement = createLikeC4ViewElement()
  Object.defineProperty(LikeC4ViewElement, projectIdSymbol, { value: projectId })
  customElements.define(name, LikeC4ViewElement)
  return LikeC4ViewElement
}
`
}

export const projectWebcomponentsModule: ProjectVirtualModule = {
  ...generateMatches('webcomponents'),
  async load({ project }) {
    logGenerating('webcomponents', project.id)
    return {
      code: generateWebcomponentsCode(project.id),
      moduleType: 'js',
    }
  },
}
