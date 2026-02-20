// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ProjectId } from '@likec4/core'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestServices } from '../../test'
import { batchReadElements } from './batch-read-elements'
import { elementDiff } from './element-diff'
import { queryByTagPattern } from './query-by-tag-pattern'
import { subgraphSummary } from './subgraph-summary'

/**
 * Integration tests using the official cloud-system example model.
 *
 * The model content is embedded from examples/cloud-system/ to test
 * the new MCP tools against a realistic, multi-file architecture model
 * with diverse element kinds, tags, metadata, and relationships.
 */

// --- Cloud system example .c4 files embedded as strings ---

const SPEC = `
specification {
  color custom #6BD731

  element actor {
    notation "Person"
    style {
      shape person
    }
  }

  element system {
    notation "Software system"
    style {
      opacity 10%
    }
  }

  element externalSystem {
    notation "External System"
    style {
      color secondary
      opacity 10%
    }
  }

  element container {
    style {
      opacity 50%
    }
  }
  element app {
    notation "Application"
    style {
      multiple true
    }
  }
  element component {
    style {
      opacity 50%
    }
  }

  element mobileApp {
    notation "Mobile Application"
    style {
      shape mobile
    }
  }

  element queue {
    notation "Message queue"
    style {
      shape queue
      color secondary
    }
  }

  element database {
    notation "Database"
    style {
      shape storage
    }
  }
  element table {
    notation "Database Table"
    style {
      shape storage
    }
  }
  element gqlMutation {
    notation "GraphQL Mutation"
  }
  element gqlQuery {
    notation "GraphQL Query"
  }
  element lambda {
    notation "Serverless function"
  }

  relationship uses
  relationship requests

  tag deprecated
  tag next
  tag api
  tag db
}
`

const MODEL = `
model {
  customer = actor 'Cloud System Customer' {
    description 'Interacts with the system'
  }

  cloud = system 'Cloud System' {
    description 'Our SaaS platform'

    ui = container 'Frontends' {
      description 'All the frontend applications of Cloud System'
      style {
        shape browser
      }
      metadata {
        version '2.1.1'
      }
    }

    legacy = container 'Cloud Legacy' {
      description 'The legacy version of our SaaS'
    }

    next = container 'Cloud Next' {
      description 'Cloud Next is the next version of our cloud systems'
    }

    supportUser = actor 'Support User' {
      description 'Support team member'
      -> customer 'helps with questions' {
        metadata {
          rps '1000'
        }
      }
    }
  }
  customer .uses cloud 'uses and pays'
}
`

const EXTERNALS = `
model {
  amazon = externalSystem 'Amazon' {
    description 'Cloud and managed services provider'
    style {
      color amber
    }

    rds = container 'RDS' {
      description 'Relational Database Service'
      style {
        shape storage
      }

      pg = component 'PostgreSQL' {
        #db

        tblUsers = table 'Users Table' {
          #deprecated
          description 'Table with registered users [deprecated, moving to Aurora]'
        }
      }
    }

    sqs = container 'SQS' {
      description 'Simple Queue Service'

      queue queue1 'Raw Data' {
        description 'Queue with raw data'
      }

      queue queue2 'Enriched Data' {
        description 'Filtered and preprocessed data'
      }
    }

    lambdas = container 'Lambdas' {
      #db, #deprecated #api
      description 'Serverless compute'

      fn_enrich = lambda 'Enrichment' {
        description 'Enriches raw data'
      }

      fn_enrich -> queue1 "reads raw data"
      fn_enrich -> queue2 "writes enriched data"
    }
  }
}
`

