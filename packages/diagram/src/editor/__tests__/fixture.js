"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareFixtures = prepareFixtures;
var builder_1 = require("@likec4/core/builder");
var immer_1 = require("immer");
var remeda_1 = require("remeda");
var index_snapshot_json_1 = require("./index-snapshot.json");
/**
  Snapshot {@link indexSnapshot} is built from the model below.
=======
specification {
  element el
  element app
  tag tag-1
  tag tag-2
  tag tag-3
}

model {
  el customer 'Customer' {
    #tag-1 #tag-2
    description 'Uses services online'
  }

  el saas {
    #tag-1
    title 'SaaS Application'
    description 'Provides online services to customers'

    el frontend {
      #tag-2
      title 'Frontend'

      app spa {
        #tag-2
        title 'SPA'
        description 'Single Page Application'
        icon tech:react

        -> api
      }
      app pwa {
        #tag-2
        title 'PWA'
        description 'Progressive Web Application'
        icon tech:react

        -> api
      }
    }
    el backend {
      title 'Backend'

      el auth {
        title 'Auth'
        description 'Authentication'
      }

      el api {
        #tag-3
        title 'API'
        description 'REST API'
        icon tech:nodejs
      }

      el worker {
        title 'Worker'
        description 'Background processing'
      }

      api -> auth
      api -> worker
      api -> external.database
      worker -> external.email
    }

    frontend -> api {
      title 'requests'
      technology 'REST'
      description '''
  requests **data**
'''
    }
  }

  el external {
    title 'External'
    description 'External system'

    el email {
      title 'Email'
      description 'Email service'
    }

    el database {
      title 'Database'
      description 'External database'
    }
  }

  customer -> saas.frontend 'uses'

}

views {
  view index {
    title 'Landscape'
    description '''
      System _Landscape_

    '''

    include
      *,
      saas.**,
      external.**
  }
}

*/
/**
 * Builder that produces the model used to create {@link indexSnapshot}
 * Here for type safety and easy maintenance of the snapshot.
 */
function simplebuilder() {
    return builder_1.Builder
        .specification({
        elements: {
            el: {},
            app: {},
        },
        tags: {
            'tag-1': {},
            'tag-2': {},
            'tag-3': {},
        },
    })
        .model(function (_a, _) {
        var el = _a.el, app = _a.app, rel = _a.rel;
        return _(el('customer', {
            title: 'Customer',
            description: 'Uses services online',
            tags: ['tag-1', 'tag-2'],
        }), el('saas', {
            title: 'SaaS Application',
            description: 'Provides online services to customers',
            tags: ['tag-1'],
        }).with(el('frontend', {
            title: 'Frontend',
            tags: ['tag-2'],
        }).with(app('spa', {
            title: 'SPA',
            description: 'Single Page Application',
            icon: 'tech:react',
            tags: ['tag-2'],
        }), app('pwa', {
            title: 'PWA',
            description: 'Progressive Web Application',
            icon: 'tech:react',
            tags: ['tag-2'],
        })), el('backend', {
            title: 'Backend',
        }).with(el('auth', {
            title: 'Auth',
            description: 'Authentication',
        }), el('api', {
            title: 'API',
            description: 'REST API',
            icon: 'tech:nodejs',
            tags: ['tag-3'],
        }), el('worker', {
            title: 'Worker',
            description: 'Background processing',
        }))), el('external', {
            title: 'External',
            description: 'External system',
        }).with(el('email', {
            title: 'Email',
            description: 'Email service',
        }), el('database', {
            title: 'Database',
            description: 'External database',
        })), rel('saas.frontend.spa', 'saas.backend.api'), rel('saas.frontend.pwa', 'saas.backend.api'), rel('saas.backend.api', 'saas.backend.auth'), rel('saas.backend.api', 'saas.backend.worker'), rel('saas.backend.api', 'external.database'), rel('saas.backend.worker', 'external.email'), rel('saas.frontend', 'saas.backend.api', {
            title: 'requests',
            technology: 'REST',
            description: 'requests **data**',
        }), rel('customer', 'saas.frontend', {
            title: 'uses',
        }));
    })
        .views(function (_a, _) {
        var view = _a.view, $include = _a.$include;
        return _(view('index', {
            title: 'Landscape',
            description: 'System _Landscape_',
        }).with($include('*'), $include('saas.**'), $include('external.**')));
    });
}
function patch(obj, patcher) {
    if (!patcher) {
        return obj;
    }
    if (typeof patcher === 'function') {
        return (0, immer_1.produce)(obj, patcher);
    }
    else {
        return __assign(__assign({}, obj), patcher);
    }
}
/**
 * Helper to get a fixture with manual layout snapshot, and auto layouted view.
 * It takes {@link indexSnapshot} as base, applies provided patches
 * to return as auto-layouted.
 *
 * Patcher can modify view properties, nodes and edges by their ids.
 *
 * Nodes/Edges can be modified, removed (by setting to null/undefined), or added (by using new key).
 *
 * @example
 * const { snapshot, layouted } = prepareFixtures({
 *   nodes: {
 *     // Merge changes to the node
 *     'customer': {
 *       x: 100,
 *     },
 *     // Apply changes to existing node via immer
 *     'saas.api': d => {
 *       d.color = 'secondary'
 *     },
 *     // Remove node from snapshot
 *    'saas.frontend': null,
 *    // Add new node to layouted View
 *    'another': d => {
 *      d.title = 'Another Node'
 *   },
 *   edges: {
 *     // Merge changes to existing edge
 *     'edge1: customer to frontend': d => {
 *        d.source = 'another'
 *     },
 *     // Delete existing edge
 *    'edge2: frontend to api': null,
 *     // Add new edge (TS will check source/target ids)
 *     'customer -> another': {
 *       label: 'New Edge',
 *       source: 'customer',
 *       target: 'another',
 *     }
 *   }
 * }

 * })
 */
