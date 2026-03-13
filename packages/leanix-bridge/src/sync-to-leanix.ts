/**
 * Sync bridge manifest + LeanIX dry-run inventory to the LeanIX API.
 * Creates or updates fact sheets and relations; returns manifest with external LeanIX IDs.
 */

import type { BridgeManifest, CanonicalId } from './contracts'
import { LeanixApiClient } from './leanix-api-client'
import type { LeanixFactSheetDryRun, LeanixInventoryDryRun } from './to-leanix-inventory-dry-run'

export interface SyncToLeanixOptions {
  /** If true, only create fact sheets that do not exist (by name+type). Default: true. */
  idempotent?: boolean
  /** Custom attribute key in LeanIX to store likec4Id for lookup. If not set, lookup by name+type. */
  likec4IdAttribute?: string
}

export interface SyncToLeanixResult {
  /** Updated manifest with external.leanix.factSheetId and relation IDs filled. */
  manifest: BridgeManifest
  /** Count of fact sheets created. */
  factSheetsCreated: number
  /** Count of fact sheets updated (when idempotent and found). */
  factSheetsUpdated: number
  /** Count of relations created. */
  relationsCreated: number
  /** Errors encountered (e.g. rate limit, validation). Partial sync may still have updated manifest. */
  errors: string[]
}

const LEANIX_PROVIDER = 'leanix' as const

/** GraphQL: search fact sheets by name and type (for idempotency). */
async function findFactSheetByNameAndType(
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
  try {
    const data = await client.graphql<AllFactSheetsResult>(query, { name, type })
    const edges = data.allFactSheets?.edges ?? []
    const first = edges[0]?.node
    return first?.id ?? null
  } catch {
    return null
  }
}

/** GraphQL: create fact sheet (name, type, optional patches for description and custom likec4Id). */
async function createFactSheet(
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
  if (!id) throw new Error(`createFactSheet did not return id for ${fs.name}`)
  return id
}

/**
 * Create a relation between two fact sheets.
 * LeanIX GraphQL schema varies by workspace; this uses a generic createRelation if available.
 * Falls back to no-op and logs; relation types are meta-model specific.
 */
async function createRelation(
  client: LeanixApiClient,
  sourceFactSheetId: string,
  targetFactSheetId: string,
  relationType: string,
  _title?: string,
): Promise<string | null> {
  type CreateResult = { createRelation?: { relation?: { id: string } } }
  const mutation = `
    mutation CreateRelation($source: ID!, $target: ID!, $type: String!) {
      createRelation(source: $source, target: $target, type: $type) {
        relation { id }
      }
    }
  `
  try {
    const data = await client.graphql<CreateResult>(mutation, {
      source: sourceFactSheetId,
      target: targetFactSheetId,
      type: relationType,
    })
    return data.createRelation?.relation?.id ?? null
  } catch {
    return null
  }
}

/** Applies LeanIX fact sheet IDs to manifest entities; returns new entities object. */
function applyLeanixIdsToEntities(
  entities: BridgeManifest['entities'],
  likec4IdToFactSheetId: Map<CanonicalId, string>,
): BridgeManifest['entities'] {
  const out = { ...entities }
  for (const [canonicalId, entity] of Object.entries(entities)) {
    const leanixId = likec4IdToFactSheetId.get(canonicalId)
    if (leanixId) {
      out[canonicalId] = {
        ...entity,
        external: { ...entity.external, [LEANIX_PROVIDER]: { factSheetId: leanixId, externalId: leanixId } },
      }
    }
  }
  return out
}

/**
 * Syncs the dry-run inventory to LeanIX: creates or finds fact sheets, creates relations,
 * and returns an updated manifest with external LeanIX IDs.
 */
export async function syncToLeanix(
  manifest: BridgeManifest,
  leanixDryRun: LeanixInventoryDryRun,
  client: LeanixApiClient,
  options: SyncToLeanixOptions = {},
): Promise<SyncToLeanixResult> {
  const idempotent = options.idempotent ?? true
  const likec4IdAttribute = options.likec4IdAttribute
  const errors: string[] = []
  const likec4IdToFactSheetId = new Map<CanonicalId, string>()
  let factSheetsCreated = 0
  let factSheetsUpdated = 0
  let relationsCreated = 0

  for (const fs of leanixDryRun.factSheets) {
    try {
      let factSheetId: string | null = null
      if (idempotent) {
        factSheetId = await findFactSheetByNameAndType(client, fs.name, fs.type)
        if (factSheetId) factSheetsUpdated++
      }
      if (!factSheetId) {
        factSheetId = await createFactSheet(client, fs, likec4IdAttribute)
        factSheetsCreated++
      }
      if (factSheetId) likec4IdToFactSheetId.set(fs.likec4Id, factSheetId)
    } catch (e) {
      errors.push(`Fact sheet ${fs.likec4Id} (${fs.name}): ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const updatedEntities = applyLeanixIdsToEntities(manifest.entities, likec4IdToFactSheetId)

  const updatedRelations: BridgeManifest['relations'] = []
  for (const rel of manifest.relations) {
    const sourceId = likec4IdToFactSheetId.get(rel.sourceFqn)
    const targetId = likec4IdToFactSheetId.get(rel.targetFqn)
    const existing = rel.external?.[LEANIX_PROVIDER]
    if (sourceId && targetId && !existing?.relationId) {
      const dryRel = leanixDryRun.relations.find(
        r =>
          r.sourceLikec4Id === rel.sourceFqn &&
          r.targetLikec4Id === rel.targetFqn &&
          r.likec4RelationId === rel.relationId,
      )
      if (dryRel) {
        try {
          const relationId = await createRelation(client, sourceId, targetId, dryRel.type, dryRel.title)
          if (relationId) {
            relationsCreated++
            updatedRelations.push({
              ...rel,
              external: { ...rel.external, [LEANIX_PROVIDER]: { relationId, ...rel.external?.[LEANIX_PROVIDER] } },
            })
            continue
          }
        } catch (e) {
          errors.push(`Relation ${rel.compositeKey}: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }
    updatedRelations.push(rel)
  }

  return {
    manifest: {
      ...manifest,
      entities: updatedEntities,
      relations: updatedRelations,
    },
    factSheetsCreated,
    factSheetsUpdated,
    relationsCreated,
    errors,
  }
}
