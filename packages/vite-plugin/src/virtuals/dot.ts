// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { CompositeGeneratorNode, expandToNode, joinToNode, NL, toString } from 'langium/generate'
import { mapToObj } from 'remeda'
import { logGenerating } from '../logger'
import { type ProjectVirtualModule, generateCombinedProjects, generateMatches } from './_shared'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'

function code(
  sources: Record<
    string,
    {
      dot: string
      svg: string
    }
  >,
) {
  const out = new CompositeGeneratorNode()

  out.appendTemplate`
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    /* eslint-disable */

    export let dotSource = (viewId) => {
      switch (viewId) {
  `
    .appendNewLine()
    .indent({
      indentation: 4,
      indentedChildren(indented) {
        indented.append(
          joinToNode(
            Object.keys(sources),
            key =>
              expandToNode`
              case ${JSON.stringify(key)}: {
                return ${JSON.stringify(sources[key]!.dot)}
              }
            `,
            {
              appendNewLineIfNotEmpty: true,
            },
          ),
        ).appendTemplate`
          default: {
            throw new Error('Unknown viewId: ' + viewId)
          }
        `
      },
    })
    .append(NL, '  }', NL).appendTemplate`
    }

    export let svgSource = (viewId) => {
      switch (viewId) {
    `
    .appendNewLine()
    .indent({
      indentation: 4,
      indentedChildren(indented) {
        indented.append(
          joinToNode(
            Object.keys(sources),
            key =>
              expandToNode`
              case ${hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(key))}: {
                return ${hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(sources[key]!.svg))}
              }
            `,
            {
              appendNewLineIfNotEmpty: true,
            },
          ),
        ).appendTemplate`
          default: {
            throw new Error('Unknown viewId: ' + viewId)
          }
        `
      },
    })
    .append(NL, '  }', NL, '}', NL, NL)
  return toString(out)
}

export const projectDotSourcesModule: ProjectVirtualModule = {
  exportFormat: 'dot',
  ...generateMatches('dot'),
  async load({ likec4, project }) {
    logGenerating('dot', project.id)
    const views = await likec4.views.viewsAsGraphvizOut(project.id)
    const sources = mapToObj(views, ({ id, svg, dot }) => [id, { dot, svg }])
    return {
      code: code(sources),
      moduleType: 'js',
    }
  },
}

export const dotModule = generateCombinedProjects('dot', 'loadDotSources', 'dot')
