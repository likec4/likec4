import { describe, expect as viExpect, it } from 'vitest'
import { schemas } from '../schemas'
import {
  materialize,
  withctx,
} from './base'
import { deployment } from './deployment'

function expectDeployment(data: schemas.deployment.Input) {
  const parsed = schemas.deployment.schema.parse(data)
  return viExpect(
    materialize(
      withctx(parsed, deployment()),
    ),
  )
}

describe('deployment', () => {
  it('should print empty deployment', () => {
    expectDeployment({}).toMatchInlineSnapshot(`""`)
  })

  it('should print deployment nodes', () => {
    expectDeployment({
      elements: [
        {
          id: 'aws',
          kind: 'cloud',
          title: 'AWS Cloud',
        },
        {
          id: 'aws.vpc',
          kind: 'network',
          title: 'VPC',
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        aws = cloud 'AWS Cloud' {
          vpc = network 'VPC'
        }
      }"
    `)
  })

  it('should print deployment instances', () => {
    expectDeployment({
      elements: [
        {
          id: 'aws',
          kind: 'cloud',
          title: 'AWS Cloud',
        },
        {
          id: 'aws.backend',
          element: 'system.backend',
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        aws = cloud 'AWS Cloud' {
          instanceOf system.backend
        }
      }"
    `)
  })

  it('should print instance with custom title', () => {
    expectDeployment({
      elements: [
        {
          id: 'aws.backend',
          element: 'system.backend',
          title: 'Backend Service',
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        instanceOf system.backend 'Backend Service'
      }"
    `)
  })

  it('should print instance with same name as element', () => {
    expectDeployment({
      elements: [
        {
          id: 'backend',
          element: 'backend',
          title: 'Backend Service',
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        instanceOf backend 'Backend Service'
      }"
    `)
  })

  it('should print nodes with properties', () => {
    expectDeployment({
      elements: [
        {
          id: 'aws',
          kind: 'cloud',
          title: 'AWS Cloud',
          tags: ['production', 'us-east-1'],
          technology: 'Amazon Web Services',
          description: {
            md: 'AWS **Cloud** infrastructure\n\n> Production environment',
          },
          summary: {
            md: 'Main cloud provider',
          },
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        aws = cloud 'AWS Cloud' {
          #production, #us-east-1
          technology 'Amazon Web Services'
          summary '''
            Main cloud provider
          '''
          description '''
            AWS **Cloud** infrastructure
            
            > Production environment
          '''
        }
      }"
    `)
  })

  it('should print nodes with style properties', () => {
    expectDeployment({
      elements: [
        {
          id: 'aws',
          kind: 'cloud',
          color: 'amber',
          icon: 'tech:aws',
          shape: 'rectangle',
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        aws = cloud {
          style {
            shape rectangle
            color amber
            icon tech:aws
          }
        }
      }"
    `)
  })

  it('should print instances with properties', () => {
    expectDeployment({
      elements: [
        {
          id: 'aws.backend',
          element: 'system.backend',
          tags: ['service', 'api'],
          technology: 'Node.js',
          links: [
            { url: 'https://example.com', title: 'docs' },
            { url: '../relative/path' },
          ],
          metadata: {
            version: '1.0.0',
            replicas: ['3'],
          },
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        instanceOf system.backend {
          #service, #api
          technology 'Node.js'
          link https://example.com 'docs'
          link ../relative/path
          metadata {
            version '1.0.0'
            replicas [
              '3'
            ]
          }
        }
      }"
    `)
  })

  it('should print nested deployment structure', () => {
    expectDeployment({
      elements: [
        {
          id: 'aws',
          kind: 'cloud',
          title: 'AWS Cloud',
        },
        {
          id: 'aws.region1',
          kind: 'zone',
          title: 'us-east-1',
        },
        {
          id: 'aws.region1.vpc',
          kind: 'network',
          title: 'VPC',
        },
        {
          id: 'aws.region1.vpc.subnet',
          kind: 'network',
          title: 'Private Subnet',
        },
        {
          id: 'aws.region1.vpc.subnet.backend',
          element: 'system.backend',
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        aws = cloud 'AWS Cloud' {
          region1 = zone 'us-east-1' {
            vpc = network 'VPC' {
              subnet = network 'Private Subnet' {
                instanceOf system.backend
              }
            }
          }
        }
      }"
    `)
  })

  it('should print complex deployment with mixed nodes and instances', () => {
    expectDeployment({
      elements: [
        {
          id: 'aws',
          kind: 'cloud',
          title: 'AWS',
          color: 'amber',
        },
        {
          id: 'aws.k8s',
          kind: 'cluster',
          title: 'EKS Cluster',
          tags: ['kubernetes'],
        },
        {
          id: 'aws.k8s.namespace',
          kind: 'namespace',
          title: 'production',
        },
        {
          id: 'aws.k8s.namespace.api',
          element: 'system.api',
          title: 'API Service',
          technology: 'Node.js',
        },
        {
          id: 'aws.k8s.namespace.worker',
          element: 'system.worker',
          tags: ['background'],
        },
        {
          id: 'aws.rds',
          kind: 'database',
          title: 'RDS',
          technology: 'PostgreSQL',
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        aws = cloud 'AWS' {
          style {
            color amber
          }
          
          k8s = cluster 'EKS Cluster' {
            #kubernetes
            
            namespace = namespace 'production' {
              instanceOf system.api 'API Service' {
                technology 'Node.js'
              }
              
              instanceOf system.worker {
                #background
              }
            }
          }
          
          rds = database 'RDS' {
            technology 'PostgreSQL'
          }
        }
      }"
    `)
  })

  it('should print nodes without title when title matches name', () => {
    expectDeployment({
      elements: [
        {
          id: 'aws',
          kind: 'cloud',
          title: 'aws',
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        aws = cloud
      }"
    `)
  })

  it('should print instance without title when title matches name', () => {
    expectDeployment({
      elements: [
        {
          id: 'backend',
          element: 'system.backend',
          title: 'backend',
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        instanceOf system.backend
      }"
    `)
  })

  it('should print nodes with metadata', () => {
    expectDeployment({
      elements: [
        {
          id: 'aws',
          kind: 'cloud',
          metadata: {
            region: 'us-east-1',
            account: '123456789',
            tags: ['prod', 'critical'],
          },
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        aws = cloud {
          metadata {
            region 'us-east-1'
            account '123456789'
            tags [
              'prod',
              'critical'
            ]
          }
        }
      }"
    `)
  })

  it('should print instances with inline style', () => {
    expectDeployment({
      elements: [
        {
          id: 'backend',
          element: 'system.backend',
          style: {
            color: 'blue',
            shape: 'cylinder',
            icon: 'tech:docker',
          },
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        instanceOf system.backend {
          style {
            shape cylinder
            color blue
            icon tech:docker
          }
        }
      }"
    `)
  })

  it('should print nodes with all property types', () => {
    expectDeployment({
      elements: [
        {
          id: 'prod',
          kind: 'environment',
          title: 'Production',
          tags: ['live', 'monitored'],
          technology: 'AWS',
          summary: {
            md: 'Production **environment**',
          },
          description: {
            md: 'Main production environment\n\nHandles all live traffic',
          },
          links: [
            { url: 'https://monitoring.example.com', title: 'dashboard' },
          ],
          metadata: {
            uptime: '99.99%',
            instances: ['5'],
          },
          color: 'green',
          icon: 'tech:aws',
          notation: 'environment',
        },
      ],
    }).toMatchInlineSnapshot(`
      "deployment {
        prod = environment 'Production' {
          #live, #monitored
          technology 'AWS'
          summary '''
            Production **environment**
          '''
          description '''
            Main production environment
            
            Handles all live traffic
          '''
          link https://monitoring.example.com 'dashboard'
          metadata {
            uptime '99.99%'
            instances [
              '5'
            ]
          }
          style {
            color green
            icon tech:aws
          }
        }
      }"
    `)
  })
})
