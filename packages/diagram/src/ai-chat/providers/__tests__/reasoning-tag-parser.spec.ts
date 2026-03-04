// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, expect, it } from 'vitest'
import { findOpenTag, ReasoningTagParser } from '../reasoning-tag-parser'

function createParser() {
  const content: string[] = []
  const reasoning: string[] = []
  const parser = new ReasoningTagParser({
    onContent: (t) => content.push(t),
    onReasoning: (t) => reasoning.push(t),
  })
  return { parser, content, reasoning }
}

function parse(input: string | string[]): { content: string; reasoning: string } {
  const { parser, content, reasoning } = createParser()
  const tokens = Array.isArray(input) ? input : [input]
  for (const token of tokens) {
    parser.process(token)
  }
  parser.flush()
  return { content: content.join(''), reasoning: reasoning.join('') }
}

describe('findOpenTag', () => {
  it('finds <think> tag', () => {
    const result = findOpenTag('Hello <think>world')
    expect(result).toEqual({ index: 6, tag: '<think>', closeTag: '</think>' })
  })

  it('finds <thinking> tag', () => {
    const result = findOpenTag('<thinking>reasoning here')
    expect(result).toEqual({ index: 0, tag: '<thinking>', closeTag: '</thinking>' })
  })

  it('finds <|begin_of_thought|> tag', () => {
    const result = findOpenTag('prefix<|begin_of_thought|>content')
    expect(result).toEqual({ index: 6, tag: '<|begin_of_thought|>', closeTag: '<|end_of_thought|>' })
  })

  it('returns earliest match when multiple tags present', () => {
    const result = findOpenTag('<thinking>first<think>second')
    expect(result).toEqual({ index: 0, tag: '<thinking>', closeTag: '</thinking>' })
  })

  it('returns null when no tag found', () => {
    expect(findOpenTag('no tags here')).toBeNull()
  })
})

describe('ReasoningTagParser', () => {
  describe('basic tag parsing', () => {
    it('passes plain content through', () => {
      const result = parse('Hello world')
      expect(result.content).toBe('Hello world')
      expect(result.reasoning).toBe('')
    })

    it('extracts <think> reasoning', () => {
      const result = parse('<think>reasoning here</think>actual content')
      expect(result.reasoning).toBe('reasoning here')
      expect(result.content).toBe('actual content')
    })

    it('extracts <thinking> reasoning', () => {
      const result = parse('<thinking>deep thought</thinking>answer')
      expect(result.reasoning).toBe('deep thought')
      expect(result.content).toBe('answer')
    })

    it('extracts <reason> reasoning', () => {
      const result = parse('<reason>my reason</reason>result')
      expect(result.reasoning).toBe('my reason')
      expect(result.content).toBe('result')
    })

    it('extracts <reasoning> reasoning', () => {
      const result = parse('<reasoning>analysis</reasoning>conclusion')
      expect(result.reasoning).toBe('analysis')
      expect(result.content).toBe('conclusion')
    })

    it('extracts <thought> reasoning', () => {
      const result = parse('<thought>hmm</thought>answer')
      expect(result.reasoning).toBe('hmm')
      expect(result.content).toBe('answer')
    })

    it('extracts <|begin_of_thought|> reasoning', () => {
      const result = parse('<|begin_of_thought|>thinking<|end_of_thought|>done')
      expect(result.reasoning).toBe('thinking')
      expect(result.content).toBe('done')
    })
  })

  describe('content before and after reasoning', () => {
    it('handles content before reasoning tag', () => {
      const result = parse('prefix <think>reasoning</think> suffix')
      expect(result.content).toBe('prefix  suffix')
      expect(result.reasoning).toBe('reasoning')
    })

    it('handles only reasoning with no content after', () => {
      const result = parse('<think>just reasoning</think>')
      expect(result.reasoning).toBe('just reasoning')
      expect(result.content).toBe('')
    })
  })

  describe('streaming (chunked) input', () => {
    it('handles tag split across chunks', () => {
      const result = parse(['<thi', 'nk>reasoning</think>content'])
      expect(result.reasoning).toBe('reasoning')
      expect(result.content).toBe('content')
    })

    it('handles close tag split across chunks', () => {
      const result = parse(['<think>reasoning</thi', 'nk>content'])
      expect(result.reasoning).toBe('reasoning')
      expect(result.content).toBe('content')
    })

    it('handles single-character chunks', () => {
      const input = '<think>hi</think>ok'
      const result = parse(input.split(''))
      expect(result.reasoning).toBe('hi')
      expect(result.content).toBe('ok')
    })

    it('handles content streamed in small chunks', () => {
      const result = parse(['Hello', ' ', 'world', ' - no tags'])
      expect(result.content).toBe('Hello world - no tags')
      expect(result.reasoning).toBe('')
    })

    it('handles reasoning content in small chunks', () => {
      const result = parse(['<think>', 'rea', 'son', 'ing', '</think>', 'done'])
      expect(result.reasoning).toBe('reasoning')
      expect(result.content).toBe('done')
    })
  })

  describe('edge cases', () => {
    it('handles empty input', () => {
      const result = parse('')
      expect(result.content).toBe('')
      expect(result.reasoning).toBe('')
    })

    it('handles unclosed tag (flushes as reasoning)', () => {
      const result = parse('<think>unclosed reasoning')
      expect(result.reasoning).toBe('unclosed reasoning')
      expect(result.content).toBe('')
    })

    it('handles multiple reasoning blocks', () => {
      const result = parse('<think>first</think>middle<think>second</think>end')
      expect(result.reasoning).toBe('firstsecond')
      expect(result.content).toBe('middleend')
    })

    it('handles long content without tags', () => {
      const longText = 'a'.repeat(1000)
      const result = parse(longText)
      expect(result.content).toBe(longText)
      expect(result.reasoning).toBe('')
    })

    it('handles long reasoning content', () => {
      const longReasoning = 'r'.repeat(1000)
      const result = parse(`<think>${longReasoning}</think>done`)
      expect(result.reasoning).toBe(longReasoning)
      expect(result.content).toBe('done')
    })

    it('does not confuse angle brackets in normal content', () => {
      const result = parse('use x < 5 and y > 3')
      expect(result.content).toBe('use x < 5 and y > 3')
      expect(result.reasoning).toBe('')
    })
  })

  describe('callback invocations', () => {
    it('calls onContent for each flushed content chunk', () => {
      const { parser, content } = createParser()
      parser.process('Hello world - this is long enough to flush')
      parser.flush()
      expect(content.length).toBeGreaterThanOrEqual(1)
      expect(content.join('')).toBe('Hello world - this is long enough to flush')
    })

    it('calls onReasoning for reasoning tokens', () => {
      const { parser, reasoning } = createParser()
      parser.process('<think>this is reasoning content that should flush</think>')
      parser.flush()
      expect(reasoning.length).toBeGreaterThanOrEqual(1)
      expect(reasoning.join('')).toBe('this is reasoning content that should flush')
    })
  })
})
