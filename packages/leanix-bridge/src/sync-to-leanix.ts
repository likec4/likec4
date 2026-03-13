/**
 * Sync bridge manifest + LeanIX dry-run inventory to the LeanIX API.
 * Creates or updates fact sheets and relations; returns manifest with external LeanIX IDs.
 * Supports a read-only "plan" step that queries LeanIX to produce a sync plan artifact (Phase 2).
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
  /** Count of fact sheets reused (when idempotent and found; no mutation). */
  factSheetsReused: number
  /** Count of relations created. */
  relationsCreated: number
  /** Errors encountered (e.g. rate limit, validation). Partial sync may still have updated manifest. */
  errors: string[]
}

/** Single fact sheet entry in a sync plan: what would happen when syncing. */
export interface SyncPlanFactSheetEntry {
  likec4Id: string
  name: string
  type: string
  /** 'create' = not found in LeanIX; 'update' = found by name+type (idempotent). */
  action: 'create' | 'update'
  /** Set when action is 'update': existing LeanIX fact sheet id. */
  existingFactSheetId?: string
}

/** Single relation entry in a sync plan (relations are always created when source/target exist). */
export interface SyncPlanRelationEntry {
  likec4RelationId: string
  sourceLikec4Id: string
  targetLikec4Id: string
  type: string
  action: 'create'
}

/** Summary counts for a sync plan. */
export interface SyncPlanSummary {
  factSheetsToCreate: number
  factSheetsToUpdate: number
  relationsToCreate: number
}

/** Sync plan artifact: what would be created/updated in LeanIX (no writes; uses API only to read existing). */
export interface SyncPlan {
  generatedAt: string
  projectId: string
  mappingProfile: string
  summary: SyncPlanSummary
  factSheetPlans: SyncPlanFactSheetEntry[]
  relationPlans: SyncPlanRelationEntry[]
  /** Errors from read-only queries (e.g. auth, rate limit). Plan may be partial. */
  errors: string[]
}

function buildFactSheetPlanEntry(
  fs: LeanixFactSheetDryRun,
  existingFactSheetId: string | null,
): SyncPlanFactSheetEntry {
  const action = existingFactSheetId ? 'update' : 'create'
  return {
    likec4Id: fs.likec4Id,
    name: fs.name,
    type: fs.type,
    action,
    ...(existingFactSheetId ? { existingFactSheetId } : {}),
  }
}

function buildPlanSummary(
  factSheetPlans: SyncPlanFactSheetEntry[],
  relationPlans: SyncPlanRelationEntry[],
): SyncPlanSummary {
  return {
    factSheetsToCreate: factSheetPlans.filter(p => p.action === 'create').length,
    factSheetsToUpdate: factSheetPlans.filter(p => p.action === 'update').length,
    relationsToCreate: relationPlans.length,
  }
}

export interface PlanSyncToLeanixOptions {
  /** If true, plan assumes idempotent sync (look up by likec4IdAttribute or name+type to decide create vs update). Default: true. */
  idempotent?: boolean
  /** Custom attribute key for likec4Id lookup; when set, plan uses it for idempotent resolution. */
  likec4IdAttribute?: string
  /** ISO timestamp for the plan. Default: new Date().toISOString() */
  generatedAt?: string
}

const LEANIX_PROVIDER = 'leanix' as const

/** Normalise caught value to a string for error reporting (Clean Code: context in errors). */
function toErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.stack ? `${err.message}\n${err.stack}` : err.message
  }
  if (typeof err === 'object' && err !== null) {
    try {
      return JSON.stringify(err, null, 2)
    } catch {
      return Object.prototype.toString.call(err)
    }
  }
  return String(err)
}

/** GraphQL: search fact sheets by name and type (for idempotency). Returns null only when not found; throws on API/network error. */
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
  const data = await client.graphql<AllFactSheetsResult>(query, { name, type })
  const edges = data.allFactSheets?.edges ?? []
  const first = edges[0]?.node
  return first?.id ?? null
}

