import { invariant } from '@likec4/core'
import { describe, expect, it } from 'vitest'
import { createTestServices } from '../../test'

// ---------------------------------------------------------------------------
// Shared DSL preamble — elements A, B, C, D are available in all tests
// ---------------------------------------------------------------------------
function source(viewBody: string) {
  return `
  specification {
    element element
  }
  model {
    element A
    element B
    element C
    element D
  }
  views {
    dynamic view index {
      ${viewBody}
    }
  }
`
}

async function parseView(viewBody: string) {
  const { validate, services } = createTestServices()
  const { document } = await validate(source(viewBody))
  const { c4Views } = services.likec4.ModelParser.parse(document)
  expect(c4Views).toHaveLength(1)
  const view = c4Views[0]
  invariant(view?._type === 'dynamic')
  return view
}

// ---------------------------------------------------------------------------
// Block constructs
// ---------------------------------------------------------------------------

describe('LikeC4ModelParser – dynamic view blocks', () => {
  // ── if ──────────────────────────────────────────────────────────────────

  it('parses if block', async ({ expect }) => {
    const view = await parseView(`
      if 'condition' {
        A -> B
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "condition": "condition",
          "elseIfs": [],
          "id": "/steps@0",
          "kind": "if",
          "then": {
            "elements": [
              {
                "astPath": "/steps@0/thenBranch/elements@0",
                "source": "A",
                "target": "B",
              },
            ],
            "id": "/steps@0/thenBranch",
          },
        },
      ]
    `)
  })

  it('parses if-else block', async ({ expect }) => {
    const view = await parseView(`
      if 'cond' {
        A -> B
      } else {
        B -> C
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "condition": "cond",
          "else": {
            "elements": [
              {
                "astPath": "/steps@0/elseBranch/elements@0",
                "source": "B",
                "target": "C",
              },
            ],
            "id": "/steps@0/elseBranch",
          },
          "elseIfs": [],
          "id": "/steps@0",
          "kind": "if",
          "then": {
            "elements": [
              {
                "astPath": "/steps@0/thenBranch/elements@0",
                "source": "A",
                "target": "B",
              },
            ],
            "id": "/steps@0/thenBranch",
          },
        },
      ]
    `)
  })

  it('parses if-elseif-else block', async ({ expect }) => {
    const view = await parseView(`
      if 'c1' {
        A -> B
      } else if 'c2' {
        B -> C
      } else {
        C -> D
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "condition": "c1",
          "else": {
            "elements": [
              {
                "astPath": "/steps@0/elseBranch/elements@0",
                "source": "C",
                "target": "D",
              },
            ],
            "id": "/steps@0/elseBranch",
          },
          "elseIfs": [
            {
              "body": {
                "elements": [
                  {
                    "astPath": "/steps@0/elseIfBranches@0/body/elements@0",
                    "source": "B",
                    "target": "C",
                  },
                ],
                "id": "/steps@0/elseIfBranches@0/body",
              },
              "condition": "c2",
            },
          ],
          "id": "/steps@0",
          "kind": "if",
          "then": {
            "elements": [
              {
                "astPath": "/steps@0/thenBranch/elements@0",
                "source": "A",
                "target": "B",
              },
            ],
            "id": "/steps@0/thenBranch",
          },
        },
      ]
    `)
  })

  // ── optional ─────────────────────────────────────────────────────────────

  it('parses optional block', async ({ expect }) => {
    const view = await parseView(`
      optional 'cond' {
        A -> B
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "body": {
            "elements": [
              {
                "astPath": "/steps@0/body/elements@0",
                "source": "A",
                "target": "B",
              },
            ],
            "id": "/steps@0/body",
          },
          "condition": "cond",
          "id": "/steps@0",
          "kind": "optional",
        },
      ]
    `)
  })

  // ── repeat ───────────────────────────────────────────────────────────────

  it('parses repeat block with label', async ({ expect }) => {
    const view = await parseView(`
      repeat 'lbl' {
        A -> B
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "body": {
            "elements": [
              {
                "astPath": "/steps@0/body/elements@0",
                "source": "A",
                "target": "B",
              },
            ],
            "id": "/steps@0/body",
          },
          "id": "/steps@0",
          "kind": "repeat",
          "label": "lbl",
        },
      ]
    `)
  })

  it('parses repeat block without label', async ({ expect }) => {
    const view = await parseView(`
      repeat {
        A -> B
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "body": {
            "elements": [
              {
                "astPath": "/steps@0/body/elements@0",
                "source": "A",
                "target": "B",
              },
            ],
            "id": "/steps@0/body",
          },
          "id": "/steps@0",
          "kind": "repeat",
        },
      ]
    `)
  })

  // ── parallel with labeled branches ────────────────────────────────────────

  it('parses parallel block with labeled branches', async ({ expect }) => {
    const view = await parseView(`
      parallel {
        branch 'a' {
          A -> B
        }
        branch 'b' {
          C -> D
        }
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "__parallel": [
            {
              "astPath": "/steps@0/branches@0/body/elements@0",
              "source": "A",
              "target": "B",
            },
            {
              "astPath": "/steps@0/branches@1/body/elements@0",
              "source": "C",
              "target": "D",
            },
          ],
          "branches": [
            {
              "elements": [
                {
                  "astPath": "/steps@0/branches@0/body/elements@0",
                  "source": "A",
                  "target": "B",
                },
              ],
              "label": "a",
            },
            {
              "elements": [
                {
                  "astPath": "/steps@0/branches@1/body/elements@0",
                  "source": "C",
                  "target": "D",
                },
              ],
              "label": "b",
            },
          ],
          "parallelId": "/steps@0",
        },
      ]
    `)
  })

  // ── group ────────────────────────────────────────────────────────────────

  it('parses group block', async ({ expect }) => {
    const view = await parseView(`
      group 'lbl' {
        A -> B
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "body": {
            "elements": [
              {
                "astPath": "/steps@0/body/elements@0",
                "source": "A",
                "target": "B",
              },
            ],
            "id": "/steps@0/body",
          },
          "id": "/steps@0",
          "kind": "group",
          "label": "lbl",
        },
      ]
    `)
  })

  // ── critical ─────────────────────────────────────────────────────────────

  it('parses critical block with fallback', async ({ expect }) => {
    const view = await parseView(`
      critical 'lbl' {
        A -> B
      } on 'fb' {
        C -> D
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "body": {
            "elements": [
              {
                "astPath": "/steps@0/body/elements@0",
                "source": "A",
                "target": "B",
              },
            ],
            "id": "/steps@0/body",
          },
          "fallbacks": [
            {
              "body": {
                "elements": [
                  {
                    "astPath": "/steps@0/fallbacks@0/body/elements@0",
                    "source": "C",
                    "target": "D",
                  },
                ],
                "id": "/steps@0/fallbacks@0/body",
              },
              "label": "fb",
            },
          ],
          "id": "/steps@0",
          "kind": "critical",
          "label": "lbl",
        },
      ]
    `)
  })

  // ── break ────────────────────────────────────────────────────────────────

  it('parses break block', async ({ expect }) => {
    const view = await parseView(`
      break 'cond' {
        A -> B
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "body": {
            "elements": [
              {
                "astPath": "/steps@0/body/elements@0",
                "source": "A",
                "target": "B",
              },
            ],
            "id": "/steps@0/body",
          },
          "condition": "cond",
          "id": "/steps@0",
          "kind": "break",
        },
      ]
    `)
  })

  // ── note ──────────────────────────────────────────────────────────────────

  it('parses note over A, B', async ({ expect }) => {
    const view = await parseView(`
      note over A, B 'text'
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "actors": [
            "A",
            "B",
          ],
          "id": "/steps@0",
          "kind": "note",
          "placement": "over",
          "text": "text",
        },
      ]
    `)
  })

  it('parses note left of A', async ({ expect }) => {
    const view = await parseView(`
      note left of A 'left msg'
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "actors": [
            "A",
          ],
          "id": "/steps@0",
          "kind": "note",
          "placement": "left",
          "text": "left msg",
        },
      ]
    `)
  })

  it('parses note right of A', async ({ expect }) => {
    const view = await parseView(`
      note right of A 'right msg'
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "actors": [
            "A",
          ],
          "id": "/steps@0",
          "kind": "note",
          "placement": "right",
          "text": "right msg",
        },
      ]
    `)
  })

  // ── activate / deactivate / create / destroy ──────────────────────────────

  it('parses activate', async ({ expect }) => {
    const view = await parseView(`activate A`)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "actor": "A",
          "id": "/steps@0",
          "kind": "activate",
        },
      ]
    `)
  })

  it('parses deactivate', async ({ expect }) => {
    const view = await parseView(`deactivate A`)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "actor": "A",
          "id": "/steps@0",
          "kind": "deactivate",
        },
      ]
    `)
  })

  it('parses create', async ({ expect }) => {
    const view = await parseView(`create A`)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "actor": "A",
          "id": "/steps@0",
          "kind": "create",
        },
      ]
    `)
  })

  it('parses destroy', async ({ expect }) => {
    const view = await parseView(`destroy A`)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "actor": "A",
          "id": "/steps@0",
          "kind": "destroy",
        },
      ]
    `)
  })

  // ── autonumber ────────────────────────────────────────────────────────────

  it('parses autonumber (bare)', async ({ expect }) => {
    const view = await parseView(`
      autonumber
      A -> B
    `)
    expect(view.autonumber).toMatchInlineSnapshot(`
      {
        "enabled": true,
      }
    `)
  })

  it('parses autonumber true', async ({ expect }) => {
    const view = await parseView(`
      autonumber true
      A -> B
    `)
    expect(view.autonumber).toMatchInlineSnapshot(`
      {
        "enabled": true,
      }
    `)
  })

  it('parses autonumber false', async ({ expect }) => {
    const view = await parseView(`
      autonumber false
      A -> B
    `)
    expect(view.autonumber).toMatchInlineSnapshot(`
      {
        "enabled": false,
      }
    `)
  })

  it('parses autonumber from N step M', async ({ expect }) => {
    const view = await parseView(`
      autonumber from 5 step 2
      A -> B
    `)
    expect(view.autonumber).toMatchInlineSnapshot(`
      {
        "enabled": true,
        "start": 5,
        "step": 2,
      }
    `)
  })

  // ── deeply nested ─────────────────────────────────────────────────────────

  it('parses deeply nested: if > repeat > parallel branches', async ({ expect }) => {
    const view = await parseView(`
      if 'a' {
        repeat 'b' {
          parallel {
            branch 'c' {
              A -> B
            }
            branch 'd' {
              C -> D
            }
          }
        }
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "condition": "a",
          "elseIfs": [],
          "id": "/steps@0",
          "kind": "if",
          "then": {
            "elements": [
              {
                "body": {
                  "elements": [
                    {
                      "__parallel": [
                        {
                          "astPath": "/steps@0/thenBranch/elements@0/body/elements@0/branches@0/body/elements@0",
                          "source": "A",
                          "target": "B",
                        },
                        {
                          "astPath": "/steps@0/thenBranch/elements@0/body/elements@0/branches@1/body/elements@0",
                          "source": "C",
                          "target": "D",
                        },
                      ],
                      "branches": [
                        {
                          "elements": [
                            {
                              "astPath": "/steps@0/thenBranch/elements@0/body/elements@0/branches@0/body/elements@0",
                              "source": "A",
                              "target": "B",
                            },
                          ],
                          "label": "c",
                        },
                        {
                          "elements": [
                            {
                              "astPath": "/steps@0/thenBranch/elements@0/body/elements@0/branches@1/body/elements@0",
                              "source": "C",
                              "target": "D",
                            },
                          ],
                          "label": "d",
                        },
                      ],
                      "parallelId": "/steps@0/thenBranch/elements@0/body/elements@0",
                    },
                  ],
                  "id": "/steps@0/thenBranch/elements@0/body",
                },
                "id": "/steps@0/thenBranch/elements@0",
                "kind": "repeat",
                "label": "b",
              },
            ],
            "id": "/steps@0/thenBranch",
          },
        },
      ]
    `)
  })

  // ── legacy parallel { stepA stepB } — MUST stay byte-identical ───────────

  it('legacy parallel flat steps snapshot unchanged', async ({ expect }) => {
    const view = await parseView(`
      A -> B -> C -> D
      parallel {
        A -> C -> B
        B -> D
        A -> D -> C
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "__series": [
            {
              "astPath": "/steps@0/source/source",
              "source": "A",
              "target": "B",
            },
            {
              "astPath": "/steps@0/source",
              "source": "B",
              "target": "C",
            },
            {
              "astPath": "/steps@0",
              "source": "C",
              "target": "D",
            },
          ],
          "seriesId": "/steps@0",
        },
        {
          "__parallel": [
            {
              "__series": [
                {
                  "astPath": "/steps@1/steps@0/source",
                  "source": "A",
                  "target": "C",
                },
                {
                  "astPath": "/steps@1/steps@0",
                  "source": "C",
                  "target": "B",
                },
              ],
              "seriesId": "/steps@1/steps@0",
            },
            {
              "astPath": "/steps@1/steps@1",
              "source": "B",
              "target": "D",
            },
            {
              "__series": [
                {
                  "astPath": "/steps@1/steps@2/source",
                  "source": "A",
                  "target": "D",
                },
                {
                  "astPath": "/steps@1/steps@2",
                  "source": "D",
                  "target": "C",
                },
              ],
              "seriesId": "/steps@1/steps@2",
            },
          ],
          "parallelId": "/steps@1",
        },
      ]
    `)
  })

  // ── mixed view ────────────────────────────────────────────────────────────

  it('parses mixed view with multiple constructs', async ({ expect }) => {
    const view = await parseView(`
      autonumber
      activate A
      A -> B
      if 'cond' {
        B -> C
      } else {
        B -> D
      }
      note over A, B 'done'
      deactivate A
    `)
    expect(view.autonumber).toMatchInlineSnapshot(`
      {
        "enabled": true,
      }
    `)
    expect(view.steps).toMatchInlineSnapshot(`
      [
        {
          "actor": "A",
          "id": "/steps@0",
          "kind": "activate",
        },
        {
          "astPath": "/steps@1",
          "source": "A",
          "target": "B",
        },
        {
          "condition": "cond",
          "else": {
            "elements": [
              {
                "astPath": "/steps@2/elseBranch/elements@0",
                "source": "B",
                "target": "D",
              },
            ],
            "id": "/steps@2/elseBranch",
          },
          "elseIfs": [],
          "id": "/steps@2",
          "kind": "if",
          "then": {
            "elements": [
              {
                "astPath": "/steps@2/thenBranch/elements@0",
                "source": "B",
                "target": "C",
              },
            ],
            "id": "/steps@2/thenBranch",
          },
        },
        {
          "actors": [
            "A",
            "B",
          ],
          "id": "/steps@3",
          "kind": "note",
          "placement": "over",
          "text": "done",
        },
        {
          "actor": "A",
          "id": "/steps@4",
          "kind": "deactivate",
        },
      ]
    `)
  })
})
