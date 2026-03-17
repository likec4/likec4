/**
 * LeanIX GraphQL operations used by sync (find, create, patch fact sheets; create relations).
 * Extracted for SRP; sync-to-leanix orchestrates, this module performs API calls.
 */

import type { LeanixApiClient } from './leanix-api-client'
import type { LeanixFactSheetDryRun } from './to-leanix-inventory-dry-run'

/** Search fact sheets by name and type (for idempotency). Returns null when not found; throws on API/network error. */
export async function findFactSheetByNameAndType(
  client: LeanixApiClient,
  name: string,
  type: string,
): Promise<string | null> {
  type AllFactSheetsResult = {
    allFactSheets?: {
      edges?: Array<{
        node?: { id?: string; name?: string; type?: string }
      }>
    }
  }
  const query = `
    query FindFactSheet($name: String!, $type: String!) {
      allFactSheets(filter: { name: $name, factSheetType: $type }) {
        edges { node { id name type } }
      }
    }
  `
  const data = await client.graphql<AllFactSheetsResult>(query, { name, type })
  const edges = data.allFactSheets?.edges ?? []
  const first = edges[0]?.node
  return first?.id ?? null
}

/**
 * Search fact sheets by custom attribute (e.g. likec4Id) for idempotent lookup.
 * Returns null when not found; throws on API/network error.
 */
export async function findFactSheetByLikec4IdAttribute(
  client: LeanixApiClient,
  attributeKey: string,
  likec4Id: string,
): Promise<string | null> {
  type AllFactSheetsResult = {
    allFactSheets?: {
      edges?: Array<{
        node?: { id?: string }
      }>
    }
  }
  type FilterInput = {
    facetFilters?: Array<{ facetKey: string; operator: string; keys: string[] }>
  }
  const query = `
    query FindFactSheetByAttribute($filter: FilterInput!) {
      allFactSheets(filter: $filter) {
        edges { node { id } }
      }
    }
  `
  const filter: FilterInput = {
    facetFilters: [{ facetKey: attributeKey, operator: 'OR', keys: [likec4Id] }],
  }
  const data = await client.graphql<AllFactSheetsResult>(query, { filter })
  const edges = data.allFactSheets?.edges ?? []
  const first = edges[0]?.node
  return first?.id ?? null
}

/** Patch an existing fact sheet to set a custom attribute (e.g. likec4Id). Throws on API error. */
export async function patchFactSheetAttribute(
  client: LeanixApiClient,
  factSheetId: string,
  attributeKey: string,
  value: string,
): Promise<void> {
  type UpdateResult = { updateFactSheet?: { factSheet?: { id: string } } }
  const patches = [{ op: 'replace', path: `/factSheetAttributes/${attributeKey}`, value }]
  const mutation = `
    mutation UpdateFactSheet($id: ID!, $patches: [Patch]) {
      updateFactSheet(id: $id, patches: $patches) {
        factSheet { id }
      }
    }
  `
  const data = await client.graphql<UpdateResult>(mutation, { id: factSheetId, patches })
  if (!data.updateFactSheet?.factSheet?.id) {
    throw new Error(`updateFactSheet did not return fact sheet (id=${factSheetId}, attribute=${attributeKey})`)
  }
}

/** Create fact sheet (name, type, optional description and likec4Id attribute). Returns new id; throws on API error. */
export async function createFactSheet(
  client: LeanixApiClient,
  fs: LeanixFactSheetDryRun,
  likec4IdAttribute: string | undefined,
): Promise<string> {
  type CreateResult = { createFactSheet?: { factSheet?: { id: string } } }
  const patches: Array<{ op: string; path: string; value: string }> = []
  if (fs.description) {
    patches.push({ op: 'replace', path: '/description', value: fs.description })
  }
  if (likec4IdAttribute && fs.likec4Id) {
    patches.push({ op: 'replace', path: `/factSheetAttributes/${likec4IdAttribute}`, value: fs.likec4Id })
  }
  const mutation = `
    mutation CreateFactSheet($input: CreateFactSheetInput!, $patches: [Patch]) {
      createFactSheet(input: $input, patches: $patches) {
        factSheet { id name type rev }
      }
    }
  `
  const input = { name: fs.name, type: fs.type }
  const variables = { input, patches }
  const data = await client.graphql<CreateResult>(mutation, variables)
  const id = data.createFactSheet?.factSheet?.id
  if (!id) throw new Error(`createFactSheet did not return id for ${String(fs.name)}`)
  return id
}

/** Create a relation between two fact sheets. Returns relation id; throws when mutation returns no id. */
export async function createRelation(
  client: LeanixApiClient,
  sourceFactSheetId: string,
  targetFactSheetId: string,
  relationType: string,
  _title?: string,
): Promise<string> {
  type CreateResult = { createRelation?: { relation?: { id: string } } }
  const mutation = `
    mutation CreateRelation($source: ID!, $target: ID!, $type: String!) {
      createRelation(source: $source, target: $target, type: $type) {
        relation { id }
      }
    }
  `
  const data = await client.graphql<CreateResult>(mutation, {
    source: sourceFactSheetId,
    target: targetFactSheetId,
    type: relationType,
  })
  const id = data.createRelation?.relation?.id
  if (!id) {
    const payload = JSON.stringify(data, null, 2)
    throw new Error(
      `createRelation did not return relation id (sourceFactSheetId=${sourceFactSheetId}, targetFactSheetId=${targetFactSheetId}, relationType=${relationType}). Response: ${payload}`,
    )
  }
  return id
}
