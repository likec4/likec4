/**
 * LeanIX API client from environment (LEANIX_API_TOKEN, LEANIX_BASE_URL).
 * Shared by sync leanix and gen leanix-inventory-snapshot.
 */

import { LeanixApiClient } from '@likec4/leanix-bridge'

const LEANIX_BASE_URL_DEFAULT = 'https://app.leanix.net'
const LEANIX_REQUEST_DELAY_MS = 200

/**
 * Creates a LeanIX API client from LEANIX_API_TOKEN and LEANIX_BASE_URL (optional).
 * Returns null if token is missing or blank (whitespace-only treated as unset).
 *
 * @returns LeanixApiClient or null when LEANIX_API_TOKEN is not set
 */
export function createLeanixClientFromEnv(): LeanixApiClient | null {
  const apiToken = process.env['LEANIX_API_TOKEN']?.trim()
  if (!apiToken) return null
  const baseUrl = process.env['LEANIX_BASE_URL']?.trim() || LEANIX_BASE_URL_DEFAULT
  return new LeanixApiClient({
    apiToken,
    baseUrl,
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