/**
 * GraphQL: search fact sheets by custom attribute (e.g. likec4Id) for idempotent lookup.
 * Uses facetFilters when likec4IdAttribute is set so distinct LikeC4 elements resolve to the correct LeanIX fact sheet.
 * Returns null when not found; throws on API/network error.
 */
async function findFactSheetByLikec4IdAttribute(
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

/**
 * GraphQL: patch an existing fact sheet to set a custom attribute (e.g. likec4Id for stable-ID backfill).
 * Schema varies by workspace; uses updateFactSheet with a single replace patch when supported.
 */
async function patchFactSheetAttribute(
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
  if (!id) throw new Error(`createFactSheet did not return id for ${String(fs.name)}`)
  return id
}

/**
 * Create a relation between two fact sheets.
 * LeanIX GraphQL schema varies by workspace; this uses a generic createRelation if available.
 * Throws when the mutation returns no relation id so callers can record the failure.
 */
async function createRelation(
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

/** Result of syncing fact sheets: map of likec4Id → factSheetId and counts/errors. */
interface SyncFactSheetsResult {
  likec4IdToFactSheetId: Map<CanonicalId, string>
  factSheetsCreated: number
  factSheetsReused: number
  errors: string[]
}

/** Creates or finds fact sheets in LeanIX; returns map and counts. Single responsibility. */
async function syncFactSheetsToLeanix(
  client: LeanixApiClient,
  factSheets: LeanixInventoryDryRun['factSheets'],
  idempotent: boolean,
  likec4IdAttribute: string | undefined,
): Promise<SyncFactSheetsResult> {
  const likec4IdToFactSheetId = new Map<CanonicalId, string>()
  const errors: string[] = []
  let factSheetsCreated = 0
  let factSheetsReused = 0

  for (const fs of factSheets) {
    try {
      let factSheetId: string | null = null
      if (idempotent) {
        if (likec4IdAttribute) {
          factSheetId = await findFactSheetByLikec4IdAttribute(client, likec4IdAttribute, fs.likec4Id)
          if (!factSheetId) {
            factSheetId = await findFactSheetByNameAndType(client, fs.name, fs.type)
            if (factSheetId && fs.likec4Id) {
              await patchFactSheetAttribute(client, factSheetId, likec4IdAttribute, fs.likec4Id)
            }
          }
        } else {
          factSheetId = await findFactSheetByNameAndType(client, fs.name, fs.type)
        }
        if (factSheetId) factSheetsReused++
      }
      if (!factSheetId) {
        factSheetId = await createFactSheet(client, fs, likec4IdAttribute)
        factSheetsCreated++
      }
      if (factSheetId) likec4IdToFactSheetId.set(fs.likec4Id, factSheetId)
    } catch (e) {
      errors.push(`Fact sheet ${fs.likec4Id} (${String(fs.name)}): ${toErrorMessage(e)}`)
    }
  }

  return { likec4IdToFactSheetId, factSheetsCreated, factSheetsReused, errors }
}

/** Result of syncing relations: updated relations array and count/errors. */
interface SyncRelationsResult {
  updatedRelations: BridgeManifest['relations']
  relationsCreated: number
  errors: string[]
}

/** Creates relations in LeanIX and returns manifest relations with external IDs. Single responsibility. */
async function syncRelationsToLeanix(
  client: LeanixApiClient,
  manifestRelations: BridgeManifest['relations'],
  leanixRelations: LeanixInventoryDryRun['relations'],
  likec4IdToFactSheetId: Map<CanonicalId, string>,
): Promise<SyncRelationsResult> {
  const updatedRelations: BridgeManifest['relations'] = []
  const errors: string[] = []
  let relationsCreated = 0

  for (const rel of manifestRelations) {
    const sourceId = likec4IdToFactSheetId.get(rel.sourceFqn)
    const targetId = likec4IdToFactSheetId.get(rel.targetFqn)
    const existing = rel.external?.[LEANIX_PROVIDER]
    if (sourceId && targetId && !existing?.relationId) {
      const dryRel = leanixRelations.find(
        r =>
          r.sourceLikec4Id === rel.sourceFqn &&
          r.targetLikec4Id === rel.targetFqn &&
          r.likec4RelationId === rel.relationId,
      )
      if (dryRel) {
        try {
          const relationId = await createRelation(client, sourceId, targetId, dryRel.type, dryRel.title)
          relationsCreated++
          updatedRelations.push({
            ...rel,
            external: { ...rel.external, [LEANIX_PROVIDER]: { relationId, ...rel.external?.[LEANIX_PROVIDER] } },
          })
          continue
        } catch (e) {
          errors.push(`Relation ${rel.compositeKey}: ${toErrorMessage(e)}`)
        }
      }
    }
    updatedRelations.push(rel)
  }

  return { updatedRelations, relationsCreated, errors }
}

/**
 * Produces a sync plan by querying LeanIX for existing fact sheets (read-only; no creates/updates).
 * Use before syncToLeanix to review what would be created vs updated. Phase 2 dry-run sync planning.
 */
export async function planSyncToLeanix(
  leanixDryRun: LeanixInventoryDryRun,
  client: LeanixApiClient,
  options: PlanSyncToLeanixOptions = {},
): Promise<SyncPlan> {
  const idempotent = options.idempotent ?? true
  const likec4IdAttribute = options.likec4IdAttribute
  const generatedAt = options.generatedAt ?? new Date().toISOString()
  const errors: string[] = []
  const factSheetPlans: SyncPlan['factSheetPlans'] = []

  for (const fs of leanixDryRun.factSheets) {
    try {
      let existingId: string | null = null
      if (idempotent) {
        if (likec4IdAttribute) {
          existingId = await findFactSheetByLikec4IdAttribute(client, likec4IdAttribute, fs.likec4Id)
          if (!existingId) existingId = await findFactSheetByNameAndType(client, fs.name, fs.type)
        } else {
          existingId = await findFactSheetByNameAndType(client, fs.name, fs.type)
        }
      }
      factSheetPlans.push(buildFactSheetPlanEntry(fs, existingId))
    } catch (e) {
      errors.push(`Fact sheet ${fs.likec4Id} (${String(fs.name)}): ${toErrorMessage(e)}`)
      factSheetPlans.push(buildFactSheetPlanEntry(fs, null))
    }
  }

  const relationPlans: SyncPlan['relationPlans'] = leanixDryRun.relations.map(rel => ({
    likec4RelationId: rel.likec4RelationId,
    sourceLikec4Id: rel.sourceLikec4Id,
    targetLikec4Id: rel.targetLikec4Id,
    type: rel.type,
    action: 'create' as const,
  }))

  return {
    generatedAt,
    projectId: leanixDryRun.projectId,
    mappingProfile: leanixDryRun.mappingProfile,
    summary: buildPlanSummary(factSheetPlans, relationPlans),
    factSheetPlans,
    relationPlans,
    errors,
  }
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

  const fsResult = await syncFactSheetsToLeanix(
    client,
    leanixDryRun.factSheets,
    idempotent,
    likec4IdAttribute,
  )
  const updatedEntities = applyLeanixIdsToEntities(manifest.entities, fsResult.likec4IdToFactSheetId)

  const relResult = await syncRelationsToLeanix(
    client,
    manifest.relations,
    leanixDryRun.relations,
    fsResult.likec4IdToFactSheetId,
  )

  return {
    manifest: {
      ...manifest,
      entities: updatedEntities,
      relations: relResult.updatedRelations,
    },
    factSheetsCreated: fsResult.factSheetsCreated,
    factSheetsReused: fsResult.factSheetsReused,
    relationsCreated: relResult.relationsCreated,
    errors: [...fsResult.errors, ...relResult.errors],
  }
}
