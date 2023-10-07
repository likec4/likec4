/******************************************************************************
 * This file was generated
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/
/* eslint-disable */

import type { DiagramView } from '@likec4/core'

export type LikeC4ViewId =
  | 'amazon'
  | 'amazon_rds'
  | 'amazon_cognito'
  | 'premium'
  | 'index'
  | 'customer'
  | 'cloud'
  | 'cloud_ui'
  | 'cloud_backend'
  | 'cloud_graphql'
  | 'cloud_cms'
  | 'themecolors'
  | 'themecolor_primary'
  | 'themecolor_blue'
  | 'themecolor_secondary'
  | 'themecolor_sky'
  | 'themecolor_muted'
  | 'themecolor_slate'
  | 'themecolor_gray'
  | 'themecolor_red'
  | 'themecolor_green'
  | 'themecolor_amber'
  | 'themecolor_indigo'
export const LikeC4Views = {
  amazon: {
    id: 'amazon',
    viewOf: 'amazon',
    title: 'Overview Amazon',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/amazon.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { wildcard: true },
          { element: 'cloud', isDescedants: false },
          {
            source: { element: 'cloud', isDescedants: true },
            target: { element: 'amazon', isDescedants: false }
          }
        ]
      },
      { targets: [{ wildcard: true }], style: { color: 'muted' } },
      {
        targets: [
          { element: 'cloud', isDescedants: false },
          { element: 'cloud', isDescedants: true }
        ],
        style: { color: 'sky' }
      },
      {
        targets: [
          { element: 'amazon', isDescedants: false },
          { element: 'amazon', isDescedants: true }
        ],
        style: { color: 'primary' }
      },
      { targets: [{ element: 'amazon.rds', isDescedants: false }], style: { color: 'indigo' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 1365,
    height: 909,
    nodes: [
      {
        description:
          'Our SaaS platfrom that allows\ncustomers to interact with\nthe latest technologies',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Cloud System',
        id: 'cloud',
        parent: null,
        level: 0,
        color: 'sky',
        shape: 'rectangle',
        children: ['cloud.backend', 'cloud.ui'],
        inEdges: ['customer:cloud'],
        outEdges: ['cloud:amazon'],
        navigateTo: 'cloud',
        position: [402, 11],
        size: { width: 790, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'CLOUD SYSTEM',
            pt: [10, 16],
            align: 'left',
            width: 104
          }
        ]
      },
      {
        description: 'Cloud and managed services provider',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Amazon',
        id: 'amazon',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'rectangle',
        children: ['amazon.ses', 'amazon.cognito', 'amazon.rds'],
        inEdges: ['cloud:amazon'],
        outEdges: [],
        position: [11, 343],
        size: { width: 1181, height: 306 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'AMAZON',
            pt: [11, 15],
            align: 'left',
            width: 58
          }
        ]
      },
      {
        description: 'The backend services of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Backend',
        id: 'cloud.backend',
        parent: 'cloud',
        level: 1,
        color: 'sky',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [
          'cloud.backend:amazon.rds',
          'cloud.backend:amazon.ses',
          'cloud.backend:amazon.cognito'
        ],
        navigateTo: 'cloud_backend',
        position: [441, 77],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Backend',
            pt: [125, 83],
            align: 'left',
            width: 73
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'The backend services of the cloud system',
            pt: [37, 110],
            align: 'left',
            width: 249
          }
        ]
      },
      {
        description: 'Email sending',
        technology: null,
        tags: null,
        links: null,
        kind: 'component',
        title: 'SES',
        id: 'amazon.ses',
        parent: 'amazon',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.backend:amazon.ses'],
        outEdges: ['amazon.ses:customer'],
        position: [441, 419],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#eff6ff', text: 'SES', pt: [142, 83], align: 'left', width: 38 },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Email sending',
            pt: [119, 110],
            align: 'left',
            width: 84
          }
        ]
      },
      {
        description: 'The regular customer of the system',
        technology: null,
        tags: null,
        links: null,
        kind: 'actor',
        title: 'Cloud System Customer',
        id: 'customer',
        parent: null,
        level: 0,
        color: 'muted',
        shape: 'person',
        children: [],
        inEdges: ['amazon.ses:customer'],
        outEdges: ['customer:cloud.ui', 'customer:cloud'],
        navigateTo: 'customer',
        position: [791, 729],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Cloud System Customer',
            pt: [60, 82],
            align: 'left',
            width: 203
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'The regular customer of the system',
            pt: [57, 109],
            align: 'left',
            width: 210
          }
        ]
      },
      {
        description: 'All the frontend applications of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Frontend',
        id: 'cloud.ui',
        parent: 'cloud',
        level: 1,
        color: 'sky',
        shape: 'browser',
        children: [],
        inEdges: ['customer:cloud.ui'],
        outEdges: ['cloud.ui:amazon.cognito'],
        navigateTo: 'cloud_ui',
        position: [831, 77],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Frontend',
            pt: [124, 75],
            align: 'left',
            width: 75
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'All the frontend applications of the cloud',
            pt: [43, 102],
            align: 'left',
            width: 237
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'system',
            pt: [140, 118],
            align: 'left',
            width: 43
          }
        ]
      },
      {
        description: 'User management and authentication',
        technology: null,
        tags: null,
        links: null,
        kind: 'component',
        title: 'Cognito',
        id: 'amazon.cognito',
        parent: 'amazon',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.ui:amazon.cognito', 'cloud.backend:amazon.cognito'],
        outEdges: [],
        navigateTo: 'amazon_cognito',
        position: [831, 419],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Cognito',
            pt: [129, 83],
            align: 'left',
            width: 65
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'User management and authentication',
            pt: [50, 110],
            align: 'left',
            width: 223
          }
        ]
      },
      {
        description: 'Relational Databases',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'RDS',
        icon: 'https://icons.terrastruct.com/aws%2FDatabase%2FAmazon-RDS_Amazon-RDS_instance_light-bg.svg',
        id: 'amazon.rds',
        parent: 'amazon',
        level: 1,
        color: 'indigo',
        shape: 'cylinder',
        children: [],
        inEdges: ['cloud.backend:amazon.rds'],
        outEdges: [],
        navigateTo: 'amazon_rds',
        position: [50, 409],
        size: { width: 321, height: 200 },
        labels: [
          { fontSize: 19, color: '#eef2ff', text: 'RDS', pt: [141, 112], align: 'left', width: 40 },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'Relational Databases',
            pt: [98, 139],
            align: 'left',
            width: 127
          }
        ]
      }
    ],
    edges: [
      {
        id: 'cloud.ui:amazon.cognito',
        parent: null,
        source: 'cloud.ui',
        target: 'amazon.cognito',
        label: 'authenticates',
        relations: [
          '7b1f109ce67c4ce864272bbe8d6a9e96a19fd75b',
          '0bcc80a47e86b46d1e379452dedccb2b6d30385e'
        ],
        points: [
          [992, 257],
          [992, 302],
          [992, 358],
          [992, 405],
          [992, 419]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'authenticates',
            pt: [996, 324],
            align: 'left',
            width: 80
          }
        ],
        headArrow: [
          [996, 404],
          [992, 415],
          [989, 404]
        ]
      },
      {
        id: 'cloud.backend:amazon.rds',
        parent: null,
        source: 'cloud.backend',
        target: 'amazon.rds',
        label: 'reads and writes',
        relations: [
          '13cc69fddf108f3e957176614350e45b253828d2',
          '3ddee07e9a95bdce31d69904e0283ead2d973a83'
        ],
        points: [
          [500, 257],
          [449, 301],
          [387, 355],
          [334, 401],
          [323, 410]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'reads and writes',
            pt: [435, 324],
            align: 'left',
            width: 98
          }
        ],
        headArrow: [
          [337, 404],
          [326, 408],
          [332, 398]
        ]
      },
      {
        id: 'cloud.backend:amazon.ses',
        parent: null,
        source: 'cloud.backend',
        target: 'amazon.ses',
        label: 'schedule emails',
        relations: ['a62dc74776021465c85ea4f3d873adacf31aa64b'],
        points: [
          [602, 257],
          [602, 302],
          [602, 358],
          [602, 405],
          [602, 419]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'schedule emails',
            pt: [606, 324],
            align: 'left',
            width: 96
          }
        ],
        headArrow: [
          [606, 404],
          [602, 415],
          [598, 404]
        ]
      },
      {
        id: 'cloud.backend:amazon.cognito',
        parent: null,
        source: 'cloud.backend',
        target: 'amazon.cognito',
        label: 'authorizes',
        relations: [
          '4ac81247dfbcc8f8f1ebdd0b08e9654400df960c',
          'c54b72efecb59d27915c091f92cd8a3e5f58b64a'
        ],
        points: [
          [704, 257],
          [758, 304],
          [824, 361],
          [879, 409],
          [890, 419]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'authorizes',
            pt: [788, 324],
            align: 'left',
            width: 62
          }
        ],
        headArrow: [
          [882, 406],
          [887, 416],
          [877, 412]
        ]
      },
      {
        id: 'amazon.ses:customer',
        parent: null,
        source: 'amazon.ses',
        target: 'customer',
        label: 'sends emails',
        relations: ['5ec3d79811ace2e0b99bb5ca451d1fbc0331a2ab'],
        points: [
          [703, 599],
          [746, 636],
          [797, 681],
          [841, 720],
          [852, 729]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'sends emails',
            pt: [802, 675],
            align: 'left',
            width: 78
          }
        ],
        headArrow: [
          [843, 716],
          [849, 726],
          [838, 722]
        ]
      },
      {
        id: 'customer:cloud.ui',
        parent: null,
        source: 'customer',
        target: 'cloud.ui',
        label: 'opens in browser',
        relations: [
          '363b63a37194ffc0ea5c41c7710e940f9778aa1e',
          '791b3be30c97c63eb23625459513c0016f4200b3'
        ],
        points: [
          [1112, 747],
          [1151, 722],
          [1188, 689],
          [1210, 649],
          [1274, 529],
          [1269, 465],
          [1210, 343],
          [1196, 314],
          [1175, 288],
          [1151, 266],
          [1141, 257]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'opens in browser',
            pt: [1259, 513],
            align: 'left',
            width: 102
          }
        ],
        headArrow: [
          [1149, 270],
          [1144, 260],
          [1154, 264]
        ]
      }
    ]
  } as unknown as DiagramView,
  amazon_rds: {
    id: 'amazon_rds',
    viewOf: 'amazon.rds',
    title: 'Overview Amazon RDS',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/amazon.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { wildcard: true },
          { element: 'amazon', isDescedants: false },
          {
            source: { element: 'cloud.backend', isDescedants: true },
            target: { element: 'amazon.rds', isDescedants: false }
          }
        ]
      }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 892,
    height: 798,
    nodes: [
      {
        description:
          'Our SaaS platfrom that allows\ncustomers to interact with\nthe latest technologies',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Cloud System',
        id: 'cloud',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'rectangle',
        children: ['cloud.backend.graphql', 'cloud.backend.cms'],
        inEdges: [],
        outEdges: ['cloud:amazon'],
        navigateTo: 'cloud',
        position: [51, 11],
        size: { width: 791, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'CLOUD SYSTEM',
            pt: [11, 16],
            align: 'left',
            width: 104
          }
        ]
      },
      {
        description: 'Cloud and managed services provider',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Amazon',
        id: 'amazon',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['amazon.rds'],
        inEdges: ['cloud.backend.graphql:amazon', 'cloud:amazon'],
        outEdges: [],
        navigateTo: 'amazon',
        position: [11, 343],
        size: { width: 871, height: 444 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'AMAZON',
            pt: [11, 15],
            align: 'left',
            width: 58
          }
        ]
      },
      {
        description: 'Relational Databases',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'RDS',
        icon: 'https://icons.terrastruct.com/aws%2FDatabase%2FAmazon-RDS_Amazon-RDS_instance_light-bg.svg',
        id: 'amazon.rds',
        parent: 'amazon',
        level: 1,
        color: 'primary',
        shape: 'cylinder',
        children: ['amazon.rds.pg', 'amazon.rds.mysql'],
        inEdges: [],
        outEdges: [],
        position: [51, 409],
        size: { width: 791, height: 338 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'RDS',
            pt: [11, 16],
            align: 'left',
            width: 28
          }
        ]
      },
      {
        description: 'The GraphQL API of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'app',
        title: 'GraphQL API',
        id: 'cloud.backend.graphql',
        parent: 'cloud',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: ['cloud.backend.graphql:amazon.rds.pg', 'cloud.backend.graphql:amazon'],
        navigateTo: 'cloud_graphql',
        position: [90, 77],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'GraphQL API',
            pt: [105, 83],
            align: 'left',
            width: 113
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The GraphQL API of the cloud system',
            pt: [49, 110],
            align: 'left',
            width: 226
          }
        ]
      },
      {
        description: 'Database for storing relational data',
        technology: 'AWS Aurora',
        tags: null,
        links: null,
        kind: 'database',
        title: 'PostgreSQL',
        icon: 'https://icons.terrastruct.com/dev%2Fpostgresql.svg',
        id: 'amazon.rds.pg',
        parent: 'amazon.rds',
        level: 2,
        color: 'primary',
        shape: 'storage',
        children: [],
        inEdges: ['cloud.backend.graphql:amazon.rds.pg'],
        outEdges: [],
        position: [90, 474],
        size: { width: 321, height: 233 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'PostgreSQL',
            pt: [110, 118],
            align: 'left',
            width: 102
          },
          {
            fontSize: 12,
            color: '#bfdbfe',
            text: 'AWS Aurora',
            pt: [128, 143],
            align: 'left',
            width: 67
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Database for storing relational data',
            pt: [57, 168],
            align: 'left',
            width: 208
          }
        ]
      },
      {
        description: 'The CMS of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'app',
        title: 'CMS',
        id: 'cloud.backend.cms',
        parent: 'cloud',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: ['cloud.backend.cms:amazon.rds.mysql'],
        navigateTo: 'cloud_cms',
        position: [481, 77],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#eff6ff', text: 'CMS', pt: [140, 83], align: 'left', width: 42 },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The CMS of the cloud system',
            pt: [73, 110],
            align: 'left',
            width: 175
          }
        ]
      },
      {
        description: 'Database for storing relational data',
        technology: 'AWS Aurora',
        tags: null,
        links: null,
        kind: 'database',
        title: 'MySQL',
        icon: 'https://icons.terrastruct.com/dev%2Fmysql.svg',
        id: 'amazon.rds.mysql',
        parent: 'amazon.rds',
        level: 2,
        color: 'indigo',
        shape: 'storage',
        children: [],
        inEdges: ['cloud.backend.cms:amazon.rds.mysql'],
        outEdges: [],
        position: [481, 474],
        size: { width: 321, height: 233 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'MySQL',
            pt: [130, 118],
            align: 'left',
            width: 63
          },
          {
            fontSize: 12,
            color: '#c7d2fe',
            text: 'AWS Aurora',
            pt: [127, 143],
            align: 'left',
            width: 67
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'Database for storing relational data',
            pt: [57, 168],
            align: 'left',
            width: 208
          }
        ]
      }
    ],
    edges: [
      {
        id: 'cloud.backend.cms:amazon.rds.mysql',
        parent: null,
        source: 'cloud.backend.cms',
        target: 'amazon.rds.mysql',
        label: 'stores media',
        relations: ['3ddee07e9a95bdce31d69904e0283ead2d973a83'],
        points: [
          [642, 257],
          [642, 316],
          [642, 394],
          [642, 460],
          [642, 474]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'stores media',
            pt: [646, 324],
            align: 'left',
            width: 77
          }
        ],
        headArrow: [
          [646, 460],
          [642, 470],
          [638, 460]
        ]
      },
      {
        id: 'cloud.backend.graphql:amazon.rds.pg',
        parent: null,
        source: 'cloud.backend.graphql',
        target: 'amazon.rds.pg',
        label: 'reads and writes',
        relations: ['13cc69fddf108f3e957176614350e45b253828d2'],
        points: [
          [251, 257],
          [251, 316],
          [251, 394],
          [251, 460],
          [251, 474]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'reads and writes',
            pt: [255, 324],
            align: 'left',
            width: 98
          }
        ],
        headArrow: [
          [255, 460],
          [251, 470],
          [247, 460]
        ]
      }
    ]
  } as unknown as DiagramView,
  amazon_cognito: {
    id: 'amazon_cognito',
    viewOf: 'amazon.cognito',
    title: 'Overview Amazon Cognito',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/amazon.c4',
    rules: [
      { isInclude: true, exprs: [{ wildcard: true }, { element: 'amazon', isDescedants: false }] }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 422,
    height: 557,
    nodes: [
      {
        description: 'Cloud and managed services provider',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Amazon',
        id: 'amazon',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['amazon.cognito'],
        inEdges: ['cloud:amazon'],
        outEdges: [],
        navigateTo: 'amazon',
        position: [11, 260],
        size: { width: 400, height: 287 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'AMAZON',
            pt: [11, 16],
            align: 'left',
            width: 58
          }
        ]
      },
      {
        description:
          'Our SaaS platfrom that allows\ncustomers to interact with\nthe latest technologies',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Cloud System',
        id: 'cloud',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: ['cloud:amazon.cognito', 'cloud:amazon'],
        navigateTo: 'cloud',
        position: [50, 0],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Cloud System',
            pt: [103, 67],
            align: 'left',
            width: 117
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Our SaaS platfrom that allows',
            pt: [73, 94],
            align: 'left',
            width: 178
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'customers to interact with',
            pt: [86, 110],
            align: 'left',
            width: 152
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'the latest technologies',
            pt: [95, 126],
            align: 'left',
            width: 133
          }
        ]
      },
      {
        description: 'User management and authentication',
        technology: null,
        tags: null,
        links: null,
        kind: 'component',
        title: 'Cognito',
        id: 'amazon.cognito',
        parent: 'amazon',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud:amazon.cognito'],
        outEdges: [],
        position: [50, 327],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Cognito',
            pt: [129, 83],
            align: 'left',
            width: 65
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'User management and authentication',
            pt: [50, 110],
            align: 'left',
            width: 223
          }
        ]
      }
    ],
    edges: [
      {
        id: 'cloud:amazon.cognito',
        parent: null,
        source: 'cloud',
        target: 'amazon.cognito',
        label: 'authorizes',
        relations: [
          '4ac81247dfbcc8f8f1ebdd0b08e9654400df960c',
          'c54b72efecb59d27915c091f92cd8a3e5f58b64a',
          '7b1f109ce67c4ce864272bbe8d6a9e96a19fd75b',
          '0bcc80a47e86b46d1e379452dedccb2b6d30385e'
        ],
        points: [
          [211, 180],
          [211, 221],
          [211, 270],
          [211, 313],
          [211, 327]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'authorizes',
            pt: [215, 242],
            align: 'left',
            width: 62
          }
        ],
        headArrow: [
          [215, 312],
          [211, 323],
          [207, 312]
        ]
      }
    ]
  } as unknown as DiagramView,
  premium: {
    id: 'premium',
    viewOf: 'premium',
    title: 'Premium Customer',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/extra.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { wildcard: true },
          { element: 'cloud', isDescedants: false },
          {
            source: { element: 'premium', isDescedants: false },
            target: { element: 'cloud.ui', isDescedants: true }
          }
        ]
      }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 422,
    height: 502,
    nodes: [
      {
        description:
          'Our SaaS platfrom that allows\ncustomers to interact with\nthe latest technologies',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Cloud System',
        id: 'cloud',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'rectangle',
        children: ['cloud.ui.dashboard'],
        inEdges: [],
        outEdges: [],
        navigateTo: 'cloud',
        position: [11, 205],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'CLOUD SYSTEM',
            pt: [11, 16],
            align: 'left',
            width: 104
          }
        ]
      },
      {
        description: 'The customer of Cloud system\nwith Premium subscription',
        technology: null,
        tags: null,
        links: null,
        kind: 'actor',
        title: 'Premium Customer',
        id: 'premium',
        parent: null,
        level: 0,
        color: 'indigo',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['premium:cloud.ui.dashboard'],
        position: [50, 0],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'Premium Customer',
            pt: [81, 75],
            align: 'left',
            width: 161
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'The customer of Cloud system',
            pt: [71, 102],
            align: 'left',
            width: 181
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'with Premium subscription',
            pt: [83, 118],
            align: 'left',
            width: 156
          }
        ]
      },
      {
        description: 'Web application, that allows customers to interact with the cloud system',
        technology: 'Nextjs',
        tags: null,
        links: null,
        kind: 'app',
        title: 'Customer Dashboard',
        id: 'cloud.ui.dashboard',
        parent: 'cloud',
        level: 1,
        color: 'primary',
        shape: 'browser',
        children: [],
        inEdges: ['premium:cloud.ui.dashboard'],
        outEdges: [],
        position: [50, 271],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Customer Dashboard',
            pt: [72, 63],
            align: 'left',
            width: 178
          },
          {
            fontSize: 12,
            color: '#bfdbfe',
            text: 'Nextjs',
            pt: [144, 89],
            align: 'left',
            width: 34
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Web application, that allows customers to',
            pt: [39, 114],
            align: 'left',
            width: 246
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'interact with the cloud system',
            pt: [74, 130],
            align: 'left',
            width: 175
          }
        ]
      }
    ],
    edges: [
      {
        id: 'premium:cloud.ui.dashboard',
        parent: null,
        source: 'premium',
        target: 'cloud.ui.dashboard',
        label: null,
        relations: ['4624e5e035fb04961d01bb4c54e2db82191f6902'],
        points: [
          [211, 180],
          [211, 205],
          [211, 232],
          [211, 257],
          [211, 271]
        ],
        labels: [],
        headArrow: [
          [215, 257],
          [211, 267],
          [207, 257]
        ]
      }
    ]
  } as unknown as DiagramView,
  index: {
    id: 'index',
    title: 'Landscape',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/model.c4',
    rules: [
      { isInclude: true, exprs: [{ wildcard: true }] },
      { isInclude: false, exprs: [{ elementKind: 'themecolor', isEqual: true }] }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 471,
    height: 1042,
    nodes: [
      {
        description: 'The customer of Cloud system\nwith Premium subscription',
        technology: null,
        tags: null,
        links: null,
        kind: 'actor',
        title: 'Premium Customer',
        id: 'premium',
        parent: null,
        level: 0,
        color: 'indigo',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['premium:cloud'],
        navigateTo: 'premium',
        position: [150, 0],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'Premium Customer',
            pt: [81, 75],
            align: 'left',
            width: 161
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'The customer of Cloud system',
            pt: [71, 102],
            align: 'left',
            width: 181
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'with Premium subscription',
            pt: [83, 118],
            align: 'left',
            width: 156
          }
        ]
      },
      {
        description:
          'Our SaaS platfrom that allows\ncustomers to interact with\nthe latest technologies',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Cloud System',
        id: 'cloud',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: ['customer:cloud', 'premium:cloud'],
        outEdges: ['cloud:amazon'],
        navigateTo: 'cloud',
        position: [150, 272],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Cloud System',
            pt: [103, 67],
            align: 'left',
            width: 117
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Our SaaS platfrom that allows',
            pt: [73, 94],
            align: 'left',
            width: 178
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'customers to interact with',
            pt: [86, 110],
            align: 'left',
            width: 152
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'the latest technologies',
            pt: [95, 126],
            align: 'left',
            width: 133
          }
        ]
      },
      {
        description: 'Cloud and managed services provider',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Amazon',
        id: 'amazon',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud:amazon'],
        outEdges: ['amazon:customer'],
        navigateTo: 'amazon',
        position: [-1, 567],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Amazon',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e5e5e5',
            text: 'Cloud and managed services provider',
            pt: [49, 110],
            align: 'left',
            width: 225
          }
        ]
      },
      {
        description: 'The regular customer of the system',
        technology: null,
        tags: null,
        links: null,
        kind: 'actor',
        title: 'Cloud System Customer',
        id: 'customer',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'person',
        children: [],
        inEdges: ['amazon:customer'],
        outEdges: ['customer:cloud'],
        navigateTo: 'customer',
        position: [150, 862],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Cloud System Customer',
            pt: [60, 83],
            align: 'left',
            width: 203
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The regular customer of the system',
            pt: [56, 110],
            align: 'left',
            width: 210
          }
        ]
      }
    ],
    edges: [
      {
        id: 'cloud:amazon',
        parent: null,
        source: 'cloud',
        target: 'amazon',
        label: 'hosted on',
        relations: [
          'b077ae4dc2ddb9150ea06e00845248e62d853b55',
          '4ac81247dfbcc8f8f1ebdd0b08e9654400df960c',
          'a62dc74776021465c85ea4f3d873adacf31aa64b',
          'c54b72efecb59d27915c091f92cd8a3e5f58b64a',
          '7b1f109ce67c4ce864272bbe8d6a9e96a19fd75b',
          '0bcc80a47e86b46d1e379452dedccb2b6d30385e',
          '13cc69fddf108f3e957176614350e45b253828d2',
          '3ddee07e9a95bdce31d69904e0283ead2d973a83'
        ],
        points: [
          [266, 452],
          [249, 484],
          [230, 521],
          [213, 554],
          [206, 567]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'hosted on',
            pt: [244, 514],
            align: 'left',
            width: 59
          }
        ],
        headArrow: [
          [216, 556],
          [208, 564],
          [210, 552]
        ]
      },
      {
        id: 'customer:cloud',
        parent: null,
        source: 'customer',
        target: 'cloud',
        label: 'uses and pays',
        relations: [
          'dd2da498a2dcdd08b69dbd271faa7ae3d454217c',
          '363b63a37194ffc0ea5c41c7710e940f9778aa1e',
          '791b3be30c97c63eb23625459513c0016f4200b3'
        ],
        points: [
          [333, 862],
          [336, 847],
          [340, 831],
          [343, 816],
          [367, 708],
          [369, 677],
          [356, 567],
          [353, 534],
          [346, 498],
          [339, 466],
          [335, 452]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'uses and pays',
            pt: [368, 661],
            align: 'left',
            width: 86
          }
        ],
        headArrow: [
          [335, 467],
          [336, 456],
          [342, 466]
        ]
      },
      {
        id: 'premium:cloud',
        parent: null,
        source: 'premium',
        target: 'cloud',
        label: null,
        relations: ['4624e5e035fb04961d01bb4c54e2db82191f6902'],
        points: [
          [311, 180],
          [311, 205],
          [311, 232],
          [311, 258],
          [311, 273]
        ],
        labels: [],
        headArrow: [
          [315, 258],
          [311, 269],
          [307, 258]
        ]
      },
      {
        id: 'amazon:customer',
        parent: null,
        source: 'amazon',
        target: 'customer',
        label: 'sends emails',
        relations: ['5ec3d79811ace2e0b99bb5ca451d1fbc0331a2ab'],
        points: [
          [206, 747],
          [223, 779],
          [242, 816],
          [259, 849],
          [265, 862]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'sends emails',
            pt: [244, 808],
            align: 'left',
            width: 78
          }
        ],
        headArrow: [
          [262, 847],
          [264, 858],
          [255, 851]
        ]
      }
    ]
  } as unknown as DiagramView,
  customer: {
    id: 'customer',
    viewOf: 'customer',
    title: 'Overview Customer',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/model.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { wildcard: true },
          { incoming: { element: 'cloud.ui', isDescedants: true } },
          { incoming: { element: 'cloud.backend', isDescedants: false } }
        ]
      },
      { isInclude: false, exprs: [{ element: 'amazon', isDescedants: false }] }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 812,
    height: 852,
    nodes: [
      {
        description:
          'Our SaaS platfrom that allows\ncustomers to interact with\nthe latest technologies',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Cloud System',
        id: 'cloud',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'rectangle',
        children: ['cloud.ui.dashboard', 'cloud.ui.mobile', 'cloud.backend'],
        inEdges: ['customer:cloud'],
        outEdges: [],
        navigateTo: 'cloud',
        position: [11, 260],
        size: { width: 791, height: 581 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'CLOUD SYSTEM',
            pt: [11, 16],
            align: 'left',
            width: 104
          }
        ]
      },
      {
        description: 'The regular customer of the system',
        technology: null,
        tags: null,
        links: null,
        kind: 'actor',
        title: 'Cloud System Customer',
        id: 'customer',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['customer:cloud.ui.mobile', 'customer:cloud.ui.dashboard', 'customer:cloud'],
        position: [245, 0],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Cloud System Customer',
            pt: [60, 83],
            align: 'left',
            width: 203
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The regular customer of the system',
            pt: [56, 110],
            align: 'left',
            width: 210
          }
        ]
      },
      {
        description: 'Web application, that allows customers to interact with the cloud system',
        technology: 'Nextjs',
        tags: null,
        links: null,
        kind: 'app',
        title: 'Customer Dashboard',
        id: 'cloud.ui.dashboard',
        parent: 'cloud',
        level: 1,
        color: 'primary',
        shape: 'browser',
        children: [],
        inEdges: ['customer:cloud.ui.dashboard'],
        outEdges: ['cloud.ui.dashboard:cloud.backend'],
        position: [50, 327],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Customer Dashboard',
            pt: [72, 63],
            align: 'left',
            width: 178
          },
          {
            fontSize: 12,
            color: '#bfdbfe',
            text: 'Nextjs',
            pt: [144, 89],
            align: 'left',
            width: 34
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Web application, that allows customers to',
            pt: [39, 113],
            align: 'left',
            width: 246
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'interact with the cloud system',
            pt: [74, 129],
            align: 'left',
            width: 175
          }
        ]
      },
      {
        description: 'The mobile app of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobileApp',
        title: 'Mobile App',
        id: 'cloud.ui.mobile',
        parent: 'cloud',
        level: 1,
        color: 'primary',
        shape: 'mobile',
        children: [],
        inEdges: ['customer:cloud.ui.mobile'],
        outEdges: ['cloud.ui.mobile:cloud.backend'],
        position: [441, 327],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Mobile App',
            pt: [114, 83],
            align: 'left',
            width: 94
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The mobile app of the cloud system',
            pt: [56, 110],
            align: 'left',
            width: 211
          }
        ]
      },
      {
        description: 'The backend services of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Backend',
        id: 'cloud.backend',
        parent: 'cloud',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.ui.mobile:cloud.backend', 'cloud.ui.dashboard:cloud.backend'],
        outEdges: [],
        navigateTo: 'cloud_backend',
        position: [193, 621],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Backend',
            pt: [125, 83],
            align: 'left',
            width: 73
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The backend services of the cloud system',
            pt: [37, 110],
            align: 'left',
            width: 249
          }
        ]
      }
    ],
    edges: [
      {
        id: 'cloud.ui.mobile:cloud.backend',
        parent: 'cloud',
        source: 'cloud.ui.mobile',
        target: 'cloud.backend',
        label: 'fetches data',
        relations: ['da1b28f486d0855418c074d53eb544ddc46cf7d3'],
        points: [
          [527, 506],
          [499, 539],
          [467, 577],
          [438, 611],
          [429, 621]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'fetches data',
            pt: [488, 568],
            align: 'left',
            width: 73
          }
        ],
        headArrow: [
          [441, 613],
          [432, 618],
          [436, 608]
        ]
      },
      {
        id: 'cloud.ui.dashboard:cloud.backend',
        parent: 'cloud',
        source: 'cloud.ui.dashboard',
        target: 'cloud.backend',
        label: 'fetches xcgdata',
        relations: ['073eab1dcfb691af8f308326d5616c199c2a19b4'],
        points: [
          [254, 506],
          [270, 539],
          [288, 575],
          [304, 608],
          [311, 621]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'fetches xcgdata',
            pt: [291, 568],
            align: 'left',
            width: 94
          }
        ],
        headArrow: [
          [307, 607],
          [309, 618],
          [301, 610]
        ]
      },
      {
        id: 'customer:cloud.ui.mobile',
        parent: null,
        source: 'customer',
        target: 'cloud.ui.mobile',
        label: 'opens on mobile device',
        relations: ['791b3be30c97c63eb23625459513c0016f4200b3'],
        points: [
          [459, 180],
          [485, 222],
          [515, 272],
          [541, 315],
          [548, 327]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'opens on mobile device',
            pt: [502, 242],
            align: 'left',
            width: 141
          }
        ],
        headArrow: [
          [544, 313],
          [546, 324],
          [538, 316]
        ]
      },
      {
        id: 'customer:cloud.ui.dashboard',
        parent: null,
        source: 'customer',
        target: 'cloud.ui.dashboard',
        label: 'opens in browser',
        relations: ['363b63a37194ffc0ea5c41c7710e940f9778aa1e'],
        points: [
          [353, 180],
          [328, 222],
          [298, 272],
          [272, 315],
          [264, 327]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'opens in browser',
            pt: [324, 242],
            align: 'left',
            width: 102
          }
        ],
        headArrow: [
          [275, 316],
          [266, 324],
          [269, 313]
        ]
      }
    ]
  } as unknown as DiagramView,
  cloud: {
    id: 'cloud',
    viewOf: 'cloud',
    title: 'Overview Cloud System',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/model.c4',
    rules: [{ isInclude: true, exprs: [{ wildcard: true }] }],
    relativePath: '',
    autoLayout: 'TB',
    width: 711,
    height: 1101,
    nodes: [
      {
        description:
          'Our SaaS platfrom that allows\ncustomers to interact with\nthe latest technologies',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Cloud System',
        id: 'cloud',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'rectangle',
        children: ['cloud.ui', 'cloud.backend'],
        inEdges: ['customer:cloud'],
        outEdges: ['cloud:amazon'],
        position: [155, 260],
        size: { width: 400, height: 581 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'CLOUD SYSTEM',
            pt: [11, 16],
            align: 'left',
            width: 104
          }
        ]
      },
      {
        description: 'The customer of Cloud system\nwith Premium subscription',
        technology: null,
        tags: null,
        links: null,
        kind: 'actor',
        title: 'Premium Customer',
        id: 'premium',
        parent: null,
        level: 0,
        color: 'indigo',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['premium:cloud.ui'],
        navigateTo: 'premium',
        position: [-1, 0],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'Premium Customer',
            pt: [81, 75],
            align: 'left',
            width: 161
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'The customer of Cloud system',
            pt: [71, 102],
            align: 'left',
            width: 181
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'with Premium subscription',
            pt: [84, 118],
            align: 'left',
            width: 156
          }
        ]
      },
      {
        description: 'The regular customer of the system',
        technology: null,
        tags: null,
        links: null,
        kind: 'actor',
        title: 'Cloud System Customer',
        id: 'customer',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['customer:cloud.ui', 'customer:cloud'],
        navigateTo: 'customer',
        position: [390, 0],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Cloud System Customer',
            pt: [60, 83],
            align: 'left',
            width: 203
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The regular customer of the system',
            pt: [56, 110],
            align: 'left',
            width: 210
          }
        ]
      },
      {
        description: 'All the frontend applications of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Frontend',
        id: 'cloud.ui',
        parent: 'cloud',
        level: 1,
        color: 'primary',
        shape: 'browser',
        children: [],
        inEdges: ['customer:cloud.ui', 'premium:cloud.ui'],
        outEdges: ['cloud.ui:cloud.backend', 'cloud.ui:amazon'],
        navigateTo: 'cloud_ui',
        position: [194, 327],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Frontend',
            pt: [124, 75],
            align: 'left',
            width: 75
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'All the frontend applications of the cloud',
            pt: [43, 102],
            align: 'left',
            width: 237
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'system',
            pt: [140, 118],
            align: 'left',
            width: 43
          }
        ]
      },
      {
        description: 'The backend services of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Backend',
        id: 'cloud.backend',
        parent: 'cloud',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.ui:cloud.backend'],
        outEdges: ['cloud.backend:amazon'],
        navigateTo: 'cloud_backend',
        position: [194, 621],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Backend',
            pt: [125, 83],
            align: 'left',
            width: 73
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The backend services of the cloud system',
            pt: [37, 110],
            align: 'left',
            width: 249
          }
        ]
      },
      {
        description: 'Cloud and managed services provider',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Amazon',
        id: 'amazon',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.backend:amazon', 'cloud.ui:amazon', 'cloud:amazon'],
        outEdges: [],
        navigateTo: 'amazon',
        position: [345, 921],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Amazon',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e5e5e5',
            text: 'Cloud and managed services provider',
            pt: [49, 110],
            align: 'left',
            width: 225
          }
        ]
      }
    ],
    edges: [
      {
        id: 'cloud.ui:cloud.backend',
        parent: 'cloud',
        source: 'cloud.ui',
        target: 'cloud.backend',
        label: 'fetches xcgdata',
        relations: [
          '073eab1dcfb691af8f308326d5616c199c2a19b4',
          'da1b28f486d0855418c074d53eb544ddc46cf7d3'
        ],
        points: [
          [355, 506],
          [355, 538],
          [355, 574],
          [355, 607],
          [355, 621]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'fetches xcgdata',
            pt: [359, 568],
            align: 'left',
            width: 94
          }
        ],
        headArrow: [
          [359, 607],
          [355, 617],
          [351, 607]
        ]
      },
      {
        id: 'cloud.backend:amazon',
        parent: null,
        source: 'cloud.backend',
        target: 'amazon',
        label: 'authorizes',
        relations: [
          '4ac81247dfbcc8f8f1ebdd0b08e9654400df960c',
          'a62dc74776021465c85ea4f3d873adacf31aa64b',
          'c54b72efecb59d27915c091f92cd8a3e5f58b64a',
          '13cc69fddf108f3e957176614350e45b253828d2',
          '3ddee07e9a95bdce31d69904e0283ead2d973a83'
        ],
        points: [
          [400, 801],
          [417, 835],
          [437, 874],
          [455, 909],
          [461, 922]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'authorizes',
            pt: [439, 868],
            align: 'left',
            width: 62
          }
        ],
        headArrow: [
          [458, 907],
          [459, 918],
          [451, 910]
        ]
      },
      {
        id: 'cloud.ui:amazon',
        parent: null,
        source: 'cloud.ui',
        target: 'amazon',
        label: 'authenticates',
        relations: [
          '7b1f109ce67c4ce864272bbe8d6a9e96a19fd75b',
          '0bcc80a47e86b46d1e379452dedccb2b6d30385e'
        ],
        points: [
          [469, 506],
          [502, 539],
          [534, 578],
          [551, 621],
          [588, 714],
          [568, 827],
          [544, 908],
          [540, 922]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'authenticates',
            pt: [575, 715],
            align: 'left',
            width: 80
          }
        ],
        headArrow: [
          [548, 909],
          [541, 918],
          [541, 906]
        ]
      },
      {
        id: 'customer:cloud.ui',
        parent: null,
        source: 'customer',
        target: 'cloud.ui',
        label: 'opens in browser',
        relations: [
          '363b63a37194ffc0ea5c41c7710e940f9778aa1e',
          '791b3be30c97c63eb23625459513c0016f4200b3'
        ],
        points: [
          [498, 180],
          [472, 222],
          [442, 272],
          [416, 315],
          [409, 327]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'opens in browser',
            pt: [470, 242],
            align: 'left',
            width: 102
          }
        ],
        headArrow: [
          [419, 316],
          [411, 324],
          [413, 313]
        ]
      },
      {
        id: 'premium:cloud.ui',
        parent: null,
        source: 'premium',
        target: 'cloud.ui',
        label: null,
        relations: ['4624e5e035fb04961d01bb4c54e2db82191f6902'],
        points: [
          [214, 180],
          [239, 222],
          [269, 272],
          [294, 315],
          [302, 327]
        ],
        labels: [],
        headArrow: [
          [298, 313],
          [300, 324],
          [291, 316]
        ]
      }
    ]
  } as unknown as DiagramView,
  cloud_ui: {
    id: 'cloud_ui',
    viewOf: 'cloud.ui',
    title: 'Overview UI',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/model.c4',
    rules: [{ isInclude: true, exprs: [{ wildcard: true }] }],
    relativePath: '',
    autoLayout: 'TB',
    width: 812,
    height: 807,
    nodes: [
      {
        description: 'All the frontend applications of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Frontend',
        id: 'cloud.ui',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'browser',
        children: ['cloud.ui.dashboard', 'cloud.ui.mobile'],
        inEdges: [],
        outEdges: [],
        position: [11, 260],
        size: { width: 791, height: 287 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'FRONTEND',
            pt: [11, 16],
            align: 'left',
            width: 73
          }
        ]
      },
      {
        description: 'The customer of Cloud system\nwith Premium subscription',
        technology: null,
        tags: null,
        links: null,
        kind: 'actor',
        title: 'Premium Customer',
        id: 'premium',
        parent: null,
        level: 0,
        color: 'indigo',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['premium:cloud.ui.dashboard'],
        navigateTo: 'premium',
        position: [50, 0],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'Premium Customer',
            pt: [81, 75],
            align: 'left',
            width: 161
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'The customer of Cloud system',
            pt: [71, 102],
            align: 'left',
            width: 181
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'with Premium subscription',
            pt: [83, 118],
            align: 'left',
            width: 156
          }
        ]
      },
      {
        description: 'The regular customer of the system',
        technology: null,
        tags: null,
        links: null,
        kind: 'actor',
        title: 'Cloud System Customer',
        id: 'customer',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['customer:cloud.ui.mobile', 'customer:cloud.ui.dashboard'],
        navigateTo: 'customer',
        position: [441, 0],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Cloud System Customer',
            pt: [60, 83],
            align: 'left',
            width: 203
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The regular customer of the system',
            pt: [56, 110],
            align: 'left',
            width: 210
          }
        ]
      },
      {
        description: 'Web application, that allows customers to interact with the cloud system',
        technology: 'Nextjs',
        tags: null,
        links: null,
        kind: 'app',
        title: 'Customer Dashboard',
        id: 'cloud.ui.dashboard',
        parent: 'cloud.ui',
        level: 1,
        color: 'primary',
        shape: 'browser',
        children: [],
        inEdges: ['customer:cloud.ui.dashboard', 'premium:cloud.ui.dashboard'],
        outEdges: ['cloud.ui.dashboard:cloud.backend', 'cloud.ui.dashboard:amazon'],
        position: [50, 327],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Customer Dashboard',
            pt: [72, 63],
            align: 'left',
            width: 178
          },
          {
            fontSize: 12,
            color: '#bfdbfe',
            text: 'Nextjs',
            pt: [144, 89],
            align: 'left',
            width: 34
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Web application, that allows customers to',
            pt: [39, 113],
            align: 'left',
            width: 246
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'interact with the cloud system',
            pt: [74, 129],
            align: 'left',
            width: 175
          }
        ]
      },
      {
        description: 'The mobile app of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobileApp',
        title: 'Mobile App',
        id: 'cloud.ui.mobile',
        parent: 'cloud.ui',
        level: 1,
        color: 'primary',
        shape: 'mobile',
        children: [],
        inEdges: ['customer:cloud.ui.mobile'],
        outEdges: ['cloud.ui.mobile:cloud.backend', 'cloud.ui.mobile:amazon'],
        position: [441, 327],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Mobile App',
            pt: [114, 83],
            align: 'left',
            width: 94
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The mobile app of the cloud system',
            pt: [56, 110],
            align: 'left',
            width: 211
          }
        ]
      },
      {
        description: 'Cloud and managed services provider',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Amazon',
        id: 'amazon',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.ui.mobile:amazon', 'cloud.ui.dashboard:amazon'],
        outEdges: [],
        navigateTo: 'amazon',
        position: [50, 627],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Amazon',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e5e5e5',
            text: 'Cloud and managed services provider',
            pt: [49, 110],
            align: 'left',
            width: 225
          }
        ]
      },
      {
        description: 'The backend services of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Backend',
        id: 'cloud.backend',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.ui.mobile:cloud.backend', 'cloud.ui.dashboard:cloud.backend'],
        outEdges: [],
        navigateTo: 'cloud_backend',
        position: [470, 627],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Backend',
            pt: [125, 83],
            align: 'left',
            width: 73
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The backend services of the cloud system',
            pt: [37, 110],
            align: 'left',
            width: 249
          }
        ]
      }
    ],
    edges: [
      {
        id: 'cloud.ui.mobile:cloud.backend',
        parent: null,
        source: 'cloud.ui.mobile',
        target: 'cloud.backend',
        label: 'fetches data',
        relations: ['da1b28f486d0855418c074d53eb544ddc46cf7d3'],
        points: [
          [611, 506],
          [614, 540],
          [618, 578],
          [621, 612],
          [622, 627]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'fetches data',
            pt: [620, 573],
            align: 'left',
            width: 73
          }
        ],
        headArrow: [
          [625, 612],
          [622, 623],
          [617, 613]
        ]
      },
      {
        id: 'cloud.ui.dashboard:cloud.backend',
        parent: null,
        source: 'cloud.ui.dashboard',
        target: 'cloud.backend',
        label: 'fetches xcgdata',
        relations: ['073eab1dcfb691af8f308326d5616c199c2a19b4'],
        points: [
          [246, 506],
          [260, 533],
          [279, 561],
          [302, 581],
          [305, 585],
          [380, 615],
          [458, 646],
          [472, 652]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'fetches xcgdata',
            pt: [306, 573],
            align: 'left',
            width: 94
          }
        ],
        headArrow: [
          [459, 643],
          [468, 650],
          [457, 650]
        ]
      },
      {
        id: 'cloud.ui.mobile:amazon',
        parent: null,
        source: 'cloud.ui.mobile',
        target: 'amazon',
        label: 'authenticates',
        relations: ['0bcc80a47e86b46d1e379452dedccb2b6d30385e'],
        points: [
          [509, 507],
          [482, 532],
          [450, 559],
          [420, 581],
          [404, 594],
          [386, 607],
          [368, 619],
          [356, 627]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'authenticates',
            pt: [451, 573],
            align: 'left',
            width: 80
          }
        ],
        headArrow: [
          [371, 622],
          [360, 625],
          [366, 616]
        ]
      },
      {
        id: 'cloud.ui.dashboard:amazon',
        parent: null,
        source: 'cloud.ui.dashboard',
        target: 'amazon',
        label: 'authenticates',
        relations: ['7b1f109ce67c4ce864272bbe8d6a9e96a19fd75b'],
        points: [
          [151, 507],
          [142, 530],
          [136, 556],
          [143, 581],
          [145, 592],
          [149, 603],
          [153, 614],
          [159, 627]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'authenticates',
            pt: [147, 573],
            align: 'left',
            width: 80
          }
        ],
        headArrow: [
          [156, 612],
          [157, 623],
          [149, 615]
        ]
      },
      {
        id: 'customer:cloud.ui.mobile',
        parent: null,
        source: 'customer',
        target: 'cloud.ui.mobile',
        label: 'opens on mobile device',
        relations: ['791b3be30c97c63eb23625459513c0016f4200b3'],
        points: [
          [602, 180],
          [602, 221],
          [602, 270],
          [602, 313],
          [602, 327]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'opens on mobile device',
            pt: [606, 242],
            align: 'left',
            width: 141
          }
        ],
        headArrow: [
          [606, 312],
          [602, 323],
          [598, 312]
        ]
      },
      {
        id: 'customer:cloud.ui.dashboard',
        parent: null,
        source: 'customer',
        target: 'cloud.ui.dashboard',
        label: 'opens in browser',
        relations: ['363b63a37194ffc0ea5c41c7710e940f9778aa1e'],
        points: [
          [495, 180],
          [444, 223],
          [382, 274],
          [329, 318],
          [318, 327]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'opens in browser',
            pt: [435, 242],
            align: 'left',
            width: 102
          }
        ],
        headArrow: [
          [332, 320],
          [321, 324],
          [327, 315]
        ]
      },
      {
        id: 'premium:cloud.ui.dashboard',
        parent: null,
        source: 'premium',
        target: 'cloud.ui.dashboard',
        label: null,
        relations: ['4624e5e035fb04961d01bb4c54e2db82191f6902'],
        points: [
          [211, 180],
          [211, 221],
          [211, 270],
          [211, 313],
          [211, 327]
        ],
        labels: [],
        headArrow: [
          [215, 312],
          [211, 323],
          [207, 312]
        ]
      }
    ]
  } as unknown as DiagramView,
  cloud_backend: {
    id: 'cloud_backend',
    viewOf: 'cloud.backend',
    title: 'Overview Backend',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/model.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'cloud.ui', isDescedants: false },
          { element: 'amazon', isDescedants: false },
          { element: 'cloud.backend', isDescedants: false },
          { element: 'cloud', isDescedants: false },
          {
            source: { element: 'cloud.ui', isDescedants: true },
            target: { element: 'cloud.backend', isDescedants: false }
          },
          {
            source: { element: 'cloud.backend', isDescedants: true },
            target: { element: 'amazon', isDescedants: true }
          }
        ]
      },
      {
        isInclude: false,
        exprs: [
          {
            source: { element: 'cloud.ui', isDescedants: false },
            target: { element: 'amazon', isDescedants: false }
          }
        ]
      },
      { targets: [{ wildcard: true }], style: { color: 'muted' } },
      {
        targets: [
          { element: 'cloud.ui', isDescedants: true },
          { element: 'amazon', isDescedants: true }
        ],
        style: { color: 'secondary' }
      },
      {
        targets: [
          { element: 'cloud.backend', isDescedants: false },
          { element: 'cloud.backend', isDescedants: true }
        ],
        style: { color: 'primary' }
      }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 1243,
    height: 1097,
    nodes: [
      {
        description:
          'Our SaaS platfrom that allows\ncustomers to interact with\nthe latest technologies',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Cloud System',
        id: 'cloud',
        parent: null,
        level: 0,
        color: 'muted',
        shape: 'rectangle',
        children: ['cloud.ui', 'cloud.backend'],
        inEdges: [],
        outEdges: ['cloud:amazon'],
        navigateTo: 'cloud',
        position: [11, 11],
        size: { width: 871, height: 724 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'CLOUD SYSTEM',
            pt: [11, 16],
            align: 'left',
            width: 104
          }
        ]
      },
      {
        description: 'All the frontend applications of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Frontend',
        id: 'cloud.ui',
        parent: 'cloud',
        level: 1,
        color: 'muted',
        shape: 'browser',
        children: ['cloud.ui.dashboard', 'cloud.ui.mobile'],
        inEdges: [],
        outEdges: [],
        navigateTo: 'cloud_ui',
        position: [51, 77],
        size: { width: 791, height: 287 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'FRONTEND',
            pt: [11, 16],
            align: 'left',
            width: 73
          }
        ]
      },
      {
        description: 'The backend services of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Backend',
        id: 'cloud.backend',
        parent: 'cloud',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: ['cloud.backend.cms', 'cloud.backend.graphql'],
        inEdges: [],
        outEdges: [],
        position: [51, 409],
        size: { width: 791, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'BACKEND',
            pt: [11, 16],
            align: 'left',
            width: 65
          }
        ]
      },
      {
        description: 'Cloud and managed services provider',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Amazon',
        id: 'amazon',
        parent: null,
        level: 0,
        color: 'muted',
        shape: 'rectangle',
        children: ['amazon.cognito', 'amazon.ses', 'amazon.rds'],
        inEdges: ['cloud:amazon'],
        outEdges: [],
        navigateTo: 'amazon',
        position: [51, 781],
        size: { width: 1181, height: 305 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'AMAZON',
            pt: [11, 15],
            align: 'left',
            width: 58
          }
        ]
      },
      {
        description: 'The CMS of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'app',
        title: 'CMS',
        id: 'cloud.backend.cms',
        parent: 'cloud.backend',
        level: 2,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: ['cloud.backend.cms:amazon.rds'],
        navigateTo: 'cloud_cms',
        position: [90, 475],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#eff6ff', text: 'CMS', pt: [140, 83], align: 'left', width: 42 },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The CMS of the cloud system',
            pt: [74, 110],
            align: 'left',
            width: 175
          }
        ]
      },
      {
        description: 'Web application, that allows customers to interact with the cloud system',
        technology: 'Nextjs',
        tags: null,
        links: null,
        kind: 'app',
        title: 'Customer Dashboard',
        id: 'cloud.ui.dashboard',
        parent: 'cloud.ui',
        level: 2,
        color: 'secondary',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['cloud.ui.dashboard:cloud.backend.graphql'],
        position: [90, 144],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Customer Dashboard',
            pt: [72, 63],
            align: 'left',
            width: 178
          },
          {
            fontSize: 12,
            color: '#e0f2fe',
            text: 'Nextjs',
            pt: [144, 88],
            align: 'left',
            width: 34
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Web application, that allows customers to',
            pt: [39, 113],
            align: 'left',
            width: 246
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'interact with the cloud system',
            pt: [74, 129],
            align: 'left',
            width: 175
          }
        ]
      },
      {
        description: 'The mobile app of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobileApp',
        title: 'Mobile App',
        id: 'cloud.ui.mobile',
        parent: 'cloud.ui',
        level: 2,
        color: 'secondary',
        shape: 'mobile',
        children: [],
        inEdges: [],
        outEdges: ['cloud.ui.mobile:cloud.backend.graphql'],
        position: [481, 144],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Mobile App',
            pt: [114, 83],
            align: 'left',
            width: 94
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'The mobile app of the cloud system',
            pt: [56, 110],
            align: 'left',
            width: 211
          }
        ]
      },
      {
        description: 'The GraphQL API of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'app',
        title: 'GraphQL API',
        id: 'cloud.backend.graphql',
        parent: 'cloud.backend',
        level: 2,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: [
          'cloud.ui.mobile:cloud.backend.graphql',
          'cloud.ui.dashboard:cloud.backend.graphql'
        ],
        outEdges: [
          'cloud.backend.graphql:amazon.rds',
          'cloud.backend.graphql:amazon.ses',
          'cloud.backend.graphql:amazon.cognito'
        ],
        navigateTo: 'cloud_graphql',
        position: [481, 475],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'GraphQL API',
            pt: [105, 83],
            align: 'left',
            width: 113
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The GraphQL API of the cloud system',
            pt: [48, 110],
            align: 'left',
            width: 226
          }
        ]
      },
      {
        description: 'User management and authentication',
        technology: null,
        tags: null,
        links: null,
        kind: 'component',
        title: 'Cognito',
        id: 'amazon.cognito',
        parent: 'amazon',
        level: 1,
        color: 'secondary',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.backend.graphql:amazon.cognito'],
        outEdges: [],
        navigateTo: 'amazon_cognito',
        position: [871, 857],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Cognito',
            pt: [129, 83],
            align: 'left',
            width: 65
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'User management and authentication',
            pt: [50, 110],
            align: 'left',
            width: 223
          }
        ]
      },
      {
        description: 'Email sending',
        technology: null,
        tags: null,
        links: null,
        kind: 'component',
        title: 'SES',
        id: 'amazon.ses',
        parent: 'amazon',
        level: 1,
        color: 'secondary',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.backend.graphql:amazon.ses'],
        outEdges: [],
        position: [481, 857],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#f0f9ff', text: 'SES', pt: [142, 83], align: 'left', width: 38 },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Email sending',
            pt: [119, 110],
            align: 'left',
            width: 84
          }
        ]
      },
      {
        description: 'Relational Databases',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'RDS',
        icon: 'https://icons.terrastruct.com/aws%2FDatabase%2FAmazon-RDS_Amazon-RDS_instance_light-bg.svg',
        id: 'amazon.rds',
        parent: 'amazon',
        level: 1,
        color: 'secondary',
        shape: 'cylinder',
        children: [],
        inEdges: ['cloud.backend.cms:amazon.rds', 'cloud.backend.graphql:amazon.rds'],
        outEdges: [],
        navigateTo: 'amazon_rds',
        position: [90, 847],
        size: { width: 321, height: 200 },
        labels: [
          { fontSize: 19, color: '#f0f9ff', text: 'RDS', pt: [141, 112], align: 'left', width: 40 },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Relational Databases',
            pt: [98, 139],
            align: 'left',
            width: 127
          }
        ]
      }
    ],
    edges: [
      {
        id: 'cloud.ui.mobile:cloud.backend.graphql',
        parent: 'cloud',
        source: 'cloud.ui.mobile',
        target: 'cloud.backend.graphql',
        label: 'fetches data',
        relations: ['da1b28f486d0855418c074d53eb544ddc46cf7d3'],
        points: [
          [642, 324],
          [642, 366],
          [642, 417],
          [642, 461],
          [642, 476]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'fetches data',
            pt: [646, 390],
            align: 'left',
            width: 73
          }
        ],
        headArrow: [
          [646, 461],
          [642, 472],
          [638, 461]
        ]
      },
      {
        id: 'cloud.ui.dashboard:cloud.backend.graphql',
        parent: 'cloud',
        source: 'cloud.ui.dashboard',
        target: 'cloud.backend.graphql',
        label: 'fetches xcgdata',
        relations: ['073eab1dcfb691af8f308326d5616c199c2a19b4'],
        points: [
          [356, 324],
          [409, 368],
          [472, 421],
          [526, 466],
          [537, 476]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'fetches xcgdata',
            pt: [438, 390],
            align: 'left',
            width: 94
          }
        ],
        headArrow: [
          [528, 463],
          [534, 473],
          [523, 469]
        ]
      },
      {
        id: 'cloud.backend.cms:amazon.rds',
        parent: null,
        source: 'cloud.backend.cms',
        target: 'amazon.rds',
        label: 'stores media',
        relations: ['3ddee07e9a95bdce31d69904e0283ead2d973a83'],
        points: [
          [251, 655],
          [251, 708],
          [251, 775],
          [251, 831],
          [251, 846]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'stores media',
            pt: [255, 762],
            align: 'left',
            width: 77
          }
        ],
        headArrow: [
          [255, 831],
          [251, 842],
          [247, 831]
        ]
      },
      {
        id: 'cloud.backend.graphql:amazon.rds',
        parent: null,
        source: 'cloud.backend.graphql',
        target: 'amazon.rds',
        label: 'reads and writes',
        relations: ['13cc69fddf108f3e957176614350e45b253828d2'],
        points: [
          [551, 655],
          [495, 709],
          [422, 780],
          [363, 837],
          [352, 847]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'reads and writes',
            pt: [450, 762],
            align: 'left',
            width: 98
          }
        ],
        headArrow: [
          [366, 840],
          [355, 844],
          [360, 834]
        ]
      },
      {
        id: 'cloud.backend.graphql:amazon.ses',
        parent: null,
        source: 'cloud.backend.graphql',
        target: 'amazon.ses',
        label: 'schedule emails',
        relations: ['a62dc74776021465c85ea4f3d873adacf31aa64b'],
        points: [
          [642, 655],
          [642, 711],
          [642, 784],
          [642, 842],
          [642, 857]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'schedule emails',
            pt: [646, 762],
            align: 'left',
            width: 96
          }
        ],
        headArrow: [
          [646, 842],
          [642, 853],
          [638, 842]
        ]
      },
      {
        id: 'cloud.backend.graphql:amazon.cognito',
        parent: null,
        source: 'cloud.backend.graphql',
        target: 'amazon.cognito',
        label: 'authorizes',
        relations: [
          '4ac81247dfbcc8f8f1ebdd0b08e9654400df960c',
          'c54b72efecb59d27915c091f92cd8a3e5f58b64a'
        ],
        points: [
          [733, 655],
          [792, 712],
          [870, 787],
          [931, 847],
          [941, 857]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'authorizes',
            pt: [852, 762],
            align: 'left',
            width: 62
          }
        ],
        headArrow: [
          [933, 844],
          [938, 854],
          [928, 849]
        ]
      }
    ]
  } as unknown as DiagramView,
  cloud_graphql: {
    id: 'cloud_graphql',
    viewOf: 'cloud.backend.graphql',
    title: 'GraphQL API',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/model.c4',
    rules: [
      {
        isInclude: true,
        exprs: [{ wildcard: true }, { element: 'cloud.backend', isDescedants: false }]
      },
      { isInclude: false, exprs: [{ incoming: { element: 'amazon', isDescedants: false } }] },
      {
        isInclude: true,
        exprs: [
          {
            source: { element: 'cloud.backend.graphql', isDescedants: false },
            target: { element: 'amazon', isDescedants: false }
          }
        ]
      }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 771,
    height: 852,
    nodes: [
      {
        description: 'The backend services of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Backend',
        id: 'cloud.backend',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'rectangle',
        children: ['cloud.backend.graphql', 'cloud.backend.cms'],
        inEdges: [],
        outEdges: [],
        navigateTo: 'cloud_backend',
        position: [11, 260],
        size: { width: 400, height: 581 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'BACKEND',
            pt: [11, 16],
            align: 'left',
            width: 65
          }
        ]
      },
      {
        description: 'All the frontend applications of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Frontend',
        id: 'cloud.ui',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['cloud.ui:cloud.backend.graphql'],
        navigateTo: 'cloud_ui',
        position: [50, 0],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Frontend',
            pt: [124, 75],
            align: 'left',
            width: 75
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'All the frontend applications of the cloud',
            pt: [43, 102],
            align: 'left',
            width: 237
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'system',
            pt: [140, 118],
            align: 'left',
            width: 43
          }
        ]
      },
      {
        description: 'The GraphQL API of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'app',
        title: 'GraphQL API',
        id: 'cloud.backend.graphql',
        parent: 'cloud.backend',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.ui:cloud.backend.graphql'],
        outEdges: ['cloud.backend.graphql:cloud.backend.cms', 'cloud.backend.graphql:amazon'],
        position: [50, 327],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'GraphQL API',
            pt: [105, 83],
            align: 'left',
            width: 113
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The GraphQL API of the cloud system',
            pt: [49, 110],
            align: 'left',
            width: 226
          }
        ]
      },
      {
        description: 'Cloud and managed services provider',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Amazon',
        id: 'amazon',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.backend.graphql:amazon'],
        outEdges: [],
        navigateTo: 'amazon',
        position: [450, 621],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Amazon',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e5e5e5',
            text: 'Cloud and managed services provider',
            pt: [49, 110],
            align: 'left',
            width: 225
          }
        ]
      },
      {
        description: 'The CMS of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'app',
        title: 'CMS',
        id: 'cloud.backend.cms',
        parent: 'cloud.backend',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.backend.graphql:cloud.backend.cms'],
        outEdges: [],
        navigateTo: 'cloud_cms',
        position: [50, 621],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#eff6ff', text: 'CMS', pt: [140, 83], align: 'left', width: 42 },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The CMS of the cloud system',
            pt: [74, 110],
            align: 'left',
            width: 175
          }
        ]
      }
    ],
    edges: [
      {
        id: 'cloud.backend.graphql:cloud.backend.cms',
        parent: 'cloud.backend',
        source: 'cloud.backend.graphql',
        target: 'cloud.backend.cms',
        label: null,
        relations: ['52b7bd4bef192dc473f62fae978c99ed40c095a0'],
        points: [
          [211, 506],
          [211, 538],
          [211, 574],
          [211, 607],
          [211, 621]
        ],
        labels: [],
        headArrow: [
          [215, 607],
          [211, 617],
          [207, 607]
        ]
      },
      {
        id: 'cloud.backend.graphql:amazon',
        parent: null,
        source: 'cloud.backend.graphql',
        target: 'amazon',
        label: 'authorizes',
        relations: [
          '4ac81247dfbcc8f8f1ebdd0b08e9654400df960c',
          'a62dc74776021465c85ea4f3d873adacf31aa64b',
          'c54b72efecb59d27915c091f92cd8a3e5f58b64a',
          '13cc69fddf108f3e957176614350e45b253828d2'
        ],
        points: [
          [332, 506],
          [378, 540],
          [431, 578],
          [478, 613],
          [490, 621]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'authorizes',
            pt: [426, 568],
            align: 'left',
            width: 62
          }
        ],
        headArrow: [
          [480, 610],
          [487, 619],
          [476, 616]
        ]
      },
      {
        id: 'cloud.ui:cloud.backend.graphql',
        parent: null,
        source: 'cloud.ui',
        target: 'cloud.backend.graphql',
        label: 'fetches xcgdata',
        relations: [
          '073eab1dcfb691af8f308326d5616c199c2a19b4',
          'da1b28f486d0855418c074d53eb544ddc46cf7d3'
        ],
        points: [
          [211, 180],
          [211, 221],
          [211, 270],
          [211, 313],
          [211, 327]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'fetches xcgdata',
            pt: [215, 242],
            align: 'left',
            width: 94
          }
        ],
        headArrow: [
          [215, 312],
          [211, 323],
          [207, 312]
        ]
      }
    ]
  } as unknown as DiagramView,
  cloud_cms: {
    id: 'cloud_cms',
    viewOf: 'cloud.backend.cms',
    title: 'CMS',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/model.c4',
    rules: [
      {
        isInclude: true,
        exprs: [{ wildcard: true }, { element: 'cloud.backend', isDescedants: false }]
      }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 522,
    height: 829,
    nodes: [
      {
        description: 'The backend services of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'container',
        title: 'Backend',
        id: 'cloud.backend',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'rectangle',
        children: ['cloud.backend.graphql', 'cloud.backend.cms'],
        inEdges: [],
        outEdges: [],
        navigateTo: 'cloud_backend',
        position: [11, 11],
        size: { width: 400, height: 558 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'BACKEND',
            pt: [11, 16],
            align: 'left',
            width: 65
          }
        ]
      },
      {
        description: 'The GraphQL API of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'app',
        title: 'GraphQL API',
        id: 'cloud.backend.graphql',
        parent: 'cloud.backend',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: ['cloud.backend.graphql:cloud.backend.cms', 'cloud.backend.graphql:amazon'],
        navigateTo: 'cloud_graphql',
        position: [50, 77],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'GraphQL API',
            pt: [105, 83],
            align: 'left',
            width: 113
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The GraphQL API of the cloud system',
            pt: [49, 110],
            align: 'left',
            width: 226
          }
        ]
      },
      {
        description: 'The CMS of the cloud system',
        technology: null,
        tags: null,
        links: null,
        kind: 'app',
        title: 'CMS',
        id: 'cloud.backend.cms',
        parent: 'cloud.backend',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.backend.graphql:cloud.backend.cms'],
        outEdges: ['cloud.backend.cms:amazon'],
        position: [50, 349],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#eff6ff', text: 'CMS', pt: [140, 83], align: 'left', width: 42 },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'The CMS of the cloud system',
            pt: [74, 110],
            align: 'left',
            width: 175
          }
        ]
      },
      {
        description: 'Cloud and managed services provider',
        technology: null,
        tags: null,
        links: null,
        kind: 'system',
        title: 'Amazon',
        id: 'amazon',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: [],
        inEdges: ['cloud.backend.cms:amazon', 'cloud.backend.graphql:amazon'],
        outEdges: [],
        navigateTo: 'amazon',
        position: [201, 649],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Amazon',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e5e5e5',
            text: 'Cloud and managed services provider',
            pt: [49, 110],
            align: 'left',
            width: 225
          }
        ]
      }
    ],
    edges: [
      {
        id: 'cloud.backend.graphql:cloud.backend.cms',
        parent: 'cloud.backend',
        source: 'cloud.backend.graphql',
        target: 'cloud.backend.cms',
        label: null,
        relations: ['52b7bd4bef192dc473f62fae978c99ed40c095a0'],
        points: [
          [211, 257],
          [211, 282],
          [211, 309],
          [211, 335],
          [211, 349]
        ],
        labels: [],
        headArrow: [
          [215, 335],
          [211, 345],
          [207, 335]
        ]
      },
      {
        id: 'cloud.backend.cms:amazon',
        parent: null,
        source: 'cloud.backend.cms',
        target: 'amazon',
        label: 'stores media',
        relations: ['3ddee07e9a95bdce31d69904e0283ead2d973a83'],
        points: [
          [256, 529],
          [273, 563],
          [293, 602],
          [311, 637],
          [317, 650]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'stores media',
            pt: [294, 596],
            align: 'left',
            width: 77
          }
        ],
        headArrow: [
          [314, 635],
          [315, 646],
          [307, 638]
        ]
      },
      {
        id: 'cloud.backend.graphql:amazon',
        parent: null,
        source: 'cloud.backend.graphql',
        target: 'amazon',
        label: 'authorizes',
        relations: [
          '4ac81247dfbcc8f8f1ebdd0b08e9654400df960c',
          'a62dc74776021465c85ea4f3d873adacf31aa64b',
          'c54b72efecb59d27915c091f92cd8a3e5f58b64a',
          '13cc69fddf108f3e957176614350e45b253828d2'
        ],
        points: [
          [338, 257],
          [366, 283],
          [392, 314],
          [407, 349],
          [447, 441],
          [426, 555],
          [401, 636],
          [397, 650]
        ],
        labels: [
          {
            fontSize: 14,
            color: '#b1b1b1',
            text: 'authorizes',
            pt: [432, 443],
            align: 'left',
            width: 62
          }
        ],
        headArrow: [
          [405, 637],
          [398, 646],
          [398, 635]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolors: {
    id: 'themecolors',
    viewOf: 'colors',
    title: 'Theme Colors',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      { isInclude: true, exprs: [{ wildcard: true }] },
      { isInclude: false, exprs: [{ element: 'compoundtest', isDescedants: false }] }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 1594,
    height: 849,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: [
          'colors.primary',
          'colors.secondary',
          'colors.muted',
          'colors.blue',
          'colors.sky',
          'colors.indigo',
          'colors.gray',
          'colors.slate',
          'colors.red',
          'colors.amber',
          'colors.green'
        ],
        inEdges: [],
        outEdges: [],
        position: [11, 11],
        size: { width: 1572, height: 828 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 16],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'PRIMARY',
        id: 'colors.primary',
        parent: 'colors',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: ['colors.primary:colors.secondary'],
        navigateTo: 'themecolor_primary',
        position: [1222, 77],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'PRIMARY',
            pt: [119, 96],
            align: 'left',
            width: 86
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'SECONDARY',
        id: 'colors.secondary',
        parent: 'colors',
        level: 1,
        color: 'secondary',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.primary:colors.secondary'],
        outEdges: ['colors.secondary:colors.muted'],
        navigateTo: 'themecolor_secondary',
        position: [1222, 348],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'SECONDARY',
            pt: [102, 96],
            align: 'left',
            width: 119
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'MUTED',
        id: 'colors.muted',
        parent: 'colors',
        level: 1,
        color: 'muted',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.secondary:colors.muted'],
        outEdges: [],
        navigateTo: 'themecolor_muted',
        position: [1222, 619],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#f8fafc', text: 'MUTED', pt: [128, 95], align: 'left', width: 67 }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'BLUE',
        id: 'colors.blue',
        parent: 'colors',
        level: 1,
        color: 'blue',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: ['colors.blue:colors.sky'],
        navigateTo: 'themecolor_blue',
        position: [831, 77],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#eff6ff', text: 'BLUE', pt: [137, 96], align: 'left', width: 49 }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'SKY',
        id: 'colors.sky',
        parent: 'colors',
        level: 1,
        color: 'sky',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.blue:colors.sky'],
        outEdges: ['colors.sky:colors.indigo'],
        navigateTo: 'themecolor_sky',
        position: [831, 348],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#f0f9ff', text: 'SKY', pt: [143, 96], align: 'left', width: 38 }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'INDIGO',
        id: 'colors.indigo',
        parent: 'colors',
        level: 1,
        color: 'indigo',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.sky:colors.indigo'],
        outEdges: [],
        navigateTo: 'themecolor_indigo',
        position: [831, 619],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'INDIGO',
            pt: [128, 95],
            align: 'left',
            width: 67
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'GRAY',
        id: 'colors.gray',
        parent: 'colors',
        level: 1,
        color: 'gray',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: ['colors.gray:colors.slate'],
        navigateTo: 'themecolor_gray',
        position: [441, 77],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#fafafa', text: 'GRAY', pt: [134, 96], align: 'left', width: 53 }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'SLATE',
        id: 'colors.slate',
        parent: 'colors',
        level: 1,
        color: 'slate',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.gray:colors.slate'],
        outEdges: [],
        navigateTo: 'themecolor_slate',
        position: [441, 348],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#f8fafc', text: 'SLATE', pt: [131, 96], align: 'left', width: 60 }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'RED',
        id: 'colors.red',
        parent: 'colors',
        level: 1,
        color: 'red',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: ['colors.red:colors.amber'],
        navigateTo: 'themecolor_red',
        position: [50, 77],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#f8fafc', text: 'RED', pt: [141, 96], align: 'left', width: 40 }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'AMBER',
        id: 'colors.amber',
        parent: 'colors',
        level: 1,
        color: 'amber',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.red:colors.amber'],
        outEdges: ['colors.amber:colors.green'],
        navigateTo: 'themecolor_amber',
        position: [50, 348],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#f8fafc', text: 'AMBER', pt: [128, 96], align: 'left', width: 67 }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'GREEN',
        id: 'colors.green',
        parent: 'colors',
        level: 1,
        color: 'green',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.amber:colors.green'],
        outEdges: [],
        navigateTo: 'themecolor_green',
        position: [50, 619],
        size: { width: 321, height: 180 },
        labels: [
          { fontSize: 19, color: '#f8fafc', text: 'GREEN', pt: [128, 95], align: 'left', width: 67 }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.amber:colors.green',
        parent: 'colors',
        source: 'colors.amber',
        target: 'colors.green',
        label: null,
        relations: ['296e648c56fbe771b8e847c645d1a63e7c40ccdb'],
        points: [
          [211, 528],
          [211, 552],
          [211, 579],
          [211, 604],
          [211, 619]
        ],
        labels: [],
        headArrow: [
          [215, 604],
          [211, 615],
          [207, 604]
        ]
      },
      {
        id: 'colors.red:colors.amber',
        parent: 'colors',
        source: 'colors.red',
        target: 'colors.amber',
        label: null,
        relations: ['d25103565fb5c0189eb08b42a8d867d278ed0dc5'],
        points: [
          [211, 257],
          [211, 282],
          [211, 308],
          [211, 334],
          [211, 348]
        ],
        labels: [],
        headArrow: [
          [215, 334],
          [211, 344],
          [207, 334]
        ]
      },
      {
        id: 'colors.gray:colors.slate',
        parent: 'colors',
        source: 'colors.gray',
        target: 'colors.slate',
        label: null,
        relations: ['1d04c0cdc7ce6a57867861cf65b8507cad10320d'],
        points: [
          [602, 257],
          [602, 282],
          [602, 308],
          [602, 334],
          [602, 348]
        ],
        labels: [],
        headArrow: [
          [606, 334],
          [602, 344],
          [598, 334]
        ]
      },
      {
        id: 'colors.sky:colors.indigo',
        parent: 'colors',
        source: 'colors.sky',
        target: 'colors.indigo',
        label: null,
        relations: ['a47772603a8e78d3d7401c098ec0e2c473977b80'],
        points: [
          [992, 528],
          [992, 552],
          [992, 579],
          [992, 604],
          [992, 619]
        ],
        labels: [],
        headArrow: [
          [996, 604],
          [992, 615],
          [989, 604]
        ]
      },
      {
        id: 'colors.blue:colors.sky',
        parent: 'colors',
        source: 'colors.blue',
        target: 'colors.sky',
        label: null,
        relations: ['f3c7a3d6b9196dc260761e087438bb9002344426'],
        points: [
          [992, 257],
          [992, 282],
          [992, 308],
          [992, 334],
          [992, 348]
        ],
        labels: [],
        headArrow: [
          [996, 334],
          [992, 344],
          [989, 334]
        ]
      },
      {
        id: 'colors.secondary:colors.muted',
        parent: 'colors',
        source: 'colors.secondary',
        target: 'colors.muted',
        label: null,
        relations: ['f3aeebf5f3bd06552caf4ceff75ea625f574453f'],
        points: [
          [1383, 528],
          [1383, 552],
          [1383, 579],
          [1383, 604],
          [1383, 619]
        ],
        labels: [],
        headArrow: [
          [1387, 604],
          [1383, 615],
          [1379, 604]
        ]
      },
      {
        id: 'colors.primary:colors.secondary',
        parent: 'colors',
        source: 'colors.primary',
        target: 'colors.secondary',
        label: null,
        relations: ['9119ab39fea83ca982abeb6edbd1bf36134c6478'],
        points: [
          [1383, 257],
          [1383, 282],
          [1383, 308],
          [1383, 334],
          [1383, 348]
        ],
        labels: [],
        headArrow: [
          [1387, 334],
          [1383, 344],
          [1379, 334]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolor_primary: {
    id: 'themecolor_primary',
    viewOf: 'colors.primary',
    title: 'Theme Color: primary',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'colors', isDescedants: false },
          { element: 'colors.primary', isDescedants: false },
          { element: 'colors.primary', isDescedants: true }
        ]
      },
      { isInclude: true, exprs: [{ elementKind: 'compound', isEqual: true }] },
      { targets: [{ elementKind: 'compound', isEqual: true }], style: { color: 'primary' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 2002,
    height: 712,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['colors.primary'],
        inEdges: [],
        outEdges: ['colors:compoundtest.compound1'],
        navigateTo: 'themecolors',
        position: [0, 1],
        size: { width: 1262, height: 663 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 15],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'PRIMARY',
        id: 'colors.primary',
        parent: 'colors',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: [
          'colors.primary.person',
          'colors.primary.rect',
          'colors.primary.browser',
          'colors.primary.mobile',
          'colors.primary.cylinder',
          'colors.primary.queue'
        ],
        inEdges: [],
        outEdges: ['colors.primary:compoundtest.compound1'],
        position: [40, 67],
        size: { width: 1182, height: 557 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'PRIMARY',
            pt: [11, 16],
            align: 'left',
            width: 60
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 1',
        id: 'compoundtest.compound1',
        parent: null,
        level: 0,
        color: 'primary',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2'],
        inEdges: ['colors.primary:compoundtest.compound1', 'colors:compoundtest.compound1'],
        outEdges: [],
        position: [1282, 0],
        size: { width: 720, height: 712 },
        depth: 5,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 1',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 2',
        id: 'compoundtest.compound1.compound2',
        parent: 'compoundtest.compound1',
        level: 1,
        color: 'primary',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3'],
        inEdges: [],
        outEdges: [],
        position: [1322, 67],
        size: { width: 640, height: 605 },
        depth: 4,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 2',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 3',
        id: 'compoundtest.compound1.compound2.compound3',
        parent: 'compoundtest.compound1.compound2',
        level: 2,
        color: 'primary',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4'],
        inEdges: [],
        outEdges: [],
        position: [1362, 133],
        size: { width: 560, height: 499 },
        depth: 3,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 3',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 4',
        id: 'compoundtest.compound1.compound2.compound3.compound4',
        parent: 'compoundtest.compound1.compound2.compound3',
        level: 3,
        color: 'primary',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5'],
        inEdges: [],
        outEdges: [],
        position: [1402, 199],
        size: { width: 480, height: 393 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 4',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 5',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        parent: 'compoundtest.compound1.compound2.compound3.compound4',
        level: 4,
        color: 'primary',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5.compound6'],
        inEdges: [],
        outEdges: [],
        position: [1442, 266],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 5',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 6',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5.compound6',
        parent: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        level: 5,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [],
        position: [1481, 332],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Level 6',
            pt: [131, 95],
            align: 'left',
            width: 61
          }
        ]
      },
      {
        description: 'Example of Person Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'person',
        title: 'Person',
        id: 'colors.primary.person',
        parent: 'colors.primary',
        level: 2,
        color: 'primary',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['colors.primary.person:colors.primary.rect'],
        position: [861, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Person',
            pt: [131, 83],
            align: 'left',
            width: 60
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Person Shape',
            pt: [83, 110],
            align: 'left',
            width: 155
          }
        ]
      },
      {
        description: 'Example of Rectangle Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'rect',
        title: 'Rectangle',
        id: 'colors.primary.rect',
        parent: 'colors.primary',
        level: 2,
        color: 'primary',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.primary.person:colors.primary.rect'],
        outEdges: [],
        position: [861, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Rectangle',
            pt: [119, 83],
            align: 'left',
            width: 85
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Rectangle Shape',
            pt: [74, 110],
            align: 'left',
            width: 173
          }
        ]
      },
      {
        description: 'Example of Browser Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'browser',
        title: 'Browser',
        id: 'colors.primary.browser',
        parent: 'colors.primary',
        level: 2,
        color: 'primary',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['colors.primary.browser:colors.primary.mobile'],
        position: [470, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Browser',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Browser Shape',
            pt: [80, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Mobile Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobile',
        title: 'Mobile',
        id: 'colors.primary.mobile',
        parent: 'colors.primary',
        level: 2,
        color: 'primary',
        shape: 'mobile',
        children: [],
        inEdges: ['colors.primary.browser:colors.primary.mobile'],
        outEdges: [],
        position: [470, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Mobile',
            pt: [134, 83],
            align: 'left',
            width: 55
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Mobile Shape',
            pt: [85, 110],
            align: 'left',
            width: 152
          }
        ]
      },
      {
        description: 'Example of Cylinder Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'cylinder',
        title: 'Cylinder',
        id: 'colors.primary.cylinder',
        parent: 'colors.primary',
        level: 2,
        color: 'primary',
        shape: 'cylinder',
        children: [],
        inEdges: [],
        outEdges: ['colors.primary.cylinder:colors.primary.queue'],
        position: [79, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Cylinder',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Cylinder Shape',
            pt: [81, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Queue Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'queue',
        title: 'Queue',
        id: 'colors.primary.queue',
        parent: 'colors.primary',
        level: 2,
        color: 'primary',
        shape: 'queue',
        children: [],
        inEdges: ['colors.primary.cylinder:colors.primary.queue'],
        outEdges: [],
        position: [79, 413],
        size: { width: 321, height: 161 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Queue',
            pt: [133, 74],
            align: 'left',
            width: 57
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Queue Shape',
            pt: [85, 101],
            align: 'left',
            width: 153
          }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.primary.cylinder:colors.primary.queue',
        parent: 'colors.primary',
        source: 'colors.primary.cylinder',
        target: 'colors.primary.queue',
        label: null,
        relations: ['9aa0dcc86c0b58d497b1cc6ed130b945824ede5a'],
        points: [
          [240, 314],
          [240, 342],
          [240, 372],
          [240, 399],
          [240, 414]
        ],
        labels: [],
        headArrow: [
          [244, 399],
          [240, 410],
          [237, 399]
        ]
      },
      {
        id: 'colors.primary.browser:colors.primary.mobile',
        parent: 'colors.primary',
        source: 'colors.primary.browser',
        target: 'colors.primary.mobile',
        label: null,
        relations: ['6a20716ada242b08ecc79833b8862ed1a6e8a281'],
        points: [
          [631, 313],
          [631, 337],
          [631, 364],
          [631, 389],
          [631, 404]
        ],
        labels: [],
        headArrow: [
          [635, 389],
          [631, 400],
          [627, 389]
        ]
      },
      {
        id: 'colors.primary.person:colors.primary.rect',
        parent: 'colors.primary',
        source: 'colors.primary.person',
        target: 'colors.primary.rect',
        label: null,
        relations: ['75815f78e70de47a6a1fdff57acc60933ec27687'],
        points: [
          [1022, 313],
          [1022, 337],
          [1022, 364],
          [1022, 389],
          [1022, 404]
        ],
        labels: [],
        headArrow: [
          [1026, 389],
          [1022, 400],
          [1018, 389]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolor_blue: {
    id: 'themecolor_blue',
    viewOf: 'colors.blue',
    title: 'Theme Color: blue',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'colors', isDescedants: false },
          { element: 'colors.blue', isDescedants: false },
          { element: 'colors.blue', isDescedants: true }
        ]
      },
      { isInclude: true, exprs: [{ elementKind: 'compound', isEqual: true }] },
      { targets: [{ elementKind: 'compound', isEqual: true }], style: { color: 'blue' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 2002,
    height: 712,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['colors.blue'],
        inEdges: [],
        outEdges: ['colors:compoundtest.compound1'],
        navigateTo: 'themecolors',
        position: [0, 1],
        size: { width: 1262, height: 663 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 15],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'BLUE',
        id: 'colors.blue',
        parent: 'colors',
        level: 1,
        color: 'blue',
        shape: 'rectangle',
        children: [
          'colors.blue.person',
          'colors.blue.rect',
          'colors.blue.browser',
          'colors.blue.mobile',
          'colors.blue.cylinder',
          'colors.blue.queue'
        ],
        inEdges: [],
        outEdges: ['colors.blue:compoundtest.compound1'],
        position: [40, 67],
        size: { width: 1182, height: 557 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'BLUE',
            pt: [11, 16],
            align: 'left',
            width: 36
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 1',
        id: 'compoundtest.compound1',
        parent: null,
        level: 0,
        color: 'blue',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2'],
        inEdges: ['colors.blue:compoundtest.compound1', 'colors:compoundtest.compound1'],
        outEdges: [],
        position: [1282, 0],
        size: { width: 720, height: 712 },
        depth: 5,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 1',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 2',
        id: 'compoundtest.compound1.compound2',
        parent: 'compoundtest.compound1',
        level: 1,
        color: 'blue',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3'],
        inEdges: [],
        outEdges: [],
        position: [1322, 67],
        size: { width: 640, height: 605 },
        depth: 4,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 2',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 3',
        id: 'compoundtest.compound1.compound2.compound3',
        parent: 'compoundtest.compound1.compound2',
        level: 2,
        color: 'blue',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4'],
        inEdges: [],
        outEdges: [],
        position: [1362, 133],
        size: { width: 560, height: 499 },
        depth: 3,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 3',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 4',
        id: 'compoundtest.compound1.compound2.compound3.compound4',
        parent: 'compoundtest.compound1.compound2.compound3',
        level: 3,
        color: 'blue',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5'],
        inEdges: [],
        outEdges: [],
        position: [1402, 199],
        size: { width: 480, height: 393 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 4',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 5',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        parent: 'compoundtest.compound1.compound2.compound3.compound4',
        level: 4,
        color: 'blue',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5.compound6'],
        inEdges: [],
        outEdges: [],
        position: [1442, 266],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 5',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 6',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5.compound6',
        parent: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        level: 5,
        color: 'blue',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [],
        position: [1481, 332],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Level 6',
            pt: [131, 95],
            align: 'left',
            width: 61
          }
        ]
      },
      {
        description: 'Example of Person Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'person',
        title: 'Person',
        id: 'colors.blue.person',
        parent: 'colors.blue',
        level: 2,
        color: 'blue',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['colors.blue.person:colors.blue.rect'],
        position: [861, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Person',
            pt: [131, 83],
            align: 'left',
            width: 60
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Person Shape',
            pt: [83, 110],
            align: 'left',
            width: 155
          }
        ]
      },
      {
        description: 'Example of Rectangle Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'rect',
        title: 'Rectangle',
        id: 'colors.blue.rect',
        parent: 'colors.blue',
        level: 2,
        color: 'blue',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.blue.person:colors.blue.rect'],
        outEdges: [],
        position: [861, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Rectangle',
            pt: [119, 83],
            align: 'left',
            width: 85
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Rectangle Shape',
            pt: [74, 110],
            align: 'left',
            width: 173
          }
        ]
      },
      {
        description: 'Example of Browser Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'browser',
        title: 'Browser',
        id: 'colors.blue.browser',
        parent: 'colors.blue',
        level: 2,
        color: 'blue',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['colors.blue.browser:colors.blue.mobile'],
        position: [470, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Browser',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Browser Shape',
            pt: [80, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Mobile Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobile',
        title: 'Mobile',
        id: 'colors.blue.mobile',
        parent: 'colors.blue',
        level: 2,
        color: 'blue',
        shape: 'mobile',
        children: [],
        inEdges: ['colors.blue.browser:colors.blue.mobile'],
        outEdges: [],
        position: [470, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Mobile',
            pt: [134, 83],
            align: 'left',
            width: 55
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Mobile Shape',
            pt: [85, 110],
            align: 'left',
            width: 152
          }
        ]
      },
      {
        description: 'Example of Cylinder Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'cylinder',
        title: 'Cylinder',
        id: 'colors.blue.cylinder',
        parent: 'colors.blue',
        level: 2,
        color: 'blue',
        shape: 'cylinder',
        children: [],
        inEdges: [],
        outEdges: ['colors.blue.cylinder:colors.blue.queue'],
        position: [79, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Cylinder',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Cylinder Shape',
            pt: [81, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Queue Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'queue',
        title: 'Queue',
        id: 'colors.blue.queue',
        parent: 'colors.blue',
        level: 2,
        color: 'blue',
        shape: 'queue',
        children: [],
        inEdges: ['colors.blue.cylinder:colors.blue.queue'],
        outEdges: [],
        position: [79, 413],
        size: { width: 321, height: 161 },
        labels: [
          {
            fontSize: 19,
            color: '#eff6ff',
            text: 'Queue',
            pt: [133, 74],
            align: 'left',
            width: 57
          },
          {
            fontSize: 14,
            color: '#bfdbfe',
            text: 'Example of Queue Shape',
            pt: [85, 101],
            align: 'left',
            width: 153
          }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.blue.cylinder:colors.blue.queue',
        parent: 'colors.blue',
        source: 'colors.blue.cylinder',
        target: 'colors.blue.queue',
        label: null,
        relations: ['17d9f2137d66564cf8f83a31a675b2bf6036e46b'],
        points: [
          [240, 314],
          [240, 342],
          [240, 372],
          [240, 399],
          [240, 414]
        ],
        labels: [],
        headArrow: [
          [244, 399],
          [240, 410],
          [237, 399]
        ]
      },
      {
        id: 'colors.blue.browser:colors.blue.mobile',
        parent: 'colors.blue',
        source: 'colors.blue.browser',
        target: 'colors.blue.mobile',
        label: null,
        relations: ['58f4efbd4665116fc6219366ea3ed2a799f6f940'],
        points: [
          [631, 313],
          [631, 337],
          [631, 364],
          [631, 389],
          [631, 404]
        ],
        labels: [],
        headArrow: [
          [635, 389],
          [631, 400],
          [627, 389]
        ]
      },
      {
        id: 'colors.blue.person:colors.blue.rect',
        parent: 'colors.blue',
        source: 'colors.blue.person',
        target: 'colors.blue.rect',
        label: null,
        relations: ['9157d15435265f6cb33995e70e9b90f47c79ce58'],
        points: [
          [1022, 313],
          [1022, 337],
          [1022, 364],
          [1022, 389],
          [1022, 404]
        ],
        labels: [],
        headArrow: [
          [1026, 389],
          [1022, 400],
          [1018, 389]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolor_secondary: {
    id: 'themecolor_secondary',
    viewOf: 'colors.secondary',
    title: 'Theme Color: secondary',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'colors', isDescedants: false },
          { element: 'colors.secondary', isDescedants: false },
          { element: 'colors.secondary', isDescedants: true }
        ]
      },
      { isInclude: true, exprs: [{ elementKind: 'compound', isEqual: true }] },
      { targets: [{ elementKind: 'compound', isEqual: true }], style: { color: 'secondary' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 2002,
    height: 712,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['colors.secondary'],
        inEdges: [],
        outEdges: ['colors:compoundtest.compound1'],
        navigateTo: 'themecolors',
        position: [0, 1],
        size: { width: 1262, height: 663 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 15],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'SECONDARY',
        id: 'colors.secondary',
        parent: 'colors',
        level: 1,
        color: 'secondary',
        shape: 'rectangle',
        children: [
          'colors.secondary.person',
          'colors.secondary.rect',
          'colors.secondary.browser',
          'colors.secondary.mobile',
          'colors.secondary.cylinder',
          'colors.secondary.queue'
        ],
        inEdges: [],
        outEdges: ['colors.secondary:compoundtest.compound1'],
        position: [40, 67],
        size: { width: 1182, height: 557 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'SECONDARY',
            pt: [11, 16],
            align: 'left',
            width: 84
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 1',
        id: 'compoundtest.compound1',
        parent: null,
        level: 0,
        color: 'secondary',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2'],
        inEdges: ['colors.secondary:compoundtest.compound1', 'colors:compoundtest.compound1'],
        outEdges: [],
        position: [1282, 0],
        size: { width: 720, height: 712 },
        depth: 5,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 1',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 2',
        id: 'compoundtest.compound1.compound2',
        parent: 'compoundtest.compound1',
        level: 1,
        color: 'secondary',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3'],
        inEdges: [],
        outEdges: [],
        position: [1322, 67],
        size: { width: 640, height: 605 },
        depth: 4,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 2',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 3',
        id: 'compoundtest.compound1.compound2.compound3',
        parent: 'compoundtest.compound1.compound2',
        level: 2,
        color: 'secondary',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4'],
        inEdges: [],
        outEdges: [],
        position: [1362, 133],
        size: { width: 560, height: 499 },
        depth: 3,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 3',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 4',
        id: 'compoundtest.compound1.compound2.compound3.compound4',
        parent: 'compoundtest.compound1.compound2.compound3',
        level: 3,
        color: 'secondary',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5'],
        inEdges: [],
        outEdges: [],
        position: [1402, 199],
        size: { width: 480, height: 393 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 4',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 5',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        parent: 'compoundtest.compound1.compound2.compound3.compound4',
        level: 4,
        color: 'secondary',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5.compound6'],
        inEdges: [],
        outEdges: [],
        position: [1442, 266],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 5',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 6',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5.compound6',
        parent: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        level: 5,
        color: 'secondary',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [],
        position: [1481, 332],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Level 6',
            pt: [131, 95],
            align: 'left',
            width: 61
          }
        ]
      },
      {
        description: 'Example of Person Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'person',
        title: 'Person',
        id: 'colors.secondary.person',
        parent: 'colors.secondary',
        level: 2,
        color: 'secondary',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['colors.secondary.person:colors.secondary.rect'],
        position: [861, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Person',
            pt: [131, 83],
            align: 'left',
            width: 60
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Person Shape',
            pt: [83, 110],
            align: 'left',
            width: 155
          }
        ]
      },
      {
        description: 'Example of Rectangle Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'rect',
        title: 'Rectangle',
        id: 'colors.secondary.rect',
        parent: 'colors.secondary',
        level: 2,
        color: 'secondary',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.secondary.person:colors.secondary.rect'],
        outEdges: [],
        position: [861, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Rectangle',
            pt: [119, 83],
            align: 'left',
            width: 85
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Rectangle Shape',
            pt: [74, 110],
            align: 'left',
            width: 173
          }
        ]
      },
      {
        description: 'Example of Browser Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'browser',
        title: 'Browser',
        id: 'colors.secondary.browser',
        parent: 'colors.secondary',
        level: 2,
        color: 'secondary',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['colors.secondary.browser:colors.secondary.mobile'],
        position: [470, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Browser',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Browser Shape',
            pt: [80, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Mobile Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobile',
        title: 'Mobile',
        id: 'colors.secondary.mobile',
        parent: 'colors.secondary',
        level: 2,
        color: 'secondary',
        shape: 'mobile',
        children: [],
        inEdges: ['colors.secondary.browser:colors.secondary.mobile'],
        outEdges: [],
        position: [470, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Mobile',
            pt: [134, 83],
            align: 'left',
            width: 55
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Mobile Shape',
            pt: [85, 110],
            align: 'left',
            width: 152
          }
        ]
      },
      {
        description: 'Example of Cylinder Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'cylinder',
        title: 'Cylinder',
        id: 'colors.secondary.cylinder',
        parent: 'colors.secondary',
        level: 2,
        color: 'secondary',
        shape: 'cylinder',
        children: [],
        inEdges: [],
        outEdges: ['colors.secondary.cylinder:colors.secondary.queue'],
        position: [79, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Cylinder',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Cylinder Shape',
            pt: [81, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Queue Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'queue',
        title: 'Queue',
        id: 'colors.secondary.queue',
        parent: 'colors.secondary',
        level: 2,
        color: 'secondary',
        shape: 'queue',
        children: [],
        inEdges: ['colors.secondary.cylinder:colors.secondary.queue'],
        outEdges: [],
        position: [79, 413],
        size: { width: 321, height: 161 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Queue',
            pt: [133, 74],
            align: 'left',
            width: 57
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Queue Shape',
            pt: [85, 101],
            align: 'left',
            width: 153
          }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.secondary.cylinder:colors.secondary.queue',
        parent: 'colors.secondary',
        source: 'colors.secondary.cylinder',
        target: 'colors.secondary.queue',
        label: null,
        relations: ['404067e5f8868ecd70ccc0ba44a0db78d370733f'],
        points: [
          [240, 314],
          [240, 342],
          [240, 372],
          [240, 399],
          [240, 414]
        ],
        labels: [],
        headArrow: [
          [244, 399],
          [240, 410],
          [237, 399]
        ]
      },
      {
        id: 'colors.secondary.browser:colors.secondary.mobile',
        parent: 'colors.secondary',
        source: 'colors.secondary.browser',
        target: 'colors.secondary.mobile',
        label: null,
        relations: ['4a86a1082b3983b5aac9a073a34bf2c70b9ee024'],
        points: [
          [631, 313],
          [631, 337],
          [631, 364],
          [631, 389],
          [631, 404]
        ],
        labels: [],
        headArrow: [
          [635, 389],
          [631, 400],
          [627, 389]
        ]
      },
      {
        id: 'colors.secondary.person:colors.secondary.rect',
        parent: 'colors.secondary',
        source: 'colors.secondary.person',
        target: 'colors.secondary.rect',
        label: null,
        relations: ['b90049f7ec80c632a86f534fcc89585b685f71db'],
        points: [
          [1022, 313],
          [1022, 337],
          [1022, 364],
          [1022, 389],
          [1022, 404]
        ],
        labels: [],
        headArrow: [
          [1026, 389],
          [1022, 400],
          [1018, 389]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolor_sky: {
    id: 'themecolor_sky',
    viewOf: 'colors.sky',
    title: 'Theme Color: sky',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'colors', isDescedants: false },
          { element: 'colors.sky', isDescedants: false },
          { element: 'colors.sky', isDescedants: true }
        ]
      },
      { isInclude: true, exprs: [{ elementKind: 'compound', isEqual: true }] },
      { targets: [{ elementKind: 'compound', isEqual: true }], style: { color: 'sky' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 2002,
    height: 712,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['colors.sky'],
        inEdges: [],
        outEdges: ['colors:compoundtest.compound1'],
        navigateTo: 'themecolors',
        position: [0, 1],
        size: { width: 1262, height: 663 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 15],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'SKY',
        id: 'colors.sky',
        parent: 'colors',
        level: 1,
        color: 'sky',
        shape: 'rectangle',
        children: [
          'colors.sky.person',
          'colors.sky.rect',
          'colors.sky.browser',
          'colors.sky.mobile',
          'colors.sky.cylinder',
          'colors.sky.queue'
        ],
        inEdges: [],
        outEdges: ['colors.sky:compoundtest.compound1'],
        position: [40, 67],
        size: { width: 1182, height: 557 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'SKY',
            pt: [11, 16],
            align: 'left',
            width: 27
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 1',
        id: 'compoundtest.compound1',
        parent: null,
        level: 0,
        color: 'sky',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2'],
        inEdges: ['colors.sky:compoundtest.compound1', 'colors:compoundtest.compound1'],
        outEdges: [],
        position: [1282, 0],
        size: { width: 720, height: 712 },
        depth: 5,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 1',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 2',
        id: 'compoundtest.compound1.compound2',
        parent: 'compoundtest.compound1',
        level: 1,
        color: 'sky',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3'],
        inEdges: [],
        outEdges: [],
        position: [1322, 67],
        size: { width: 640, height: 605 },
        depth: 4,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 2',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 3',
        id: 'compoundtest.compound1.compound2.compound3',
        parent: 'compoundtest.compound1.compound2',
        level: 2,
        color: 'sky',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4'],
        inEdges: [],
        outEdges: [],
        position: [1362, 133],
        size: { width: 560, height: 499 },
        depth: 3,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 3',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 4',
        id: 'compoundtest.compound1.compound2.compound3.compound4',
        parent: 'compoundtest.compound1.compound2.compound3',
        level: 3,
        color: 'sky',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5'],
        inEdges: [],
        outEdges: [],
        position: [1402, 199],
        size: { width: 480, height: 393 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 4',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 5',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        parent: 'compoundtest.compound1.compound2.compound3.compound4',
        level: 4,
        color: 'sky',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5.compound6'],
        inEdges: [],
        outEdges: [],
        position: [1442, 266],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 5',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 6',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5.compound6',
        parent: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        level: 5,
        color: 'sky',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [],
        position: [1481, 332],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Level 6',
            pt: [131, 95],
            align: 'left',
            width: 61
          }
        ]
      },
      {
        description: 'Example of Person Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'person',
        title: 'Person',
        id: 'colors.sky.person',
        parent: 'colors.sky',
        level: 2,
        color: 'sky',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['colors.sky.person:colors.sky.rect'],
        position: [861, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Person',
            pt: [131, 83],
            align: 'left',
            width: 60
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Person Shape',
            pt: [83, 110],
            align: 'left',
            width: 155
          }
        ]
      },
      {
        description: 'Example of Rectangle Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'rect',
        title: 'Rectangle',
        id: 'colors.sky.rect',
        parent: 'colors.sky',
        level: 2,
        color: 'sky',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.sky.person:colors.sky.rect'],
        outEdges: [],
        position: [861, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Rectangle',
            pt: [119, 83],
            align: 'left',
            width: 85
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Rectangle Shape',
            pt: [74, 110],
            align: 'left',
            width: 173
          }
        ]
      },
      {
        description: 'Example of Browser Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'browser',
        title: 'Browser',
        id: 'colors.sky.browser',
        parent: 'colors.sky',
        level: 2,
        color: 'sky',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['colors.sky.browser:colors.sky.mobile'],
        position: [470, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Browser',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Browser Shape',
            pt: [80, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Mobile Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobile',
        title: 'Mobile',
        id: 'colors.sky.mobile',
        parent: 'colors.sky',
        level: 2,
        color: 'sky',
        shape: 'mobile',
        children: [],
        inEdges: ['colors.sky.browser:colors.sky.mobile'],
        outEdges: [],
        position: [470, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Mobile',
            pt: [134, 83],
            align: 'left',
            width: 55
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Mobile Shape',
            pt: [85, 110],
            align: 'left',
            width: 152
          }
        ]
      },
      {
        description: 'Example of Cylinder Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'cylinder',
        title: 'Cylinder',
        id: 'colors.sky.cylinder',
        parent: 'colors.sky',
        level: 2,
        color: 'sky',
        shape: 'cylinder',
        children: [],
        inEdges: [],
        outEdges: ['colors.sky.cylinder:colors.sky.queue'],
        position: [79, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Cylinder',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Cylinder Shape',
            pt: [81, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Queue Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'queue',
        title: 'Queue',
        id: 'colors.sky.queue',
        parent: 'colors.sky',
        level: 2,
        color: 'sky',
        shape: 'queue',
        children: [],
        inEdges: ['colors.sky.cylinder:colors.sky.queue'],
        outEdges: [],
        position: [79, 413],
        size: { width: 321, height: 161 },
        labels: [
          {
            fontSize: 19,
            color: '#f0f9ff',
            text: 'Queue',
            pt: [133, 74],
            align: 'left',
            width: 57
          },
          {
            fontSize: 14,
            color: '#e0f2fe',
            text: 'Example of Queue Shape',
            pt: [85, 101],
            align: 'left',
            width: 153
          }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.sky.cylinder:colors.sky.queue',
        parent: 'colors.sky',
        source: 'colors.sky.cylinder',
        target: 'colors.sky.queue',
        label: null,
        relations: ['014217406dd2c2c49a684d5270cb65c1c047e461'],
        points: [
          [240, 314],
          [240, 342],
          [240, 372],
          [240, 399],
          [240, 414]
        ],
        labels: [],
        headArrow: [
          [244, 399],
          [240, 410],
          [237, 399]
        ]
      },
      {
        id: 'colors.sky.browser:colors.sky.mobile',
        parent: 'colors.sky',
        source: 'colors.sky.browser',
        target: 'colors.sky.mobile',
        label: null,
        relations: ['23e00338873a98f0d4819095c050642c43b764a6'],
        points: [
          [631, 313],
          [631, 337],
          [631, 364],
          [631, 389],
          [631, 404]
        ],
        labels: [],
        headArrow: [
          [635, 389],
          [631, 400],
          [627, 389]
        ]
      },
      {
        id: 'colors.sky.person:colors.sky.rect',
        parent: 'colors.sky',
        source: 'colors.sky.person',
        target: 'colors.sky.rect',
        label: null,
        relations: ['e70146a5497d716c07540d960f1958f5a4db1a75'],
        points: [
          [1022, 313],
          [1022, 337],
          [1022, 364],
          [1022, 389],
          [1022, 404]
        ],
        labels: [],
        headArrow: [
          [1026, 389],
          [1022, 400],
          [1018, 389]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolor_muted: {
    id: 'themecolor_muted',
    viewOf: 'colors.muted',
    title: 'Theme Color: muted',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'colors', isDescedants: false },
          { element: 'colors.muted', isDescedants: false },
          { element: 'colors.muted', isDescedants: true }
        ]
      },
      { isInclude: true, exprs: [{ elementKind: 'compound', isEqual: true }] },
      { targets: [{ elementKind: 'compound', isEqual: true }], style: { color: 'muted' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 2002,
    height: 712,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['colors.muted'],
        inEdges: [],
        outEdges: ['colors:compoundtest.compound1'],
        navigateTo: 'themecolors',
        position: [0, 1],
        size: { width: 1262, height: 663 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 15],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'MUTED',
        id: 'colors.muted',
        parent: 'colors',
        level: 1,
        color: 'muted',
        shape: 'rectangle',
        children: [
          'colors.muted.person',
          'colors.muted.rect',
          'colors.muted.browser',
          'colors.muted.mobile',
          'colors.muted.cylinder',
          'colors.muted.queue'
        ],
        inEdges: [],
        outEdges: ['colors.muted:compoundtest.compound1'],
        position: [40, 67],
        size: { width: 1182, height: 557 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'MUTED',
            pt: [11, 16],
            align: 'left',
            width: 47
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 1',
        id: 'compoundtest.compound1',
        parent: null,
        level: 0,
        color: 'muted',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2'],
        inEdges: ['colors.muted:compoundtest.compound1', 'colors:compoundtest.compound1'],
        outEdges: [],
        position: [1282, 0],
        size: { width: 720, height: 712 },
        depth: 5,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 1',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 2',
        id: 'compoundtest.compound1.compound2',
        parent: 'compoundtest.compound1',
        level: 1,
        color: 'muted',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3'],
        inEdges: [],
        outEdges: [],
        position: [1322, 67],
        size: { width: 640, height: 605 },
        depth: 4,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 2',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 3',
        id: 'compoundtest.compound1.compound2.compound3',
        parent: 'compoundtest.compound1.compound2',
        level: 2,
        color: 'muted',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4'],
        inEdges: [],
        outEdges: [],
        position: [1362, 133],
        size: { width: 560, height: 499 },
        depth: 3,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 3',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 4',
        id: 'compoundtest.compound1.compound2.compound3.compound4',
        parent: 'compoundtest.compound1.compound2.compound3',
        level: 3,
        color: 'muted',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5'],
        inEdges: [],
        outEdges: [],
        position: [1402, 199],
        size: { width: 480, height: 393 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 4',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 5',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        parent: 'compoundtest.compound1.compound2.compound3.compound4',
        level: 4,
        color: 'muted',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5.compound6'],
        inEdges: [],
        outEdges: [],
        position: [1442, 266],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 5',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 6',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5.compound6',
        parent: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        level: 5,
        color: 'muted',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [],
        position: [1481, 332],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Level 6',
            pt: [131, 95],
            align: 'left',
            width: 61
          }
        ]
      },
      {
        description: 'Example of Person Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'person',
        title: 'Person',
        id: 'colors.muted.person',
        parent: 'colors.muted',
        level: 2,
        color: 'muted',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['colors.muted.person:colors.muted.rect'],
        position: [861, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Person',
            pt: [131, 83],
            align: 'left',
            width: 60
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Person Shape',
            pt: [83, 110],
            align: 'left',
            width: 155
          }
        ]
      },
      {
        description: 'Example of Rectangle Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'rect',
        title: 'Rectangle',
        id: 'colors.muted.rect',
        parent: 'colors.muted',
        level: 2,
        color: 'muted',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.muted.person:colors.muted.rect'],
        outEdges: [],
        position: [861, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Rectangle',
            pt: [119, 83],
            align: 'left',
            width: 85
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Rectangle Shape',
            pt: [74, 110],
            align: 'left',
            width: 173
          }
        ]
      },
      {
        description: 'Example of Browser Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'browser',
        title: 'Browser',
        id: 'colors.muted.browser',
        parent: 'colors.muted',
        level: 2,
        color: 'muted',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['colors.muted.browser:colors.muted.mobile'],
        position: [470, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Browser',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Browser Shape',
            pt: [80, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Mobile Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobile',
        title: 'Mobile',
        id: 'colors.muted.mobile',
        parent: 'colors.muted',
        level: 2,
        color: 'muted',
        shape: 'mobile',
        children: [],
        inEdges: ['colors.muted.browser:colors.muted.mobile'],
        outEdges: [],
        position: [470, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Mobile',
            pt: [134, 83],
            align: 'left',
            width: 55
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Mobile Shape',
            pt: [85, 110],
            align: 'left',
            width: 152
          }
        ]
      },
      {
        description: 'Example of Cylinder Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'cylinder',
        title: 'Cylinder',
        id: 'colors.muted.cylinder',
        parent: 'colors.muted',
        level: 2,
        color: 'muted',
        shape: 'cylinder',
        children: [],
        inEdges: [],
        outEdges: ['colors.muted.cylinder:colors.muted.queue'],
        position: [79, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Cylinder',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Cylinder Shape',
            pt: [81, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Queue Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'queue',
        title: 'Queue',
        id: 'colors.muted.queue',
        parent: 'colors.muted',
        level: 2,
        color: 'muted',
        shape: 'queue',
        children: [],
        inEdges: ['colors.muted.cylinder:colors.muted.queue'],
        outEdges: [],
        position: [79, 413],
        size: { width: 321, height: 161 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Queue',
            pt: [133, 74],
            align: 'left',
            width: 57
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Queue Shape',
            pt: [85, 101],
            align: 'left',
            width: 153
          }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.muted.cylinder:colors.muted.queue',
        parent: 'colors.muted',
        source: 'colors.muted.cylinder',
        target: 'colors.muted.queue',
        label: null,
        relations: ['53cab6b0a5c250dcffd1c71cd08c0fd766edb1f8'],
        points: [
          [240, 314],
          [240, 342],
          [240, 372],
          [240, 399],
          [240, 414]
        ],
        labels: [],
        headArrow: [
          [244, 399],
          [240, 410],
          [237, 399]
        ]
      },
      {
        id: 'colors.muted.browser:colors.muted.mobile',
        parent: 'colors.muted',
        source: 'colors.muted.browser',
        target: 'colors.muted.mobile',
        label: null,
        relations: ['6617ab4728fe3826490d1387535785baccc11039'],
        points: [
          [631, 313],
          [631, 337],
          [631, 364],
          [631, 389],
          [631, 404]
        ],
        labels: [],
        headArrow: [
          [635, 389],
          [631, 400],
          [627, 389]
        ]
      },
      {
        id: 'colors.muted.person:colors.muted.rect',
        parent: 'colors.muted',
        source: 'colors.muted.person',
        target: 'colors.muted.rect',
        label: null,
        relations: ['5ebcaee6b2232ee0a0aab9598a777431f9e0f150'],
        points: [
          [1022, 313],
          [1022, 337],
          [1022, 364],
          [1022, 389],
          [1022, 404]
        ],
        labels: [],
        headArrow: [
          [1026, 389],
          [1022, 400],
          [1018, 389]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolor_slate: {
    id: 'themecolor_slate',
    viewOf: 'colors.slate',
    title: 'Theme Color: slate',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'colors', isDescedants: false },
          { element: 'colors.slate', isDescedants: false },
          { element: 'colors.slate', isDescedants: true }
        ]
      },
      { isInclude: true, exprs: [{ elementKind: 'compound', isEqual: true }] },
      { targets: [{ elementKind: 'compound', isEqual: true }], style: { color: 'slate' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 2002,
    height: 712,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['colors.slate'],
        inEdges: [],
        outEdges: ['colors:compoundtest.compound1'],
        navigateTo: 'themecolors',
        position: [0, 1],
        size: { width: 1262, height: 663 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 15],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'SLATE',
        id: 'colors.slate',
        parent: 'colors',
        level: 1,
        color: 'slate',
        shape: 'rectangle',
        children: [
          'colors.slate.person',
          'colors.slate.rect',
          'colors.slate.browser',
          'colors.slate.mobile',
          'colors.slate.cylinder',
          'colors.slate.queue'
        ],
        inEdges: [],
        outEdges: ['colors.slate:compoundtest.compound1'],
        position: [40, 67],
        size: { width: 1182, height: 557 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'SLATE',
            pt: [11, 16],
            align: 'left',
            width: 43
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 1',
        id: 'compoundtest.compound1',
        parent: null,
        level: 0,
        color: 'slate',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2'],
        inEdges: ['colors.slate:compoundtest.compound1', 'colors:compoundtest.compound1'],
        outEdges: [],
        position: [1282, 0],
        size: { width: 720, height: 712 },
        depth: 5,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 1',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 2',
        id: 'compoundtest.compound1.compound2',
        parent: 'compoundtest.compound1',
        level: 1,
        color: 'slate',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3'],
        inEdges: [],
        outEdges: [],
        position: [1322, 67],
        size: { width: 640, height: 605 },
        depth: 4,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 2',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 3',
        id: 'compoundtest.compound1.compound2.compound3',
        parent: 'compoundtest.compound1.compound2',
        level: 2,
        color: 'slate',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4'],
        inEdges: [],
        outEdges: [],
        position: [1362, 133],
        size: { width: 560, height: 499 },
        depth: 3,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 3',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 4',
        id: 'compoundtest.compound1.compound2.compound3.compound4',
        parent: 'compoundtest.compound1.compound2.compound3',
        level: 3,
        color: 'slate',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5'],
        inEdges: [],
        outEdges: [],
        position: [1402, 199],
        size: { width: 480, height: 393 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 4',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 5',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        parent: 'compoundtest.compound1.compound2.compound3.compound4',
        level: 4,
        color: 'slate',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5.compound6'],
        inEdges: [],
        outEdges: [],
        position: [1442, 266],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 5',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 6',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5.compound6',
        parent: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        level: 5,
        color: 'slate',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [],
        position: [1481, 332],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Level 6',
            pt: [131, 95],
            align: 'left',
            width: 61
          }
        ]
      },
      {
        description: 'Example of Person Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'person',
        title: 'Person',
        id: 'colors.slate.person',
        parent: 'colors.slate',
        level: 2,
        color: 'slate',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['colors.slate.person:colors.slate.rect'],
        position: [861, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Person',
            pt: [131, 83],
            align: 'left',
            width: 60
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Person Shape',
            pt: [83, 110],
            align: 'left',
            width: 155
          }
        ]
      },
      {
        description: 'Example of Rectangle Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'rect',
        title: 'Rectangle',
        id: 'colors.slate.rect',
        parent: 'colors.slate',
        level: 2,
        color: 'slate',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.slate.person:colors.slate.rect'],
        outEdges: [],
        position: [861, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Rectangle',
            pt: [119, 83],
            align: 'left',
            width: 85
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Rectangle Shape',
            pt: [74, 110],
            align: 'left',
            width: 173
          }
        ]
      },
      {
        description: 'Example of Browser Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'browser',
        title: 'Browser',
        id: 'colors.slate.browser',
        parent: 'colors.slate',
        level: 2,
        color: 'slate',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['colors.slate.browser:colors.slate.mobile'],
        position: [470, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Browser',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Browser Shape',
            pt: [80, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Mobile Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobile',
        title: 'Mobile',
        id: 'colors.slate.mobile',
        parent: 'colors.slate',
        level: 2,
        color: 'slate',
        shape: 'mobile',
        children: [],
        inEdges: ['colors.slate.browser:colors.slate.mobile'],
        outEdges: [],
        position: [470, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Mobile',
            pt: [134, 83],
            align: 'left',
            width: 55
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Mobile Shape',
            pt: [85, 110],
            align: 'left',
            width: 152
          }
        ]
      },
      {
        description: 'Example of Cylinder Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'cylinder',
        title: 'Cylinder',
        id: 'colors.slate.cylinder',
        parent: 'colors.slate',
        level: 2,
        color: 'slate',
        shape: 'cylinder',
        children: [],
        inEdges: [],
        outEdges: ['colors.slate.cylinder:colors.slate.queue'],
        position: [79, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Cylinder',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Cylinder Shape',
            pt: [81, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Queue Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'queue',
        title: 'Queue',
        id: 'colors.slate.queue',
        parent: 'colors.slate',
        level: 2,
        color: 'slate',
        shape: 'queue',
        children: [],
        inEdges: ['colors.slate.cylinder:colors.slate.queue'],
        outEdges: [],
        position: [79, 413],
        size: { width: 321, height: 161 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Queue',
            pt: [133, 74],
            align: 'left',
            width: 57
          },
          {
            fontSize: 14,
            color: '#e2e8f0',
            text: 'Example of Queue Shape',
            pt: [85, 101],
            align: 'left',
            width: 153
          }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.slate.cylinder:colors.slate.queue',
        parent: 'colors.slate',
        source: 'colors.slate.cylinder',
        target: 'colors.slate.queue',
        label: null,
        relations: ['45d590510759c2fc998afb31ea35c12da5756dcc'],
        points: [
          [240, 314],
          [240, 342],
          [240, 372],
          [240, 399],
          [240, 414]
        ],
        labels: [],
        headArrow: [
          [244, 399],
          [240, 410],
          [237, 399]
        ]
      },
      {
        id: 'colors.slate.browser:colors.slate.mobile',
        parent: 'colors.slate',
        source: 'colors.slate.browser',
        target: 'colors.slate.mobile',
        label: null,
        relations: ['d34cd129a67742e1ca11782afb77c1a8167514bd'],
        points: [
          [631, 313],
          [631, 337],
          [631, 364],
          [631, 389],
          [631, 404]
        ],
        labels: [],
        headArrow: [
          [635, 389],
          [631, 400],
          [627, 389]
        ]
      },
      {
        id: 'colors.slate.person:colors.slate.rect',
        parent: 'colors.slate',
        source: 'colors.slate.person',
        target: 'colors.slate.rect',
        label: null,
        relations: ['b088c17e000d4498a1ac6f675498c1a3321bdf74'],
        points: [
          [1022, 313],
          [1022, 337],
          [1022, 364],
          [1022, 389],
          [1022, 404]
        ],
        labels: [],
        headArrow: [
          [1026, 389],
          [1022, 400],
          [1018, 389]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolor_gray: {
    id: 'themecolor_gray',
    viewOf: 'colors.gray',
    title: 'Theme Color: gray',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'colors', isDescedants: false },
          { element: 'colors.gray', isDescedants: false },
          { element: 'colors.gray', isDescedants: true }
        ]
      },
      { isInclude: true, exprs: [{ elementKind: 'compound', isEqual: true }] },
      { targets: [{ elementKind: 'compound', isEqual: true }], style: { color: 'gray' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 2002,
    height: 712,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['colors.gray'],
        inEdges: [],
        outEdges: ['colors:compoundtest.compound1'],
        navigateTo: 'themecolors',
        position: [0, 1],
        size: { width: 1262, height: 663 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 15],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'GRAY',
        id: 'colors.gray',
        parent: 'colors',
        level: 1,
        color: 'gray',
        shape: 'rectangle',
        children: [
          'colors.gray.person',
          'colors.gray.rect',
          'colors.gray.browser',
          'colors.gray.mobile',
          'colors.gray.cylinder',
          'colors.gray.queue'
        ],
        inEdges: [],
        outEdges: ['colors.gray:compoundtest.compound1'],
        position: [40, 67],
        size: { width: 1182, height: 557 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'GRAY',
            pt: [11, 16],
            align: 'left',
            width: 38
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 1',
        id: 'compoundtest.compound1',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2'],
        inEdges: ['colors.gray:compoundtest.compound1', 'colors:compoundtest.compound1'],
        outEdges: [],
        position: [1282, 0],
        size: { width: 720, height: 712 },
        depth: 5,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 1',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 2',
        id: 'compoundtest.compound1.compound2',
        parent: 'compoundtest.compound1',
        level: 1,
        color: 'gray',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3'],
        inEdges: [],
        outEdges: [],
        position: [1322, 67],
        size: { width: 640, height: 605 },
        depth: 4,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 2',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 3',
        id: 'compoundtest.compound1.compound2.compound3',
        parent: 'compoundtest.compound1.compound2',
        level: 2,
        color: 'gray',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4'],
        inEdges: [],
        outEdges: [],
        position: [1362, 133],
        size: { width: 560, height: 499 },
        depth: 3,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 3',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 4',
        id: 'compoundtest.compound1.compound2.compound3.compound4',
        parent: 'compoundtest.compound1.compound2.compound3',
        level: 3,
        color: 'gray',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5'],
        inEdges: [],
        outEdges: [],
        position: [1402, 199],
        size: { width: 480, height: 393 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 4',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 5',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        parent: 'compoundtest.compound1.compound2.compound3.compound4',
        level: 4,
        color: 'gray',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5.compound6'],
        inEdges: [],
        outEdges: [],
        position: [1442, 266],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 5',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 6',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5.compound6',
        parent: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        level: 5,
        color: 'gray',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [],
        position: [1481, 332],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Level 6',
            pt: [131, 95],
            align: 'left',
            width: 61
          }
        ]
      },
      {
        description: 'Example of Person Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'person',
        title: 'Person',
        id: 'colors.gray.person',
        parent: 'colors.gray',
        level: 2,
        color: 'gray',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['colors.gray.person:colors.gray.rect'],
        position: [861, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Person',
            pt: [131, 83],
            align: 'left',
            width: 60
          },
          {
            fontSize: 14,
            color: '#e5e5e5',
            text: 'Example of Person Shape',
            pt: [83, 110],
            align: 'left',
            width: 155
          }
        ]
      },
      {
        description: 'Example of Rectangle Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'rect',
        title: 'Rectangle',
        id: 'colors.gray.rect',
        parent: 'colors.gray',
        level: 2,
        color: 'gray',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.gray.person:colors.gray.rect'],
        outEdges: [],
        position: [861, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Rectangle',
            pt: [119, 83],
            align: 'left',
            width: 85
          },
          {
            fontSize: 14,
            color: '#e5e5e5',
            text: 'Example of Rectangle Shape',
            pt: [74, 110],
            align: 'left',
            width: 173
          }
        ]
      },
      {
        description: 'Example of Browser Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'browser',
        title: 'Browser',
        id: 'colors.gray.browser',
        parent: 'colors.gray',
        level: 2,
        color: 'gray',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['colors.gray.browser:colors.gray.mobile'],
        position: [470, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Browser',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e5e5e5',
            text: 'Example of Browser Shape',
            pt: [80, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Mobile Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobile',
        title: 'Mobile',
        id: 'colors.gray.mobile',
        parent: 'colors.gray',
        level: 2,
        color: 'gray',
        shape: 'mobile',
        children: [],
        inEdges: ['colors.gray.browser:colors.gray.mobile'],
        outEdges: [],
        position: [470, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Mobile',
            pt: [134, 83],
            align: 'left',
            width: 55
          },
          {
            fontSize: 14,
            color: '#e5e5e5',
            text: 'Example of Mobile Shape',
            pt: [85, 110],
            align: 'left',
            width: 152
          }
        ]
      },
      {
        description: 'Example of Cylinder Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'cylinder',
        title: 'Cylinder',
        id: 'colors.gray.cylinder',
        parent: 'colors.gray',
        level: 2,
        color: 'gray',
        shape: 'cylinder',
        children: [],
        inEdges: [],
        outEdges: ['colors.gray.cylinder:colors.gray.queue'],
        position: [79, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Cylinder',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#e5e5e5',
            text: 'Example of Cylinder Shape',
            pt: [81, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Queue Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'queue',
        title: 'Queue',
        id: 'colors.gray.queue',
        parent: 'colors.gray',
        level: 2,
        color: 'gray',
        shape: 'queue',
        children: [],
        inEdges: ['colors.gray.cylinder:colors.gray.queue'],
        outEdges: [],
        position: [79, 413],
        size: { width: 321, height: 161 },
        labels: [
          {
            fontSize: 19,
            color: '#fafafa',
            text: 'Queue',
            pt: [133, 74],
            align: 'left',
            width: 57
          },
          {
            fontSize: 14,
            color: '#e5e5e5',
            text: 'Example of Queue Shape',
            pt: [85, 101],
            align: 'left',
            width: 153
          }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.gray.cylinder:colors.gray.queue',
        parent: 'colors.gray',
        source: 'colors.gray.cylinder',
        target: 'colors.gray.queue',
        label: null,
        relations: ['e8b475d684381361e937e93d5e0370a03a6cd972'],
        points: [
          [240, 314],
          [240, 342],
          [240, 372],
          [240, 399],
          [240, 414]
        ],
        labels: [],
        headArrow: [
          [244, 399],
          [240, 410],
          [237, 399]
        ]
      },
      {
        id: 'colors.gray.browser:colors.gray.mobile',
        parent: 'colors.gray',
        source: 'colors.gray.browser',
        target: 'colors.gray.mobile',
        label: null,
        relations: ['bbd717c933302154464cd68654fafdf9cd0963e4'],
        points: [
          [631, 313],
          [631, 337],
          [631, 364],
          [631, 389],
          [631, 404]
        ],
        labels: [],
        headArrow: [
          [635, 389],
          [631, 400],
          [627, 389]
        ]
      },
      {
        id: 'colors.gray.person:colors.gray.rect',
        parent: 'colors.gray',
        source: 'colors.gray.person',
        target: 'colors.gray.rect',
        label: null,
        relations: ['b4047bb61746d60f774d79f5b5c31bc4e8178044'],
        points: [
          [1022, 313],
          [1022, 337],
          [1022, 364],
          [1022, 389],
          [1022, 404]
        ],
        labels: [],
        headArrow: [
          [1026, 389],
          [1022, 400],
          [1018, 389]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolor_red: {
    id: 'themecolor_red',
    viewOf: 'colors.red',
    title: 'Theme Color: red',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'colors', isDescedants: false },
          { element: 'colors.red', isDescedants: false },
          { element: 'colors.red', isDescedants: true }
        ]
      },
      { isInclude: true, exprs: [{ elementKind: 'compound', isEqual: true }] },
      { targets: [{ elementKind: 'compound', isEqual: true }], style: { color: 'red' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 2002,
    height: 712,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['colors.red'],
        inEdges: [],
        outEdges: ['colors:compoundtest.compound1'],
        navigateTo: 'themecolors',
        position: [0, 1],
        size: { width: 1262, height: 663 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 15],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'RED',
        id: 'colors.red',
        parent: 'colors',
        level: 1,
        color: 'red',
        shape: 'rectangle',
        children: [
          'colors.red.person',
          'colors.red.rect',
          'colors.red.browser',
          'colors.red.mobile',
          'colors.red.cylinder',
          'colors.red.queue'
        ],
        inEdges: [],
        outEdges: ['colors.red:compoundtest.compound1'],
        position: [40, 67],
        size: { width: 1182, height: 557 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'RED',
            pt: [11, 16],
            align: 'left',
            width: 28
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 1',
        id: 'compoundtest.compound1',
        parent: null,
        level: 0,
        color: 'red',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2'],
        inEdges: ['colors.red:compoundtest.compound1', 'colors:compoundtest.compound1'],
        outEdges: [],
        position: [1282, 0],
        size: { width: 720, height: 712 },
        depth: 5,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 1',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 2',
        id: 'compoundtest.compound1.compound2',
        parent: 'compoundtest.compound1',
        level: 1,
        color: 'red',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3'],
        inEdges: [],
        outEdges: [],
        position: [1322, 67],
        size: { width: 640, height: 605 },
        depth: 4,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 2',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 3',
        id: 'compoundtest.compound1.compound2.compound3',
        parent: 'compoundtest.compound1.compound2',
        level: 2,
        color: 'red',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4'],
        inEdges: [],
        outEdges: [],
        position: [1362, 133],
        size: { width: 560, height: 499 },
        depth: 3,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 3',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 4',
        id: 'compoundtest.compound1.compound2.compound3.compound4',
        parent: 'compoundtest.compound1.compound2.compound3',
        level: 3,
        color: 'red',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5'],
        inEdges: [],
        outEdges: [],
        position: [1402, 199],
        size: { width: 480, height: 393 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 4',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 5',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        parent: 'compoundtest.compound1.compound2.compound3.compound4',
        level: 4,
        color: 'red',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5.compound6'],
        inEdges: [],
        outEdges: [],
        position: [1442, 266],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 5',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 6',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5.compound6',
        parent: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        level: 5,
        color: 'red',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [],
        position: [1481, 332],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Level 6',
            pt: [131, 95],
            align: 'left',
            width: 61
          }
        ]
      },
      {
        description: 'Example of Person Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'person',
        title: 'Person',
        id: 'colors.red.person',
        parent: 'colors.red',
        level: 2,
        color: 'red',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['colors.red.person:colors.red.rect'],
        position: [861, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Person',
            pt: [131, 83],
            align: 'left',
            width: 60
          },
          {
            fontSize: 14,
            color: '#f9c6c6',
            text: 'Example of Person Shape',
            pt: [83, 110],
            align: 'left',
            width: 155
          }
        ]
      },
      {
        description: 'Example of Rectangle Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'rect',
        title: 'Rectangle',
        id: 'colors.red.rect',
        parent: 'colors.red',
        level: 2,
        color: 'red',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.red.person:colors.red.rect'],
        outEdges: [],
        position: [861, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Rectangle',
            pt: [119, 83],
            align: 'left',
            width: 85
          },
          {
            fontSize: 14,
            color: '#f9c6c6',
            text: 'Example of Rectangle Shape',
            pt: [74, 110],
            align: 'left',
            width: 173
          }
        ]
      },
      {
        description: 'Example of Browser Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'browser',
        title: 'Browser',
        id: 'colors.red.browser',
        parent: 'colors.red',
        level: 2,
        color: 'red',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['colors.red.browser:colors.red.mobile'],
        position: [470, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Browser',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#f9c6c6',
            text: 'Example of Browser Shape',
            pt: [80, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Mobile Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobile',
        title: 'Mobile',
        id: 'colors.red.mobile',
        parent: 'colors.red',
        level: 2,
        color: 'red',
        shape: 'mobile',
        children: [],
        inEdges: ['colors.red.browser:colors.red.mobile'],
        outEdges: [],
        position: [470, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Mobile',
            pt: [134, 83],
            align: 'left',
            width: 55
          },
          {
            fontSize: 14,
            color: '#f9c6c6',
            text: 'Example of Mobile Shape',
            pt: [85, 110],
            align: 'left',
            width: 152
          }
        ]
      },
      {
        description: 'Example of Cylinder Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'cylinder',
        title: 'Cylinder',
        id: 'colors.red.cylinder',
        parent: 'colors.red',
        level: 2,
        color: 'red',
        shape: 'cylinder',
        children: [],
        inEdges: [],
        outEdges: ['colors.red.cylinder:colors.red.queue'],
        position: [79, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Cylinder',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#f9c6c6',
            text: 'Example of Cylinder Shape',
            pt: [81, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Queue Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'queue',
        title: 'Queue',
        id: 'colors.red.queue',
        parent: 'colors.red',
        level: 2,
        color: 'red',
        shape: 'queue',
        children: [],
        inEdges: ['colors.red.cylinder:colors.red.queue'],
        outEdges: [],
        position: [79, 413],
        size: { width: 321, height: 161 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Queue',
            pt: [133, 74],
            align: 'left',
            width: 57
          },
          {
            fontSize: 14,
            color: '#f9c6c6',
            text: 'Example of Queue Shape',
            pt: [85, 101],
            align: 'left',
            width: 153
          }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.red.cylinder:colors.red.queue',
        parent: 'colors.red',
        source: 'colors.red.cylinder',
        target: 'colors.red.queue',
        label: null,
        relations: ['810467b4b2777c52917c8d15f859d1d112a0b918'],
        points: [
          [240, 314],
          [240, 342],
          [240, 372],
          [240, 399],
          [240, 414]
        ],
        labels: [],
        headArrow: [
          [244, 399],
          [240, 410],
          [237, 399]
        ]
      },
      {
        id: 'colors.red.browser:colors.red.mobile',
        parent: 'colors.red',
        source: 'colors.red.browser',
        target: 'colors.red.mobile',
        label: null,
        relations: ['4d3f4c3aea066bbc712f88c6db55a3f7c0d9981e'],
        points: [
          [631, 313],
          [631, 337],
          [631, 364],
          [631, 389],
          [631, 404]
        ],
        labels: [],
        headArrow: [
          [635, 389],
          [631, 400],
          [627, 389]
        ]
      },
      {
        id: 'colors.red.person:colors.red.rect',
        parent: 'colors.red',
        source: 'colors.red.person',
        target: 'colors.red.rect',
        label: null,
        relations: ['e3fea3cb12e4104b8d6b0f2e20a3171763eb975f'],
        points: [
          [1022, 313],
          [1022, 337],
          [1022, 364],
          [1022, 389],
          [1022, 404]
        ],
        labels: [],
        headArrow: [
          [1026, 389],
          [1022, 400],
          [1018, 389]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolor_green: {
    id: 'themecolor_green',
    viewOf: 'colors.green',
    title: 'Theme Color: green',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'colors', isDescedants: false },
          { element: 'colors.green', isDescedants: false },
          { element: 'colors.green', isDescedants: true }
        ]
      },
      { isInclude: true, exprs: [{ elementKind: 'compound', isEqual: true }] },
      { targets: [{ elementKind: 'compound', isEqual: true }], style: { color: 'green' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 2002,
    height: 712,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['colors.green'],
        inEdges: [],
        outEdges: ['colors:compoundtest.compound1'],
        navigateTo: 'themecolors',
        position: [0, 1],
        size: { width: 1262, height: 663 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 15],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'GREEN',
        id: 'colors.green',
        parent: 'colors',
        level: 1,
        color: 'green',
        shape: 'rectangle',
        children: [
          'colors.green.person',
          'colors.green.rect',
          'colors.green.browser',
          'colors.green.mobile',
          'colors.green.cylinder',
          'colors.green.queue'
        ],
        inEdges: [],
        outEdges: ['colors.green:compoundtest.compound1'],
        position: [40, 67],
        size: { width: 1182, height: 557 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'GREEN',
            pt: [11, 16],
            align: 'left',
            width: 47
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 1',
        id: 'compoundtest.compound1',
        parent: null,
        level: 0,
        color: 'green',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2'],
        inEdges: ['colors.green:compoundtest.compound1', 'colors:compoundtest.compound1'],
        outEdges: [],
        position: [1282, 0],
        size: { width: 720, height: 712 },
        depth: 5,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 1',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 2',
        id: 'compoundtest.compound1.compound2',
        parent: 'compoundtest.compound1',
        level: 1,
        color: 'green',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3'],
        inEdges: [],
        outEdges: [],
        position: [1322, 67],
        size: { width: 640, height: 605 },
        depth: 4,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 2',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 3',
        id: 'compoundtest.compound1.compound2.compound3',
        parent: 'compoundtest.compound1.compound2',
        level: 2,
        color: 'green',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4'],
        inEdges: [],
        outEdges: [],
        position: [1362, 133],
        size: { width: 560, height: 499 },
        depth: 3,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 3',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 4',
        id: 'compoundtest.compound1.compound2.compound3.compound4',
        parent: 'compoundtest.compound1.compound2.compound3',
        level: 3,
        color: 'green',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5'],
        inEdges: [],
        outEdges: [],
        position: [1402, 199],
        size: { width: 480, height: 393 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 4',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 5',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        parent: 'compoundtest.compound1.compound2.compound3.compound4',
        level: 4,
        color: 'green',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5.compound6'],
        inEdges: [],
        outEdges: [],
        position: [1442, 266],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 5',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 6',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5.compound6',
        parent: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        level: 5,
        color: 'green',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [],
        position: [1481, 332],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Level 6',
            pt: [131, 95],
            align: 'left',
            width: 61
          }
        ]
      },
      {
        description: 'Example of Person Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'person',
        title: 'Person',
        id: 'colors.green.person',
        parent: 'colors.green',
        level: 2,
        color: 'green',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['colors.green.person:colors.green.rect'],
        position: [861, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Person',
            pt: [131, 83],
            align: 'left',
            width: 60
          },
          {
            fontSize: 14,
            color: '#c2f0c2',
            text: 'Example of Person Shape',
            pt: [83, 110],
            align: 'left',
            width: 155
          }
        ]
      },
      {
        description: 'Example of Rectangle Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'rect',
        title: 'Rectangle',
        id: 'colors.green.rect',
        parent: 'colors.green',
        level: 2,
        color: 'green',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.green.person:colors.green.rect'],
        outEdges: [],
        position: [861, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Rectangle',
            pt: [119, 83],
            align: 'left',
            width: 85
          },
          {
            fontSize: 14,
            color: '#c2f0c2',
            text: 'Example of Rectangle Shape',
            pt: [74, 110],
            align: 'left',
            width: 173
          }
        ]
      },
      {
        description: 'Example of Browser Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'browser',
        title: 'Browser',
        id: 'colors.green.browser',
        parent: 'colors.green',
        level: 2,
        color: 'green',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['colors.green.browser:colors.green.mobile'],
        position: [470, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Browser',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#c2f0c2',
            text: 'Example of Browser Shape',
            pt: [80, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Mobile Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobile',
        title: 'Mobile',
        id: 'colors.green.mobile',
        parent: 'colors.green',
        level: 2,
        color: 'green',
        shape: 'mobile',
        children: [],
        inEdges: ['colors.green.browser:colors.green.mobile'],
        outEdges: [],
        position: [470, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Mobile',
            pt: [134, 83],
            align: 'left',
            width: 55
          },
          {
            fontSize: 14,
            color: '#c2f0c2',
            text: 'Example of Mobile Shape',
            pt: [85, 110],
            align: 'left',
            width: 152
          }
        ]
      },
      {
        description: 'Example of Cylinder Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'cylinder',
        title: 'Cylinder',
        id: 'colors.green.cylinder',
        parent: 'colors.green',
        level: 2,
        color: 'green',
        shape: 'cylinder',
        children: [],
        inEdges: [],
        outEdges: ['colors.green.cylinder:colors.green.queue'],
        position: [79, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Cylinder',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#c2f0c2',
            text: 'Example of Cylinder Shape',
            pt: [81, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Queue Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'queue',
        title: 'Queue',
        id: 'colors.green.queue',
        parent: 'colors.green',
        level: 2,
        color: 'green',
        shape: 'queue',
        children: [],
        inEdges: ['colors.green.cylinder:colors.green.queue'],
        outEdges: [],
        position: [79, 413],
        size: { width: 321, height: 161 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Queue',
            pt: [133, 74],
            align: 'left',
            width: 57
          },
          {
            fontSize: 14,
            color: '#c2f0c2',
            text: 'Example of Queue Shape',
            pt: [85, 101],
            align: 'left',
            width: 153
          }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.green.cylinder:colors.green.queue',
        parent: 'colors.green',
        source: 'colors.green.cylinder',
        target: 'colors.green.queue',
        label: null,
        relations: ['d34b9022476bd0e0a6bfa3ef95090501ddfdd033'],
        points: [
          [240, 314],
          [240, 342],
          [240, 372],
          [240, 399],
          [240, 414]
        ],
        labels: [],
        headArrow: [
          [244, 399],
          [240, 410],
          [237, 399]
        ]
      },
      {
        id: 'colors.green.browser:colors.green.mobile',
        parent: 'colors.green',
        source: 'colors.green.browser',
        target: 'colors.green.mobile',
        label: null,
        relations: ['cb6a2cb50c923ee2f4420e9896bfc3a15b246367'],
        points: [
          [631, 313],
          [631, 337],
          [631, 364],
          [631, 389],
          [631, 404]
        ],
        labels: [],
        headArrow: [
          [635, 389],
          [631, 400],
          [627, 389]
        ]
      },
      {
        id: 'colors.green.person:colors.green.rect',
        parent: 'colors.green',
        source: 'colors.green.person',
        target: 'colors.green.rect',
        label: null,
        relations: ['7d7560590dd0d5222bc0c1de17bc20958140e3a6'],
        points: [
          [1022, 313],
          [1022, 337],
          [1022, 364],
          [1022, 389],
          [1022, 404]
        ],
        labels: [],
        headArrow: [
          [1026, 389],
          [1022, 400],
          [1018, 389]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolor_amber: {
    id: 'themecolor_amber',
    viewOf: 'colors.amber',
    title: 'Theme Color: amber',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'colors', isDescedants: false },
          { element: 'colors.amber', isDescedants: false },
          { element: 'colors.amber', isDescedants: true }
        ]
      },
      { isInclude: true, exprs: [{ elementKind: 'compound', isEqual: true }] },
      { targets: [{ elementKind: 'compound', isEqual: true }], style: { color: 'amber' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 2002,
    height: 712,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['colors.amber'],
        inEdges: [],
        outEdges: ['colors:compoundtest.compound1'],
        navigateTo: 'themecolors',
        position: [0, 1],
        size: { width: 1262, height: 663 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 15],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'AMBER',
        id: 'colors.amber',
        parent: 'colors',
        level: 1,
        color: 'amber',
        shape: 'rectangle',
        children: [
          'colors.amber.person',
          'colors.amber.rect',
          'colors.amber.browser',
          'colors.amber.mobile',
          'colors.amber.cylinder',
          'colors.amber.queue'
        ],
        inEdges: [],
        outEdges: ['colors.amber:compoundtest.compound1'],
        position: [40, 67],
        size: { width: 1182, height: 557 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'AMBER',
            pt: [11, 16],
            align: 'left',
            width: 48
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 1',
        id: 'compoundtest.compound1',
        parent: null,
        level: 0,
        color: 'amber',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2'],
        inEdges: ['colors.amber:compoundtest.compound1', 'colors:compoundtest.compound1'],
        outEdges: [],
        position: [1282, 0],
        size: { width: 720, height: 712 },
        depth: 5,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 1',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 2',
        id: 'compoundtest.compound1.compound2',
        parent: 'compoundtest.compound1',
        level: 1,
        color: 'amber',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3'],
        inEdges: [],
        outEdges: [],
        position: [1322, 67],
        size: { width: 640, height: 605 },
        depth: 4,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 2',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 3',
        id: 'compoundtest.compound1.compound2.compound3',
        parent: 'compoundtest.compound1.compound2',
        level: 2,
        color: 'amber',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4'],
        inEdges: [],
        outEdges: [],
        position: [1362, 133],
        size: { width: 560, height: 499 },
        depth: 3,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 3',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 4',
        id: 'compoundtest.compound1.compound2.compound3.compound4',
        parent: 'compoundtest.compound1.compound2.compound3',
        level: 3,
        color: 'amber',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5'],
        inEdges: [],
        outEdges: [],
        position: [1402, 199],
        size: { width: 480, height: 393 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 4',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 5',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        parent: 'compoundtest.compound1.compound2.compound3.compound4',
        level: 4,
        color: 'amber',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5.compound6'],
        inEdges: [],
        outEdges: [],
        position: [1442, 266],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 5',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 6',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5.compound6',
        parent: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        level: 5,
        color: 'amber',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [],
        position: [1481, 332],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Level 6',
            pt: [131, 95],
            align: 'left',
            width: 61
          }
        ]
      },
      {
        description: 'Example of Person Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'person',
        title: 'Person',
        id: 'colors.amber.person',
        parent: 'colors.amber',
        level: 2,
        color: 'amber',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['colors.amber.person:colors.amber.rect'],
        position: [861, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Person',
            pt: [131, 83],
            align: 'left',
            width: 60
          },
          {
            fontSize: 14,
            color: '#ffe0c2',
            text: 'Example of Person Shape',
            pt: [83, 110],
            align: 'left',
            width: 155
          }
        ]
      },
      {
        description: 'Example of Rectangle Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'rect',
        title: 'Rectangle',
        id: 'colors.amber.rect',
        parent: 'colors.amber',
        level: 2,
        color: 'amber',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.amber.person:colors.amber.rect'],
        outEdges: [],
        position: [861, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Rectangle',
            pt: [119, 83],
            align: 'left',
            width: 85
          },
          {
            fontSize: 14,
            color: '#ffe0c2',
            text: 'Example of Rectangle Shape',
            pt: [74, 110],
            align: 'left',
            width: 173
          }
        ]
      },
      {
        description: 'Example of Browser Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'browser',
        title: 'Browser',
        id: 'colors.amber.browser',
        parent: 'colors.amber',
        level: 2,
        color: 'amber',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['colors.amber.browser:colors.amber.mobile'],
        position: [470, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Browser',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#ffe0c2',
            text: 'Example of Browser Shape',
            pt: [80, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Mobile Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobile',
        title: 'Mobile',
        id: 'colors.amber.mobile',
        parent: 'colors.amber',
        level: 2,
        color: 'amber',
        shape: 'mobile',
        children: [],
        inEdges: ['colors.amber.browser:colors.amber.mobile'],
        outEdges: [],
        position: [470, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Mobile',
            pt: [134, 83],
            align: 'left',
            width: 55
          },
          {
            fontSize: 14,
            color: '#ffe0c2',
            text: 'Example of Mobile Shape',
            pt: [85, 110],
            align: 'left',
            width: 152
          }
        ]
      },
      {
        description: 'Example of Cylinder Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'cylinder',
        title: 'Cylinder',
        id: 'colors.amber.cylinder',
        parent: 'colors.amber',
        level: 2,
        color: 'amber',
        shape: 'cylinder',
        children: [],
        inEdges: [],
        outEdges: ['colors.amber.cylinder:colors.amber.queue'],
        position: [79, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Cylinder',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#ffe0c2',
            text: 'Example of Cylinder Shape',
            pt: [81, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Queue Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'queue',
        title: 'Queue',
        id: 'colors.amber.queue',
        parent: 'colors.amber',
        level: 2,
        color: 'amber',
        shape: 'queue',
        children: [],
        inEdges: ['colors.amber.cylinder:colors.amber.queue'],
        outEdges: [],
        position: [79, 413],
        size: { width: 321, height: 161 },
        labels: [
          {
            fontSize: 19,
            color: '#f8fafc',
            text: 'Queue',
            pt: [133, 74],
            align: 'left',
            width: 57
          },
          {
            fontSize: 14,
            color: '#ffe0c2',
            text: 'Example of Queue Shape',
            pt: [85, 101],
            align: 'left',
            width: 153
          }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.amber.cylinder:colors.amber.queue',
        parent: 'colors.amber',
        source: 'colors.amber.cylinder',
        target: 'colors.amber.queue',
        label: null,
        relations: ['4fb38e1c297ac181cf9372112e12e03095bbb22c'],
        points: [
          [240, 314],
          [240, 342],
          [240, 372],
          [240, 399],
          [240, 414]
        ],
        labels: [],
        headArrow: [
          [244, 399],
          [240, 410],
          [237, 399]
        ]
      },
      {
        id: 'colors.amber.browser:colors.amber.mobile',
        parent: 'colors.amber',
        source: 'colors.amber.browser',
        target: 'colors.amber.mobile',
        label: null,
        relations: ['35e240e50481c99418bbe7364573a7f56509f7dd'],
        points: [
          [631, 313],
          [631, 337],
          [631, 364],
          [631, 389],
          [631, 404]
        ],
        labels: [],
        headArrow: [
          [635, 389],
          [631, 400],
          [627, 389]
        ]
      },
      {
        id: 'colors.amber.person:colors.amber.rect',
        parent: 'colors.amber',
        source: 'colors.amber.person',
        target: 'colors.amber.rect',
        label: null,
        relations: ['fa5dec396ce516d755d1371d806208e9f2a935cc'],
        points: [
          [1022, 313],
          [1022, 337],
          [1022, 364],
          [1022, 389],
          [1022, 404]
        ],
        labels: [],
        headArrow: [
          [1026, 389],
          [1022, 400],
          [1018, 389]
        ]
      }
    ]
  } as unknown as DiagramView,
  themecolor_indigo: {
    id: 'themecolor_indigo',
    viewOf: 'colors.indigo',
    title: 'Theme Color: indigo',
    description: null,
    tags: null,
    links: null,
    docUri:
      'file:///Users/davydkov/Projects/like-c4/likec4/packages/diagrams/src/stories/likec4/theme.c4',
    rules: [
      {
        isInclude: true,
        exprs: [
          { element: 'colors', isDescedants: false },
          { element: 'colors.indigo', isDescedants: false },
          { element: 'colors.indigo', isDescedants: true }
        ]
      },
      { isInclude: true, exprs: [{ elementKind: 'compound', isEqual: true }] },
      { targets: [{ elementKind: 'compound', isEqual: true }], style: { color: 'indigo' } }
    ],
    relativePath: '',
    autoLayout: 'TB',
    width: 2002,
    height: 712,
    nodes: [
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'Theme Colors',
        id: 'colors',
        parent: null,
        level: 0,
        color: 'gray',
        shape: 'rectangle',
        children: ['colors.indigo'],
        inEdges: [],
        outEdges: ['colors:compoundtest.compound1'],
        navigateTo: 'themecolors',
        position: [0, 1],
        size: { width: 1262, height: 663 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'THEME COLORS',
            pt: [11, 15],
            align: 'left',
            width: 105
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'themecolor',
        title: 'INDIGO',
        id: 'colors.indigo',
        parent: 'colors',
        level: 1,
        color: 'indigo',
        shape: 'rectangle',
        children: [
          'colors.indigo.person',
          'colors.indigo.rect',
          'colors.indigo.browser',
          'colors.indigo.mobile',
          'colors.indigo.cylinder',
          'colors.indigo.queue'
        ],
        inEdges: [],
        outEdges: ['colors.indigo:compoundtest.compound1'],
        position: [40, 67],
        size: { width: 1182, height: 557 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'INDIGO',
            pt: [11, 16],
            align: 'left',
            width: 47
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 1',
        id: 'compoundtest.compound1',
        parent: null,
        level: 0,
        color: 'indigo',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2'],
        inEdges: ['colors.indigo:compoundtest.compound1', 'colors:compoundtest.compound1'],
        outEdges: [],
        position: [1282, 0],
        size: { width: 720, height: 712 },
        depth: 5,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 1',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 2',
        id: 'compoundtest.compound1.compound2',
        parent: 'compoundtest.compound1',
        level: 1,
        color: 'indigo',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3'],
        inEdges: [],
        outEdges: [],
        position: [1322, 67],
        size: { width: 640, height: 605 },
        depth: 4,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 2',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 3',
        id: 'compoundtest.compound1.compound2.compound3',
        parent: 'compoundtest.compound1.compound2',
        level: 2,
        color: 'indigo',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4'],
        inEdges: [],
        outEdges: [],
        position: [1362, 133],
        size: { width: 560, height: 499 },
        depth: 3,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 3',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 4',
        id: 'compoundtest.compound1.compound2.compound3.compound4',
        parent: 'compoundtest.compound1.compound2.compound3',
        level: 3,
        color: 'indigo',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5'],
        inEdges: [],
        outEdges: [],
        position: [1402, 199],
        size: { width: 480, height: 393 },
        depth: 2,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 4',
            pt: [10, 16],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 5',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        parent: 'compoundtest.compound1.compound2.compound3.compound4',
        level: 4,
        color: 'indigo',
        shape: 'rectangle',
        children: ['compoundtest.compound1.compound2.compound3.compound4.compound5.compound6'],
        inEdges: [],
        outEdges: [],
        position: [1442, 266],
        size: { width: 400, height: 286 },
        depth: 1,
        labels: [
          {
            fontSize: 13,
            fontStyle: 'bold',
            color: '#000000',
            text: 'LEVEL 5',
            pt: [10, 15],
            align: 'left',
            width: 53
          }
        ]
      },
      {
        description: null,
        technology: null,
        tags: null,
        links: null,
        kind: 'compound',
        title: 'Level 6',
        id: 'compoundtest.compound1.compound2.compound3.compound4.compound5.compound6',
        parent: 'compoundtest.compound1.compound2.compound3.compound4.compound5',
        level: 5,
        color: 'indigo',
        shape: 'rectangle',
        children: [],
        inEdges: [],
        outEdges: [],
        position: [1481, 332],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'Level 6',
            pt: [131, 95],
            align: 'left',
            width: 61
          }
        ]
      },
      {
        description: 'Example of Person Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'person',
        title: 'Person',
        id: 'colors.indigo.person',
        parent: 'colors.indigo',
        level: 2,
        color: 'indigo',
        shape: 'person',
        children: [],
        inEdges: [],
        outEdges: ['colors.indigo.person:colors.indigo.rect'],
        position: [861, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'Person',
            pt: [131, 83],
            align: 'left',
            width: 60
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'Example of Person Shape',
            pt: [83, 110],
            align: 'left',
            width: 155
          }
        ]
      },
      {
        description: 'Example of Rectangle Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'rect',
        title: 'Rectangle',
        id: 'colors.indigo.rect',
        parent: 'colors.indigo',
        level: 2,
        color: 'indigo',
        shape: 'rectangle',
        children: [],
        inEdges: ['colors.indigo.person:colors.indigo.rect'],
        outEdges: [],
        position: [861, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'Rectangle',
            pt: [119, 83],
            align: 'left',
            width: 85
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'Example of Rectangle Shape',
            pt: [74, 110],
            align: 'left',
            width: 173
          }
        ]
      },
      {
        description: 'Example of Browser Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'browser',
        title: 'Browser',
        id: 'colors.indigo.browser',
        parent: 'colors.indigo',
        level: 2,
        color: 'indigo',
        shape: 'browser',
        children: [],
        inEdges: [],
        outEdges: ['colors.indigo.browser:colors.indigo.mobile'],
        position: [470, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'Browser',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'Example of Browser Shape',
            pt: [80, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Mobile Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'mobile',
        title: 'Mobile',
        id: 'colors.indigo.mobile',
        parent: 'colors.indigo',
        level: 2,
        color: 'indigo',
        shape: 'mobile',
        children: [],
        inEdges: ['colors.indigo.browser:colors.indigo.mobile'],
        outEdges: [],
        position: [470, 404],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'Mobile',
            pt: [134, 83],
            align: 'left',
            width: 55
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'Example of Mobile Shape',
            pt: [85, 110],
            align: 'left',
            width: 152
          }
        ]
      },
      {
        description: 'Example of Cylinder Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'cylinder',
        title: 'Cylinder',
        id: 'colors.indigo.cylinder',
        parent: 'colors.indigo',
        level: 2,
        color: 'indigo',
        shape: 'cylinder',
        children: [],
        inEdges: [],
        outEdges: ['colors.indigo.cylinder:colors.indigo.queue'],
        position: [79, 133],
        size: { width: 321, height: 180 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'Cylinder',
            pt: [127, 83],
            align: 'left',
            width: 69
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'Example of Cylinder Shape',
            pt: [81, 110],
            align: 'left',
            width: 162
          }
        ]
      },
      {
        description: 'Example of Queue Shape',
        technology: null,
        tags: null,
        links: null,
        kind: 'queue',
        title: 'Queue',
        id: 'colors.indigo.queue',
        parent: 'colors.indigo',
        level: 2,
        color: 'indigo',
        shape: 'queue',
        children: [],
        inEdges: ['colors.indigo.cylinder:colors.indigo.queue'],
        outEdges: [],
        position: [79, 413],
        size: { width: 321, height: 161 },
        labels: [
          {
            fontSize: 19,
            color: '#eef2ff',
            text: 'Queue',
            pt: [133, 74],
            align: 'left',
            width: 57
          },
          {
            fontSize: 14,
            color: '#c7d2fe',
            text: 'Example of Queue Shape',
            pt: [85, 101],
            align: 'left',
            width: 153
          }
        ]
      }
    ],
    edges: [
      {
        id: 'colors.indigo.cylinder:colors.indigo.queue',
        parent: 'colors.indigo',
        source: 'colors.indigo.cylinder',
        target: 'colors.indigo.queue',
        label: null,
        relations: ['e9e5d97079994c8daf49b6d4c3751f39e6e6a1a7'],
        points: [
          [240, 314],
          [240, 342],
          [240, 372],
          [240, 399],
          [240, 414]
        ],
        labels: [],
        headArrow: [
          [244, 399],
          [240, 410],
          [237, 399]
        ]
      },
      {
        id: 'colors.indigo.browser:colors.indigo.mobile',
        parent: 'colors.indigo',
        source: 'colors.indigo.browser',
        target: 'colors.indigo.mobile',
        label: null,
        relations: ['aa95e7ec3a382476c753446a8ce4ef3a65cec10e'],
        points: [
          [631, 313],
          [631, 337],
          [631, 364],
          [631, 389],
          [631, 404]
        ],
        labels: [],
        headArrow: [
          [635, 389],
          [631, 400],
          [627, 389]
        ]
      },
      {
        id: 'colors.indigo.person:colors.indigo.rect',
        parent: 'colors.indigo',
        source: 'colors.indigo.person',
        target: 'colors.indigo.rect',
        label: null,
        relations: ['91eab4943ef8ed0674909437edde5be9114a49ce'],
        points: [
          [1022, 313],
          [1022, 337],
          [1022, 364],
          [1022, 389],
          [1022, 404]
        ],
        labels: [],
        headArrow: [
          [1026, 389],
          [1022, 400],
          [1018, 389]
        ]
      }
    ]
  } as unknown as DiagramView
} as const satisfies Record<LikeC4ViewId, DiagramView>

export type LikeC4Views = typeof LikeC4Views

export function isLikeC4ViewId(value: unknown): value is LikeC4ViewId {
  return (
    value != null &&
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(LikeC4Views, value)
  )
}

// Re-export types
export type {
  Fqn,
  Element,
  RelationID,
  Relation,
  NodeId,
  EdgeId,
  ComputedNode,
  ComputedEdge,
  ComputedView,
  DiagramView,
  DiagramNode,
  DiagramEdge,
  DiagramLabel
} from '@likec4/core'
