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

  it('should remove HTML comments', () => {
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
      `
      "<table>
      <thead>
      <tr>
      <th>Header 1</th>
      <th>Header 2</th>
      </tr>
      </thead>
      <tbody>
      <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
      </tr>
      <tr>
      <td>Cell 3</td>
      <td>Cell 4</td>
      </tr>
      </tbody>
      </table>"
    `,
    )
  })

  it('should convert NOTE alert to HTML', () => {
    const markdown = `
> [!NOTE]
> This is a note.
`
    expect(markdownToHtml(markdown)).toMatchInlineSnapshot(
      `
      "<div class="markdown-alert markdown-alert-note" dir="auto">
      <p class="markdown-alert-title" dir="auto"><svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>NOTE</p>
      <p>This is a note.</p>
      </div>"
    `,
    )
  })

  it('should convert TIP alert to HTML', () => {
    const markdown = `
> [!TIP]
> This is a tip.
`
    expect(markdownToHtml(markdown)).toMatchInlineSnapshot(
      `
      "<div class="markdown-alert markdown-alert-tip" dir="auto">
      <p class="markdown-alert-title" dir="auto"><svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>TIP</p>
      <p>This is a tip.</p>
      </div>"
    `,
    )
  })

  it('should convert IMPORTANT alert to HTML', () => {
    const markdown = `
> [!IMPORTANT]
> This is important.
`
    expect(markdownToHtml(markdown)).toMatchInlineSnapshot(
      `
      "<div class="markdown-alert markdown-alert-important" dir="auto">
      <p class="markdown-alert-title" dir="auto"><svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>IMPORTANT</p>
      <p>This is important.</p>
      </div>"
    `,
    )
  })

  it('should convert WARNING alert to HTML', () => {
    const markdown = `
> [!WARNING]
> This is a warning.
`
    expect(markdownToHtml(markdown)).toMatchInlineSnapshot(
      `
      "<div class="markdown-alert markdown-alert-warning" dir="auto">
      <p class="markdown-alert-title" dir="auto"><svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>WARNING</p>
      <p>This is a warning.</p>
      </div>"
    `,
    )
  })

  it('should convert CAUTION alert to HTML', () => {
    const markdown = `
> [!CAUTION]
> This is a caution.
`
    expect(markdownToHtml(markdown)).toMatchInlineSnapshot(
      `
      "<div class="markdown-alert markdown-alert-caution" dir="auto">
      <p class="markdown-alert-title" dir="auto"><svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>CAUTION</p>
      <p>This is a caution.</p>
      </div>"
    `,
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
      "<div class="markdown-alert markdown-alert-warning" dir="auto">
      <p class="markdown-alert-title" dir="auto"><svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>WARNING</p>
      <p>This is a warning.
      With a second line.</p>
      </div>"
    `)
  })
})