const CLOUD_UI = `
model {
  extend cloud.ui {
    dashboard = app {
      title 'Customer Dashboard'
      description 'Nextjs application, hosted on Vercel'
      style {
        shape browser
      }
    }

    dashboard -> cloud.next.graphql.myAccount "fetches via GraphQL" {
      metadata {
        bandwidth 'medium'
        security 'approved'
      }
    }
    dashboard -> cloud.next.graphql.updateAccount "mutates via GraphQL" {
      metadata {
        bandwidth 'low'
        security 'tbd'
      }
    }

    dashboard -> cloud.legacy.backend.services "fetches via REST" {
      metadata {
        bandwidth 'high'
      }
    }

    mobile = mobileApp {
      title 'Customer Mobile App'
      description 'Native iOS Application written in Swift'

      .requests cloud.next.graphql.myAccount "fetches via GraphQL"
      .uses cloud.next.graphql.updateAccount "mutates via GraphQL"
      .uses cloud.legacy.backend.services "fetches via REST"
    }

    supportPanel = app {
      title 'Support Panel'
      description 'Retool Application'
      -> cloud.next.graphql "updates data in case of a support request"
      -> amazon.rds.aurora.tblUsers "reads users from the database" {
        technology 'postgres-rest'
      }
    }
  }

  customer -> cloud.ui.dashboard "opens in the browser via HTTPS"
  customer -> cloud.ui.mobile "opens on a mobile device"
  cloud.supportUser -> cloud.ui.supportPanel "accesses via browser with encrypted VPN connection"
}
`

const CLOUD_NEXT = `
model {
  extend amazon.rds {
    aurora = component 'Aurora' {
      #db
      description 'Aurora RDS'
      style {
        shape storage
        color secondary
      }

      tblUsers = table 'Users Table' {
        #next
        description 'Table with registered users'
        style {
          shape storage
          color secondary
        }
      }
    }
  }

  extend cloud.next {
    backend = app 'Backend V2' {
      #api
      description 'The next version of backend'
    }

    graphql = component 'GraphQL' {
      #next, #api
      description 'GraphQL API for the backend'

      gqlQuery myAccount {
        description 'Returns the account of the authenticated user'
        -> backend 'reads'
      }
      gqlMutation updateAccount {
        description 'If requested by customer, updates only its own account'
        -> backend 'writes'
      }
    }

    backend -> amazon.rds.aurora.tblUsers 'reads/writes'
    backend -> cloud.legacy.backend.services 'calls legacy'

    events = component 'Events Manager' {
      -> amazon.sqs.queue1 {
        title 'publishes events'
        technology 'JSON'
      }
      -> amazon.sqs.queue2 {
        title 'publishes events'
        technology 'proto'
      }
    }
    events -> amazon.sqs 'publishes events'

    backend -> events "triggers" {
      technology "REST"
    }
  }
}
`

const CLOUD_LEGACY = `
model {
  extend cloud.legacy {
    backend = app 'Legacy Backend' {
      description 'The legacy version of backend'

      services = component 'Legacy Backend Services' {
        #deprecated
        description 'Description of Legacy Backend Services'

        -> amazon.rds.pg.tblUsers 'reads/writes'
      }
    }
  }
}
`

