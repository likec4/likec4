/**
 * Coalesces `markdown.preview.refresh` calls so refreshes only fire when an open
 * Markdown preview exists and references an affected project.
 */
export interface RefreshHost {
  documentsReferencing(projectKeys: ReadonlyArray<string>): string[]
  hasOpenPreview(): boolean
  isDocumentOpen(docUri: string): boolean
  refresh(reason: string): void
}

export class RefreshScheduler {
  private timer: ReturnType<typeof setTimeout> | undefined
  private readonly keys = new Set<string>()
  private reasons: string[] = []

  constructor(
    private readonly host: RefreshHost,
    private readonly delayMs = 5,
  ) {}

  projectsChanged(projectKeys: ReadonlyArray<string>, reason: string): void {
    for (const key of projectKeys) {
      this.keys.add(key)
    }
    this.reasons.push(reason)
    this.schedule()
  }

  refreshAll(reason: string): void {
    this.keys.add('*')
    this.reasons.push(reason)
    this.schedule()
  }

  flush(): void {
    clearTimeout(this.timer)
    this.timer = undefined
    const keys = [...this.keys]
    const reasons = this.reasons
    this.keys.clear()
    this.reasons = []

    if (keys.length === 0 || !this.host.hasOpenPreview()) {
      return
    }
    if (!keys.includes('*')) {
      const openReferenced = this.host.documentsReferencing(keys).filter((doc) => this.host.isDocumentOpen(doc))
      if (openReferenced.length === 0) {
        return
      }
    }
    this.host.refresh([...new Set(reasons)].join('; '))
  }

  dispose(): void {
    clearTimeout(this.timer)
    this.timer = undefined
  }

  private schedule(): void {
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush()
      }, this.delayMs)
    }
  }
}