function prepareFixtures(patcher) {
    var snapshot = __assign(__assign({}, structuredClone(index_snapshot_json_1.default)), { _layout: 'manual' });
    var layouted = __assign(__assign({}, patch(structuredClone(snapshot), patcher === null || patcher === void 0 ? void 0 : patcher.view)), { _layout: 'auto' });
    if (patcher === null || patcher === void 0 ? void 0 : patcher.nodes) {
        var patchNodes_1 = __assign({}, patcher.nodes);
        var writableNodes = layouted.nodes = (0, remeda_1.pipe)(layouted.nodes, (0, remeda_1.filter)(function (n) { return !(n.id in patchNodes_1) || (0, remeda_1.isTruthy)(patchNodes_1[n.id]); }), (0, remeda_1.map)(function (n) {
            var nodePatcher = patchNodes_1[n.id];
            if (nodePatcher) {
                delete patchNodes_1[n.id];
                return patch(n, nodePatcher);
            }
            return n;
        }));
        // Add any remaining nodes in patchNodes that were not in the original snapshot
        for (var _i = 0, _a = Object.entries(patchNodes_1); _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], patcher_1 = _b[1];
            if ((0, remeda_1.isTruthy)(patcher_1)) {
                var baseNode = {
                    id: id,
                    title: 'New Node',
                    parent: null,
                    children: [],
                    inEdges: [],
                    outEdges: [],
                    x: 0,
                    y: 0,
                    width: 300,
                    height: 200,
                    kind: 'component',
                    color: 'primary',
                    shape: 'rectangle',
                    style: {},
                    level: 0,
                    tags: [],
                    labelBBox: { x: 0, y: 0, width: 0, height: 0 },
                };
                writableNodes.push(patch(baseNode, patcher_1));
            }
        }
    }
    if (patcher === null || patcher === void 0 ? void 0 : patcher.edges) {
        var patchEdges_1 = __assign({}, patcher.edges);
        var writableEdges = layouted.edges = (0, remeda_1.pipe)(layouted.edges, (0, remeda_1.filter)(function (n) { return !(n.id in patchEdges_1) || (0, remeda_1.isTruthy)(patchEdges_1[n.id]); }), (0, remeda_1.map)(function (n) {
            var edgePatcher = patchEdges_1[n.id];
            if (edgePatcher) {
                delete patchEdges_1[n.id];
                return patch(n, edgePatcher);
            }
            return n;
        }));
        // Add any remaining edges in patchEdges that were not in the original snapshot
        for (var _c = 0, _d = Object.entries(patchEdges_1); _c < _d.length; _c++) {
            var _e = _d[_c], id = _e[0], patcher_2 = _e[1];
            if ((0, remeda_1.isTruthy)(patcher_2)) {
                var baseEdge = {
                    id: id,
                    parent: null,
                    source: 'customer',
                    target: 'saas',
                    label: "New Edge: ".concat(id),
                    labelBBox: { x: 10, y: 20, width: 100, height: 200 },
                    technology: null,
                    description: null,
                    color: 'primary',
                    line: 'solid',
                    points: [
                        [0, 0],
                        [100, 100],
                        [200, 200],
                        [300, 300],
                    ],
                    relations: [],
                };
                writableEdges.push(patch(baseEdge, patcher_2));
            }
        }
    }
    return {
        snapshot: snapshot,
        snapshotNodes: (0, remeda_1.indexBy)(snapshot.nodes, function (n) { return n.id; }),
        snapshotEdges: (0, remeda_1.indexBy)(snapshot.edges, function (e) { return e.id; }),
        layouted: layouted,
        layoutedNodes: (0, remeda_1.indexBy)(layouted.nodes, function (n) { return n.id; }),
        layoutedEdges: (0, remeda_1.indexBy)(layouted.edges, function (e) { return e.id; }),
    };
}
