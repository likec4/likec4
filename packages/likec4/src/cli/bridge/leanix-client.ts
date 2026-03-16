/**
 * LeanIX API client from environment (LEANIX_API_TOKEN, LEANIX_BASE_URL).
 * Shared by sync leanix and gen leanix-inventory-snapshot.
 */

import { LeanixApiClient } from '@likec4/leanix-bridge'

const LEANIX_BASE_URL_DEFAULT = 'https://app.leanix.net'
const LEANIX_REQUEST_DELAY_MS = 200

export function createLeanixClientFromEnv(): LeanixApiClient | null {
  const apiToken = process.env['LEANIX_API_TOKEN']
  if (!apiToken) return null
  return new LeanixApiClient({
    apiToken,
    baseUrl: process.env['LEANIX_BASE_URL'] ?? LEANIX_BASE_URL_DEFAULT,
    requestDelayMs: LEANIX_REQUEST_DELAY_MS,
  })
}

/**
 * Returns a LeanIX client or throws if LEANIX_API_TOKEN is not set.
 */
export function requireLeanixClient(): LeanixApiClient {
  const client = createLeanixClientFromEnv()
  if (!client) {
    throw new Error(
      'LEANIX_API_TOKEN is required. Set it in the environment to call the LeanIX API.',
    )
  }
  return client
}