describe('cloud-system integration tests', () => {
  let services: ReturnType<typeof createTestServices>['services']

  beforeAll(async () => {
    const testServices = createTestServices()
    services = testServices.services

    // Load all cloud-system documents
    await testServices.addDocument(SPEC, '_spec.c4')
    await testServices.addDocument(MODEL, 'model.c4')
    await testServices.addDocument(EXTERNALS, 'externals.c4')
    await testServices.addDocument(CLOUD_NEXT, 'cloud/next.c4')
    await testServices.addDocument(CLOUD_UI, 'cloud/ui.c4')
    await testServices.addDocument(CLOUD_LEGACY, 'cloud/legacy.c4')

    const { errors } = await testServices.validateAll()
    // Allow warnings (e.g. icon resolution) but no errors
    expect(errors, `Validation errors: ${errors.join(', ')}`).toHaveLength(0)
  })

  describe('subgraph-summary', () => {
    it('should summarize cloud system descendants', async () => {
      const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
      const result = await handler(
        { elementId: 'cloud', maxDepth: 10, metadataKeys: undefined, project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const data = result.structuredContent!

      // Root is the cloud system
      const root = data['root'] as any
      expect(root.id).toBe('cloud')
      expect(root.kind).toBe('system')
      expect(root.title).toBe('Cloud System')
      expect(root.childCount).toBe(4) // ui, legacy, next, supportUser

      const descendants = data['descendants'] as Array<any>
      expect(data['truncated']).toBe(false)
      expect(data['truncatedByDepth']).toBe(false)

      // Depth 1: ui, legacy, next, supportUser
      const depth1 = descendants.filter((d: any) => d.depth === 1)
      expect(depth1).toHaveLength(4)
      const depth1Ids = depth1.map((d: any) => d.id).sort()
      expect(depth1Ids).toEqual([
        'cloud.legacy',
        'cloud.next',
        'cloud.supportUser',
        'cloud.ui',
      ])

      // Depth 2: dashboard, mobile, supportPanel, backend(legacy), backend(next), graphql, events
      const depth2 = descendants.filter((d: any) => d.depth === 2)
      expect(depth2).toHaveLength(7)

      // Depth 3: services(legacy.backend), myAccount, updateAccount
      const depth3 = descendants.filter((d: any) => d.depth === 3)
      expect(depth3).toHaveLength(3)

      // Total: 4 + 7 + 3 = 14
      expect(data['totalDescendants']).toBe(14)
    })

    it('should filter metadata keys for cloud.ui descendants', async () => {
      const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
      const result = await handler(
        { elementId: 'cloud.ui', maxDepth: 5, metadataKeys: ['version'], project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const root = result.structuredContent!['root'] as any
      expect(root.id).toBe('cloud.ui')
      expect(root.childCount).toBe(3) // dashboard, mobile, supportPanel

      const descendants = result.structuredContent!['descendants'] as Array<any>
      expect(descendants).toHaveLength(3)

      // None of the children have 'version' metadata (it's on the parent cloud.ui)
      for (const desc of descendants) {
        expect(Object.keys(desc.metadata)).toHaveLength(0)
      }
    })

    it('should respect maxDepth on amazon subtree', async () => {
      const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
      const result = await handler(
        { elementId: 'amazon', maxDepth: 1, metadataKeys: undefined, project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const data = result.structuredContent!

      // Only depth 1: rds, sqs, lambdas
      const descendants = data['descendants'] as Array<any>
      expect(descendants).toHaveLength(3)
      expect(descendants.every((d: any) => d.depth === 1)).toBe(true)

      // Has deeper elements beyond maxDepth
      expect(data['truncatedByDepth']).toBe(true)
    })

    it('should include tags in amazon descendants', async () => {
      const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
      const result = await handler(
        { elementId: 'amazon', maxDepth: 10, metadataKeys: undefined, project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const descendants = result.structuredContent!['descendants'] as Array<any>

      const lambdas = descendants.find((d: any) => d.id === 'amazon.lambdas')
      expect(lambdas).toBeDefined()
      expect(lambdas.tags).toContain('db')
      expect(lambdas.tags).toContain('deprecated')
      expect(lambdas.tags).toContain('api')

      const pgTblUsers = descendants.find((d: any) => d.id === 'amazon.rds.pg.tblUsers')
      expect(pgTblUsers).toBeDefined()
      expect(pgTblUsers.tags).toContain('deprecated')
    })

    it('should include relationship counts for cloud.next children', async () => {
      const [_name, _config, handler] = subgraphSummary(services.likec4.LanguageServices)
      const result = await handler(
        { elementId: 'cloud.next', maxDepth: 10, metadataKeys: undefined, project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const descendants = result.structuredContent!['descendants'] as Array<any>

      const backend = descendants.find((d: any) => d.id === 'cloud.next.backend')
      expect(backend).toBeDefined()
      // backend has outgoing: -> aurora.tblUsers, -> legacy.services, -> events
      expect(backend.outgoingCount).toBeGreaterThanOrEqual(3)
      // backend has incoming: graphql.myAccount ->, graphql.updateAccount ->
      expect(backend.incomingCount).toBeGreaterThanOrEqual(2)
    })
  })

  describe('query-by-tag-pattern', () => {
    it('should find deprecated elements with prefix match', async () => {
      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: 'deprec', matchMode: 'prefix', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const data = result.structuredContent!

      const results = data['results'] as Array<any>
      expect(results.length).toBeGreaterThanOrEqual(3)

      const ids = results.map((r: any) => r.id)
      expect(ids).toContain('amazon.rds.pg.tblUsers')
      expect(ids).toContain('amazon.lambdas')
      expect(ids).toContain('cloud.legacy.backend.services')

      const matchedTags = data['matchedTagValues'] as string[]
      expect(matchedTags).toContain('deprecated')
    })

    it('should find api-tagged elements with contains match', async () => {
      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: 'api', matchMode: 'contains', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>

      const ids = results.map((r: any) => r.id)
      expect(ids).toContain('amazon.lambdas')
      expect(ids).toContain('cloud.next.backend')
      expect(ids).toContain('cloud.next.graphql')
    })

    it('should find db-tagged elements with suffix match', async () => {
      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: 'db', matchMode: 'suffix', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>

      const ids = results.map((r: any) => r.id)
      expect(ids).toContain('amazon.rds.pg')
      expect(ids).toContain('amazon.rds.aurora')
      expect(ids).toContain('amazon.lambdas')
    })

    it('should find next-tagged elements', async () => {
      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: 'next', matchMode: 'prefix', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>

      const ids = results.map((r: any) => r.id)
      expect(ids).toContain('amazon.rds.aurora.tblUsers')
      expect(ids).toContain('cloud.next.graphql')
      expect(results.length).toBe(2)
    })

    it('should return empty for non-matching pattern', async () => {
      const [_name, _config, handler] = queryByTagPattern(services.likec4.LanguageServices)
      const result = await handler(
        { pattern: 'nonexistenttag', matchMode: 'prefix', project: 'default' as ProjectId },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const results = result.structuredContent!['results'] as Array<any>
      expect(results).toHaveLength(0)
      expect(result.structuredContent!['truncated']).toBe(false)
    })
  })

  describe('batch-read-elements', () => {
    it('should read multiple cloud system elements with correct details', async () => {
      const [_name, _config, handler] = batchReadElements(services.likec4.LanguageServices)
      const result = await handler(
        {
          ids: [
            'cloud.ui.dashboard',
            'cloud.next.backend',
            'amazon.lambdas',
            'nonexistent.element',
          ],
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const data = result.structuredContent!
      const elements = data['elements'] as Array<any>
      const notFound = data['notFound'] as string[]

      expect(elements).toHaveLength(3)
      expect(notFound).toEqual(['nonexistent.element'])

      // Check dashboard details
      const dashboard = elements.find((e: any) => e.id === 'cloud.ui.dashboard')
      expect(dashboard).toBeDefined()
      expect(dashboard.kind).toBe('app')
      expect(dashboard.title).toBe('Customer Dashboard')
      expect(dashboard.description).toBe('Nextjs application, hosted on Vercel')
      // dashboard has outgoing: -> graphql.myAccount, -> graphql.updateAccount, -> legacy.services
      expect(dashboard.outgoingCount).toBeGreaterThanOrEqual(3)
      // dashboard has incoming: customer ->
      expect(dashboard.incomingCount).toBeGreaterThanOrEqual(1)
      expect(dashboard.children).toHaveLength(0) // leaf element

      // Check backend details
      const backend = elements.find((e: any) => e.id === 'cloud.next.backend')
      expect(backend).toBeDefined()
      expect(backend.kind).toBe('app')
      expect(backend.title).toBe('Backend V2')
      expect(backend.tags).toContain('api')

      // Check lambdas details
      const lambdas = elements.find((e: any) => e.id === 'amazon.lambdas')
      expect(lambdas).toBeDefined()
      expect(lambdas.tags).toContain('db')
      expect(lambdas.tags).toContain('deprecated')
      expect(lambdas.tags).toContain('api')
      expect(lambdas.children).toContain('amazon.lambdas.fn_enrich')
    })

    it('should read elements with metadata', async () => {
      const [_name, _config, handler] = batchReadElements(services.likec4.LanguageServices)
      const result = await handler(
        {
          ids: ['cloud.ui'],
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const elements = result.structuredContent!['elements'] as Array<any>

      expect(elements).toHaveLength(1)
      const ui = elements[0]
      expect(ui.id).toBe('cloud.ui')
      expect(ui.metadata).toHaveProperty('version', '2.1.1')
      expect(ui.children).toContain('cloud.ui.dashboard')
      expect(ui.children).toContain('cloud.ui.mobile')
      expect(ui.children).toContain('cloud.ui.supportPanel')
    })
  })

  describe('element-diff', () => {
    it('should diff dashboard vs mobile (different kinds, same parent)', async () => {
      const [_name, _config, handler] = elementDiff(services.likec4.LanguageServices)
      const result = await handler(
        {
          element1Id: 'cloud.ui.dashboard',
          element2Id: 'cloud.ui.mobile',
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const data = result.structuredContent!

      // Element snapshots
      expect((data['element1'] as any).id).toBe('cloud.ui.dashboard')
      expect((data['element2'] as any).id).toBe('cloud.ui.mobile')

      // Property diffs — they have different kinds (app vs mobileApp)
      const propertyDiffs = data['propertyDiffs'] as Array<any>
      const kindDiff = propertyDiffs.find((d: any) => d.property === 'kind')
      expect(kindDiff).toBeDefined()
      expect(kindDiff.element1Value).toBe('app')
      expect(kindDiff.element2Value).toBe('mobileApp')

      const titleDiff = propertyDiffs.find((d: any) => d.property === 'title')
      expect(titleDiff).toBeDefined()
      expect(titleDiff.element1Value).toBe('Customer Dashboard')
      expect(titleDiff.element2Value).toBe('Customer Mobile App')

      // Tags — neither has tags
      const tags = data['tags'] as any
      expect(tags.common).toHaveLength(0)
      expect(tags.onlyInElement1).toHaveLength(0)
      expect(tags.onlyInElement2).toHaveLength(0)

      // Metadata — neither has element-level metadata
      const metadata = data['metadata'] as any
      expect(metadata.different).toHaveLength(0)

      // Relationships — both send to graphql and legacy, but from different relationship kinds
      const relationships = data['relationships'] as any
      // Both have outgoing to graphql.myAccount, graphql.updateAccount, legacy.services
      expect(relationships.outgoingShared).toBeGreaterThanOrEqual(3)
    })

    it('should diff elements with different tags (lambdas vs legacy services)', async () => {
      const [_name, _config, handler] = elementDiff(services.likec4.LanguageServices)
      const result = await handler(
        {
          element1Id: 'amazon.lambdas',
          element2Id: 'cloud.legacy.backend.services',
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const data = result.structuredContent!

      const tags = data['tags'] as any
      // Both have 'deprecated'
      expect(tags.common).toContain('deprecated')
      // lambdas also has 'db' and 'api' which services doesn't
      expect(tags.onlyInElement1).toContain('db')
      expect(tags.onlyInElement1).toContain('api')

      // Kind difference: container vs component
      const propertyDiffs = data['propertyDiffs'] as Array<any>
      const kindDiff = propertyDiffs.find((d: any) => d.property === 'kind')
      expect(kindDiff).toBeDefined()
      expect(kindDiff.element1Value).toBe('container')
      expect(kindDiff.element2Value).toBe('component')
    })

    it('should diff db-tagged elements (pg vs aurora)', async () => {
      const [_name, _config, handler] = elementDiff(services.likec4.LanguageServices)
      const result = await handler(
        {
          element1Id: 'amazon.rds.pg',
          element2Id: 'amazon.rds.aurora',
          project: 'default' as ProjectId,
        },
        {} as any,
      )

      expect(result.structuredContent).toBeDefined()
      const data = result.structuredContent!

      // Both are components with 'db' tag
      const tags = data['tags'] as any
      expect(tags.common).toContain('db')

      // Both are children of rds
      const propertyDiffs = data['propertyDiffs'] as Array<any>
      expect(propertyDiffs.find((d: any) => d.property === 'kind')).toBeUndefined() // same kind: component

      // Different titles
      const titleDiff = propertyDiffs.find((d: any) => d.property === 'title')
      expect(titleDiff).toBeDefined()
      expect(titleDiff.element1Value).toBe('PostgreSQL')
      expect(titleDiff.element2Value).toBe('Aurora')
    })
  })
})
