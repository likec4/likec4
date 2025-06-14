import { describe, expect, it } from 'vitest'
import { markdownToText } from './to-text'

describe('markdownToText', () => {
  it('should convert empty string to empty string', () => {
    expect(markdownToText('')).toBe('')
  })

  it.each([
    ['This is plain text', 'This is plain text'],
    [' ', ''],
    [' Trim spaces   ', 'Trim spaces'],
    [' Dont trim spaces     inside   ', 'Dont trim spaces     inside'],
    [' Trim spaces \n', 'Trim spaces'],
    ['\n\n Trim spaces \n \n', 'Trim spaces'],
  ])('should return plain text as is', (text, expected) => {
    expect(markdownToText(text)).toBe(expected)
  })

  it('should convert headings to plain text', () => {
    expect(markdownToText('# Heading 1')).toBe('Heading 1')
    expect(markdownToText('## Heading 2')).toBe('Heading 2')
    expect(markdownToText('### Heading 3')).toBe('Heading 3')
  })

  it('should convert emphasis to plain text', () => {
    expect(markdownToText('*italic*')).toBe('italic')
    expect(markdownToText('_italic_')).toBe('italic')
    expect(markdownToText('**bold**')).toBe('bold')
    expect(markdownToText('__bold__')).toBe('bold')
    expect(markdownToText('***bold italic***')).toBe('bold italic')
  })

  it('should convert links to plain text', () => {
    expect(markdownToText('[link text](https://example.com)')).toBe('link text')
    expect(markdownToText('Visit [example](https://example.com) for more info')).toBe(
      'Visit example for more info',
    )
  })

  it('should convert images to empty string by default', () => {
    expect(markdownToText('![alt text](image.png)')).toBe('')
    expect(markdownToText('Text before ![alt](img.jpg) text after')).toBe('Text before  text after')
  })

  it('should convert lists to plain text', () => {
    const markdown = `
- Item 1
- Item 2
  - Nested item
- Item 3
`
    // The function doesn't add spaces between list items
    expect(markdownToText(markdown).trim()).toBe('Item 1Item 2Nested itemItem 3')
  })

  it('should convert code blocks to plain text', () => {
    const markdown = '```\nconst x = 1;\nconsole.log(x);\n```'
    // The function preserves the original line breaks in code blocks
    expect(markdownToText(markdown).trim()).toBe('const x = 1;\nconsole.log(x);')
  })

  it('should convert inline code to plain text', () => {
    expect(markdownToText('This is `code` in text')).toBe('This is code in text')
  })

  it('should handle mixed markdown content', () => {
    const markdown = `
# Title

This is a **bold** statement with [a link](https://example.com).

- List item 1
- List item 2 with *emphasis*

\`\`\`
code block
\`\`\`
`

    // The function doesn't add spaces around elements and preserves line breaks
    const result = markdownToText(markdown).replace(/\s+/g, ' ').trim()
    expect(result).toContain('Title')
    expect(result).toContain('This is a bold statement with a link')
    expect(result).toContain('List item 1')
    expect(result).toContain('List item 2 with emphasis')
    expect(result).toContain('code block')
  })

  it('should handle special characters correctly', () => {
    const text = 'Text with special chars: !@#$%^&*()_+{}[]|:;\'",<.>/?`~'
    // The function preserves special characters as-is
    expect(markdownToText(text)).toBe(text)
  })
})
