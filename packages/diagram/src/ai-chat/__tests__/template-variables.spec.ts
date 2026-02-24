// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { type TemplateVariables, interpolateTemplate } from '../context-builder'

const fullVars: TemplateVariables = {
  title: 'Cloud Customer',
  kind: 'service',
  technology: 'Node.js',
  parent: 'Cloud System',
  tags: 'critical, public-facing',
  view: 'Landscape',
  dependencies: 'Backend API, Amazon SQS',
  dependents: 'API Gateway, Load Balancer',
  context: '# Element: Cloud Customer\n...',
}

const sparseVars: TemplateVariables = {
  title: 'Simple Element',
  kind: 'component',
  technology: '',
  parent: '',
  tags: '',
  view: 'Overview',
  dependencies: '',
  dependents: '',
  context: '# Element: Simple Element',
}

describe('interpolateTemplate', () => {
  describe('basic interpolation', () => {
    it('replaces {title}', () => {
      const result = interpolateTemplate('What does {title} do?', fullVars, { hideIfEmpty: false })
      expect(result).toBe('What does Cloud Customer do?')
    })

    it('replaces multiple variables', () => {
      const result = interpolateTemplate(
        'Is {technology} the right choice for {title}?',
        fullVars,
        { hideIfEmpty: false },
      )
      expect(result).toBe('Is Node.js the right choice for Cloud Customer?')
    })

    it('replaces all supported variables', () => {
      const result = interpolateTemplate(
        '{title} ({kind}) uses {technology}, parent: {parent}, tags: {tags}, view: {view}, deps: {dependencies}, consumers: {dependents}',
        fullVars,
        { hideIfEmpty: false },
      )
      expect(result).toBe(
        'Cloud Customer (service) uses Node.js, parent: Cloud System, tags: critical, public-facing, view: Landscape, deps: Backend API, Amazon SQS, consumers: API Gateway, Load Balancer',
      )
    })

    it('replaces {context} in system prompts', () => {
      const result = interpolateTemplate('Context:\n{context}', fullVars, { hideIfEmpty: false })
      expect(result).toBe('Context:\n# Element: Cloud Customer\n...')
    })

    it('leaves unknown variables as-is', () => {
      const result = interpolateTemplate('{title} has {unknown}', fullVars, { hideIfEmpty: false })
      expect(result).toBe('Cloud Customer has {unknown}')
    })

    it('replaces same variable multiple times', () => {
      const result = interpolateTemplate('{title} and {title}', fullVars, { hideIfEmpty: false })
      expect(result).toBe('Cloud Customer and Cloud Customer')
    })
  })

  describe('hideIfEmpty: true (suggested questions)', () => {
    it('returns string when all variables are resolved', () => {
      const result = interpolateTemplate('What does {title} do?', fullVars, { hideIfEmpty: true })
      expect(result).toBe('What does Cloud Customer do?')
    })

    it('returns null when a variable is empty', () => {
      const result = interpolateTemplate(
        'Is {technology} the right choice?',
        sparseVars,
        { hideIfEmpty: true },
      )
      expect(result).toBeNull()
    })

    it('returns string for variables that are set in sparse vars', () => {
      const result = interpolateTemplate(
        'What does {title} do in {view}?',
        sparseVars,
        { hideIfEmpty: true },
      )
      expect(result).toBe('What does Simple Element do in Overview?')
    })

    it('returns null when dependencies are empty', () => {
      const result = interpolateTemplate(
        'What are the risks of {title} depending on {dependencies}?',
        sparseVars,
        { hideIfEmpty: true },
      )
      expect(result).toBeNull()
    })
  })

  describe('hideIfEmpty: false (system prompts)', () => {
    it('returns string with empty values replaced', () => {
      const result = interpolateTemplate(
        'Element {title} uses {technology}',
        sparseVars,
        { hideIfEmpty: false },
      )
      expect(result).toBe('Element Simple Element uses ')
    })

    it('never returns null', () => {
      const result = interpolateTemplate(
        '{technology} {parent} {tags} {dependencies} {dependents}',
        sparseVars,
        { hideIfEmpty: false },
      )
      expect(result).toBe('    ')
    })
  })
})
