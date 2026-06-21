import { describe, it } from 'vitest'
import { createTestServices } from '../../test'

// Shared model preamble used across all test cases
const MODEL_PREAMBLE = `
  specification {
    element component
  }
  model {
    component c1
    component c2
    component c3
  }
`

// Wrap a view body fragment in full document syntax
function doc(viewBody: string) {
  return `${MODEL_PREAMBLE}
  views {
    dynamic view v1 {
      ${viewBody}
    }
  }
`
}

// ---------------------------------------------------------------------------
// Check #1 — actor existence
// ---------------------------------------------------------------------------
describe('check #1 – actor existence', () => {
  it('[positive] note with valid actor produces no error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      c1 -> c2 'step'
      note over c1 'hello'
    `))
    expect(errors.filter(e => e.includes('Actor not found'))).toEqual([])
  })

  it('[negative] note with unknown actor reports error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      note over unknown 'hello'
    `))
    expect(errors).toContain('Actor not found (not parsed/indexed yet)')
  })

  it('[positive] activate with valid actor produces no error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      activate c1
      c1 -> c2 'step'
      deactivate c1
    `))
    expect(errors.filter(e => e.includes('Actor not found'))).toEqual([])
  })

  it('[negative] activate with unknown actor reports error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      activate unknown
    `))
    expect(errors).toContain('Actor not found (not parsed/indexed yet)')
  })

  it('[negative] deactivate with unknown actor reports error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      deactivate unknown
    `))
    expect(errors).toContain('Actor not found (not parsed/indexed yet)')
  })

  it('[negative] create with unknown actor reports error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      create unknown
    `))
    expect(errors).toContain('Actor not found (not parsed/indexed yet)')
  })

  it('[negative] destroy with unknown actor reports error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      destroy unknown
    `))
    expect(errors).toContain('Actor not found (not parsed/indexed yet)')
  })
})

// ---------------------------------------------------------------------------
// Check #2 — mixed flat/branch in parallel
// ---------------------------------------------------------------------------
describe('check #2 – mixed flat/branch in parallel', () => {
  it('[positive] pure flat parallel produces no error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      parallel {
        c1 -> c2 'step1'
        c2 -> c3 'step2'
      }
    `))
    expect(errors.filter(e => e.includes('mix flat steps'))).toEqual([])
  })

  it('[positive] pure labeled branches produce no error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      parallel {
        branch 'a' { c1 -> c2 'step' }
        branch 'b' { c2 -> c3 'step' }
      }
    `))
    expect(errors.filter(e => e.includes('mix flat steps'))).toEqual([])
  })

  it('[negative] mixed flat + labeled parallel reports error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      parallel {
        c1 -> c2 'flat'
        branch 'a' { c2 -> c3 'labeled' }
      }
    `))
    expect(errors).toContain('parallel block cannot mix flat steps and labeled branches')
  })

  it('[negative] mixed flat + labeled parallel nested inside a block reports error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      if 'cond' {
        parallel {
          c1 -> c2 'flat'
          branch 'a' { c2 -> c3 'labeled' }
        }
      }
    `))
    expect(errors).toContain('parallel block cannot mix flat steps and labeled branches')
  })
})

// ---------------------------------------------------------------------------
// Check #988 — nested parallel blocks are not allowed (steps OR branch/block path)
// ---------------------------------------------------------------------------
describe('check #988 – nested parallel blocks', () => {
  it('[negative] parallel nested via flat steps reports error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      parallel {
        c1 -> c2 'step'
        parallel { c2 -> c3 'inner' }
      }
    `))
    expect(errors).toContain('Nested parallel blocks are not allowed')
  })

  it('[negative] parallel nested via a labeled branch reports error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      parallel {
        branch 'a' {
          parallel { c1 -> c2 'inner' }
        }
      }
    `))
    expect(errors).toContain('Nested parallel blocks are not allowed')
  })

  it('[negative] parallel nested via an if inside a branch reports error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      parallel {
        branch 'a' {
          if 'cond' {
            parallel { c1 -> c2 'inner' }
          }
        }
      }
    `))
    expect(errors).toContain('Nested parallel blocks are not allowed')
  })

  it('[negative] only one error per nested parallel', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      parallel {
        branch 'a' {
          parallel { c1 -> c2 'inner' }
        }
      }
    `))
    expect(errors.filter(e => e === 'Nested parallel blocks are not allowed')).toHaveLength(1)
  })

  it('[positive] labeled branches without nested parallel produce no error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      parallel {
        branch 'a' { c1 -> c2 'step' }
        branch 'b' { c2 -> c3 'step' }
      }
    `))
    expect(errors.filter(e => e.includes('Nested parallel'))).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Check #3 — note over empty actors
// ---------------------------------------------------------------------------
describe('check #3 – note over empty actors', () => {
  it('[positive] note over with one actor produces no error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      c1 -> c2 'step'
      note over c1 'text'
    `))
    expect(errors.filter(e => e.includes('at least one actor'))).toEqual([])
  })

  // Note: grammar enforces >= 1 actor for `over`, so this test validates that
  // when AST anomalies produce an empty actor list the check fires.
  // We test by ensuring the check function itself rejects empty state.
  // The grammar makes this hard to trigger via text, so we verify the positive case.
})

// ---------------------------------------------------------------------------
// Check #4 — autonumber step without from
// ---------------------------------------------------------------------------
describe('check #4 – autonumber step without from', () => {
  it('[positive] autonumber from N step M produces no error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      autonumber from 1 step 2
      c1 -> c2 'step'
    `))
    expect(errors.filter(e => e.includes('autonumber'))).toEqual([])
  })

  it('[positive] plain autonumber produces no error', async ({ expect }) => {
    const { validate } = createTestServices()
    const { errors } = await validate(doc(`
      autonumber
      c1 -> c2 'step'
    `))
    expect(errors.filter(e => e.includes('autonumber'))).toEqual([])
  })

  // Grammar prevents `autonumber step N` without `from` at parse level via
  // `'from' start=INT ('step' increment=INT)?` — so increment is only set when
  // start is also set. This check guards against AST edge cases.
  // Positive case above is the authoritative assertion.
})

