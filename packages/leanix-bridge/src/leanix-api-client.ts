/**
 * Low-level LeanIX GraphQL API client.
 * Handles authentication (Bearer token), request throttling, and errors.
 */

export interface LeanixApiClientConfig {
  /** LeanIX API token (required for auth). */
  apiToken: string
  /**
   * Base URL for the LeanIX API (e.g. https://app.leanix.net or https://<workspace>.leanix.net).
   * Default: https://app.leanix.net
   */
  baseUrl?: string
  /**
   * Delay in ms between consecutive GraphQL requests (rate limiting).
   * Default: 200
   */
  requestDelayMs?: number
}

const DEFAULT_BASE_URL = 'https://app.leanix.net'
const DEFAULT_DELAY_MS = 200

/** Result of a GraphQL request (data or errors). */
export interface GraphQLResponse<T = unknown> {
  data?: T
  errors?: Array<{ message: string; path?: string[]; extensions?: Record<string, unknown> }>
}

/** Thrown when the LeanIX API returns errors or non-OK HTTP. */
export class LeanixApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly graphqlErrors?: GraphQLResponse['errors'],
  ) {
    super(message)
    this.name = 'LeanixApiError'
  }
}

/** Last request timestamp for throttling. */
let lastRequestTime = 0

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * LeanIX GraphQL API client with Bearer auth and optional rate limiting.
 */
export class LeanixApiClient {
  private readonly baseUrl: string
  private readonly apiToken: string
  private readonly requestDelayMs: number

  constructor(config: LeanixApiClientConfig) {
    this.apiToken = config.apiToken
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    this.requestDelayMs = config.requestDelayMs ?? DEFAULT_DELAY_MS
  }

  /**
   * Execute a GraphQL operation (query or mutation).
   * Throttles requests by requestDelayMs. Throws LeanixApiError on HTTP or GraphQL errors.
   */
  async graphql<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const now = Date.now()
    const elapsed = now - lastRequestTime
    if (elapsed < this.requestDelayMs) {
      await sleep(this.requestDelayMs - elapsed)
    }
    lastRequestTime = Date.now()

    const url = `${this.baseUrl}/services/pathfinder/v1/graphql`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({ query, variables }),
    })

    const body = (await res.json()) as GraphQLResponse<T>

    if (!res.ok) {
      throw new LeanixApiError(
        body.errors?.[0]?.message ?? `HTTP ${res.status} ${res.statusText}`,
        res.status,
        body.errors,
      )
    }

    if (body.errors && body.errors.length > 0) {
      const msg = body.errors.map(e => e.message).join('; ')
      throw new LeanixApiError(msg, res.status, body.errors)
    }

    if (body.data === undefined) {
      throw new LeanixApiError('GraphQL response had no data and no errors')
    }

    return body.data as T
  }
}
