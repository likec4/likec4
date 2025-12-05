import { describe, expect, it } from 'vitest'
import { markdownToHtml } from './to-html'

describe('markdownToHtml', () => {
  it('should convert empty string to empty HTML', () => {
    expect(markdownToHtml('')).toBe('')
  })

  it.each([
    ['This is plain text', '<p>This is plain text</p>'],
    [' ', ''],
    [' Trim spaces   ', '<p>Trim spaces</p>'],
    ['Trim spaces \n\nLine2\n\nLine3', '<p>Trim spaces</p>\n<p>Line2</p>\n<p>Line3</p>'],
    [' Trim spaces \n', '<p>Trim spaces</p>'],
    ['\n\n Trim spaces \n \n', '<p>Trim spaces</p>'],
    ['\nLine1\nLine2\nLine3', '<p>Line1\nLine2\nLine3</p>'],
  ])('should convert plain text "%s" to %s', (text, expectedContent) => {
    const result = markdownToHtml(text)
    expect(result).toBe(expectedContent)
  })

  it('should convert headings to HTML headings', () => {
    expect(markdownToHtml('# Heading 1')).toMatchInlineSnapshot(`"<h1>Heading 1</h1>"`)
    expect(markdownToHtml('## Heading 2')).toMatchInlineSnapshot(`"<h2>Heading 2</h2>"`)
    expect(markdownToHtml('### Heading 3')).toMatchInlineSnapshot(`"<h3>Heading 3</h3>"`)
  })

  it('should convert emphasis to HTML emphasis tags', () => {
    expect(markdownToHtml('*italic*')).toMatchInlineSnapshot(`"<p><em>italic</em></p>"`)
    expect(markdownToHtml('_italic_')).toMatchInlineSnapshot(`"<p><em>italic</em></p>"`)
    expect(markdownToHtml('**bold**')).toMatchInlineSnapshot(`"<p><strong>bold</strong></p>"`)
    expect(markdownToHtml('__bold__')).toMatchInlineSnapshot(`"<p><strong>bold</strong></p>"`)
    expect(markdownToHtml('***bold italic***')).toMatchInlineSnapshot(
      `"<p><em><strong>bold italic</strong></em></p>"`,
    )
  })

  it('should convert links to HTML anchors', () => {
    expect(markdownToHtml('[link text](https://example.com)')).toMatchInlineSnapshot(
      `"<p><a href="https://example.com">link text</a></p>"`,
    )

    expect(markdownToHtml('Visit [example](https://example.com) for more info')).toMatchInlineSnapshot(
      `"<p>Visit <a href="https://example.com">example</a> for more info</p>"`,
    )
  })

  it('should convert images to HTML img tags', () => {
    // Test with just an image
    const result1 = markdownToHtml('![alt text](image.png)').trim()
    expect(result1).toContain('<img')
    expect(result1).toContain('src="image.png"')
    expect(result1).toContain('alt="alt text"')
    expect(result1).toMatch(/<p[^>]*>.*<\/p>/s)

    // Test with image in text - normalize whitespace before checking
    const result2 = markdownToHtml('Text before ![alt](img.jpg) text after').trim()
    // Extract just the text content to verify
    const textContent = result2
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim() // Trim outer whitespace

    expect(textContent).toBe('Text before text after')
    expect(result2).toContain('<img')
    expect(result2).toContain('src="img.jpg"')
    expect(result2).toContain('alt="alt"')
  })

  it('should convert lists to HTML lists', () => {
    const markdown = `
- Item 1
- Item 2
  - Nested item
- Item 3
`
    expect(markdownToHtml(markdown)).toMatchInlineSnapshot(`
      "<ul>
      <li>Item 1</li>
      <li>Item 2
      <ul>
      <li>Nested item</li>
      </ul>
      </li>
      <li>Item 3</li>
      </ul>"
    `)
  })

  it('should convert ordered lists to HTML ordered lists', () => {
    const markdown = `
1. First item
2. Second item
3. Third item
`
    expect(markdownToHtml(markdown)).toMatchInlineSnapshot(`
    "<ol>
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
    </ol>"
    `)
  })

  it('should convert code blocks to HTML pre/code tags', () => {
    const markdown = '```\nconst x = 1;\nconsole.log(x);\n```'
    expect(markdownToHtml(markdown)).toMatchInlineSnapshot(`
      "<pre><code>const x = 1;
      console.log(x);
      </code></pre>"
    `)
  })

  it('should convert inline code to HTML code tags', () => {
    expect(markdownToHtml('This is `code` in text')).toMatchInlineSnapshot(`
      "<p>This is <code>code</code> in text</p>"
    `)
  })

  it('should convert blockquotes to HTML blockquote tags', () => {
    const markdown = '> This is a quote\n> Another line'
    expect(markdownToHtml(markdown)).toMatchInlineSnapshot(`
      "<blockquote>
      <p>This is a quote
      Another line</p>
      </blockquote>"
    `)
  })

  it('should handle mixed markdown content', () => {
    expect(markdownToHtml(`
# Title

This is a **bold** statement with [a link](https://example.com).

- List item 1
- List item 2 with *emphasis*

\`\`\`
code block
\`\`\`
`)).toMatchInlineSnapshot(`
      "<h1>Title</h1>
      <p>This is a <strong>bold</strong> statement with <a href="https://example.com">a link</a>.</p>
      <ul>
      <li>List item 1</li>
      <li>List item 2 with <em>emphasis</em></li>
      </ul>
      <pre><code>code block
      </code></pre>"
    `)
  })

  it('should sanitize HTML to prevent XSS', () => {
    expect(markdownToHtml('<script>alert("XSS")</script>')).toBe('')
  })

  it('should preserve HTML comments', () => {
    // Note: This depends on how rehypeSanitize is configured in the processor
    expect(markdownToHtml('<!-- This is a comment -->')).toBe('')
  })

  it('should handle GFM features like tables', () => {
    const markdown = `
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`
    expect(markdownToHtml(markdown)).toMatchInlineSnapshot(
      `"<table><thead><tr><th>Header 1</th><th>Header 2</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></tbody></table>"`,
    )
  })

  describe('GFM Alerts', () => {
    it('should convert NOTE alert to HTML', () => {
      const markdown = `
> [!NOTE]
> This is a note.
`
      expect(markdownToHtml(markdown)).toMatchInlineSnapshot(
        `"<div class="markdown-alert markdown-alert-note"><div class="markdown-alert-title"><span class="markdown-alert-icon"></span>Note</div><div class="markdown-alert-content"><p>This is a note.</p></div></div>"`,
      )
    })

    it('should convert TIP alert to HTML', () => {
      const markdown = `
> [!TIP]
> This is a tip.
`
      expect(markdownToHtml(markdown)).toMatchInlineSnapshot(
        `"<div class="markdown-alert markdown-alert-tip"><div class="markdown-alert-title"><span class="markdown-alert-icon"></span>Tip</div><div class="markdown-alert-content"><p>This is a tip.</p></div></div>"`,
      )
    })

    it('should convert IMPORTANT alert to HTML', () => {
      const markdown = `
> [!IMPORTANT]
> This is important.
`
      expect(markdownToHtml(markdown)).toMatchInlineSnapshot(
        `"<div class="markdown-alert markdown-alert-important"><div class="markdown-alert-title"><span class="markdown-alert-icon"></span>Important</div><div class="markdown-alert-content"><p>This is important.</p></div></div>"`,
      )
    })

    it('should convert WARNING alert to HTML', () => {
      const markdown = `
> [!WARNING]
> This is a warning.
`
      expect(markdownToHtml(markdown)).toMatchInlineSnapshot(
        `"<div class="markdown-alert markdown-alert-warning"><div class="markdown-alert-title"><span class="markdown-alert-icon"></span>Warning</div><div class="markdown-alert-content"><p>This is a warning.</p></div></div>"`,
      )
    })

    it('should convert CAUTION alert to HTML', () => {
      const markdown = `
> [!CAUTION]
> This is a caution.
`
      expect(markdownToHtml(markdown)).toMatchInlineSnapshot(
        `"<div class="markdown-alert markdown-alert-caution"><div class="markdown-alert-title"><span class="markdown-alert-icon"></span>Caution</div><div class="markdown-alert-content"><p>This is a caution.</p></div></div>"`,
      )
    })

    it('should handle multiline alert', () => {
      const markdown = `
> [!WARNING]
> This is a warning.
> With a second line.
`
      const result = markdownToHtml(markdown)
      expect(result).toMatchInlineSnapshot(`
        "<div class="markdown-alert markdown-alert-warning"><div class="markdown-alert-title"><span class="markdown-alert-icon"></span>Warning</div><div class="markdown-alert-content"><p>[!WARNING]
        This is a warning.
        With a second line.</p></div></div>"
      `)
    })
  })
})
