/**
 * Line of a line diff, or a run of unchanged lines collapsed by `collapseUnchanged`
 */
export type LineChange =
  | { type: 'same' | 'added' | 'removed'; line: string }
  | { type: 'skipped'; count: number }

// Above this size (lines before × lines after of the changed middle part) all lines are reported as replaced
const MaxTableSize = 4_000_000

/**
 * Line-based diff of two texts (longest common subsequence).
 */
export function diffLines(before: string, after: string): LineChange[] {
  const a = before.split('\n')
  const b = after.split('\n')

  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) {
    start++
  }
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }
  const midA = a.slice(start, endA)
  const midB = b.slice(start, endB)
  const n = midA.length
  const m = midB.length

  const result: LineChange[] = a.slice(0, start).map(line => ({ type: 'same', line }))
  if (n * m > MaxTableSize) {
    result.push(
      ...midA.map(line => ({ type: 'removed' as const, line })),
      ...midB.map(line => ({ type: 'added' as const, line })),
    )
  } else {
    // table[i * (m + 1) + j]: length of the common subsequence of midA[i..] and midB[j..]
    const table = new Int32Array((n + 1) * (m + 1))
    const at = (i: number, j: number) => table[i * (m + 1) + j] ?? 0
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        table[i * (m + 1) + j] = midA[i] === midB[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1))
      }
    }
    let i = 0
    let j = 0
    while (i < n && j < m) {
      if (midA[i] === midB[j]) {
        result.push({ type: 'same', line: midA[i++]! })
        j++
      } else if (at(i + 1, j) >= at(i, j + 1)) {
        result.push({ type: 'removed', line: midA[i++]! })
      } else {
        result.push({ type: 'added', line: midB[j++]! })
      }
    }
    while (i < n) {
      result.push({ type: 'removed', line: midA[i++]! })
    }
    while (j < m) {
      result.push({ type: 'added', line: midB[j++]! })
    }
  }
  result.push(...a.slice(endA).map(line => ({ type: 'same' as const, line })))
  return result
}

/**
 * Replaces runs of unchanged lines with `skipped`, keeping `context` lines around changes.
 */
export function collapseUnchanged(changes: ReadonlyArray<LineChange>, context = 2): LineChange[] {
  const isChange = (c: LineChange) => c.type === 'added' || c.type === 'removed'
  const keep = changes.map((_, index) =>
    changes.slice(Math.max(0, index - context), index + context + 1).some(isChange)
  )
  const result: LineChange[] = []
  let skipped = 0
  changes.forEach((change, index) => {
    if (keep[index]) {
      if (skipped > 0) {
        result.push({ type: 'skipped', count: skipped })
        skipped = 0
      }
      result.push(change)
    } else {
      skipped++
    }
  })
  if (skipped > 0) {
    result.push({ type: 'skipped', count: skipped })
  }
  return result
}