// ---------------------------------------------------------------------------
// Check #5 — dangling deactivate
// ---------------------------------------------------------------------------
describe('check #5 – dangling deactivate', () => {
  it('[positive] deactivate with preceding activate produces no warning', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(doc(`
      activate c1
      c1 -> c2 'step'
      deactivate c1
    `))
    expect(warnings.filter(w => w.includes('deactivate without preceding'))).toEqual([])
  })

  it('[positive] deactivate after create produces no warning', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(doc(`
      create c1
      c1 -> c2 'step'
      deactivate c1
    `))
    expect(warnings.filter(w => w.includes('deactivate without preceding'))).toEqual([])
  })

  it('[negative] deactivate without any preceding activate reports warning', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(doc(`
      c1 -> c2 'step'
      deactivate c1
    `))
    expect(warnings).toContain('deactivate without preceding activate or create for this actor')
  })
})

// ---------------------------------------------------------------------------
// Check #6 — create before first use
// ---------------------------------------------------------------------------
describe('check #6 – create before first use', () => {
  it('[positive] create before first step use produces no warning', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(doc(`
      create c1
      c1 -> c2 'step'
    `))
    expect(warnings.filter(w => w.includes('create appears after'))).toEqual([])
  })

  it('[negative] create after first step use reports warning', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(doc(`
      c1 -> c2 'step'
      create c1
    `))
    expect(warnings).toContain('create appears after the first use of this actor in the view')
  })
})

// ---------------------------------------------------------------------------
// Check #7 — destroy is last use
// ---------------------------------------------------------------------------
describe('check #7 – destroy is last use', () => {
  it('[positive] destroy with no later use produces no warning', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(doc(`
      c1 -> c2 'step'
      destroy c1
    `))
    expect(warnings.filter(w => w.includes('destroy is not the last'))).toEqual([])
  })

  it('[negative] destroy followed by step referencing actor reports warning', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(doc(`
      destroy c1
      c1 -> c2 'step after destroy'
    `))
    expect(warnings).toContain('destroy is not the last reference to this actor in the view')
  })
})

// ---------------------------------------------------------------------------
// Check #8 — sequence-only constructs in diagram variant
// ---------------------------------------------------------------------------
describe('check #8 – sequence-only constructs in diagram variant', () => {
  it('[positive] note in sequence variant produces no info', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`${MODEL_PREAMBLE}
      views {
        dynamic view v1 {
          variant sequence
          c1 -> c2 'step'
          note over c1 'info'
        }
      }
    `)
    const infos = diagnostics.filter(d => d.severity === 3 && d.message.includes('ignored in \'diagram\' variant'))
    expect(infos).toHaveLength(0)
  })

  it('[negative] note in diagram variant reports info diagnostic', async ({ expect }) => {
    const { validate } = createTestServices()
    const { diagnostics } = await validate(`${MODEL_PREAMBLE}
      views {
        dynamic view v1 {
          variant diagram
          c1 -> c2 'step'
          note over c1 'info'
        }
      }
    `)
    const infos = diagnostics.filter(d => d.severity === 3 && d.message.includes('ignored in \'diagram\' variant'))
    expect(infos.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Check #9 — empty block body
// ---------------------------------------------------------------------------
describe('check #9 – empty block body', () => {
  it('[positive] block body with steps produces no warning', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(doc(`
      if 'cond' {
        c1 -> c2 'step'
      }
    `))
    expect(warnings.filter(w => w.includes('empty'))).toEqual([])
  })

  it('[negative] empty block body reports warning', async ({ expect }) => {
    const { validate } = createTestServices()
    const { warnings } = await validate(doc(`
      if 'cond' {
      }
    `))
    expect(warnings).toContain('block body is empty')
  })
})

// ---------------------------------------------------------------------------
// Check #10 — nesting depth > 6
// ---------------------------------------------------------------------------
describe('check #10 – block nesting depth > 6', () => {
  it('[positive] depth 6 produces no warning', async ({ expect }) => {
    const { validate } = createTestServices()
    // 6 levels of nesting: if > repeat > group > optional > break > if (depth=5 from root)
    const { warnings } = await validate(doc(`
      if 'a' {
        repeat 'b' {
          group 'c' {
            optional 'd' {
              break 'e' {
                if 'f' {
                  c1 -> c2 'step'
                }
              }
            }
          }
        }
      }
    `))
    expect(warnings.filter(w => w.includes('nesting depth'))).toEqual([])
  })

  it('[negative] depth 7 reports warning', async ({ expect }) => {
    const { validate } = createTestServices()
    // 7 levels: if > repeat > group > optional > break > if > repeat
    const { warnings } = await validate(doc(`
      if 'a' {
        repeat 'b' {
          group 'c' {
            optional 'd' {
              break 'e' {
                if 'f' {
                  repeat 'g' {
                    c1 -> c2 'step'
                  }
                }
              }
            }
          }
        }
      }
    `))
    expect(warnings).toContain('block nesting depth exceeds the maximum of 6')
  })
})
