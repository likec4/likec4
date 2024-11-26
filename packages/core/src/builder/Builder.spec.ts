import { describe, expect, it } from 'vitest'
import { Builder } from './Builder'

describe('Builder', () => {
  it('should build nested elements and relTo', () => {
    const {
      model: {
        model,
        system,
        component,
        rel,
        relTo
      },
      builder
    } = Builder.forSpecification({
      elements: {
        system: {
          style: {
            color: 'green',
            opacity: 10
          }
        },
        component: {
          style: {
            shape: 'browser'
          }
        }
      }
    })

    const b = builder.with(
      model(
        system('s1').with(
          component('1')
        ),
        system('s2').with(
          component('1', 'Component s2.1').with(
            component('2', { title: 'Component s2.1.2' }).with(
              component('3').with(
                relTo('s1.1', {
                  title: 'relation from s2.1.2.3 to s1.1'
                })
              )
            ),
            relTo('s1.1', {
              title: 'relation from s2.1 to s1.1'
            })
          )
        ),
        rel('s1.1', 's2.1.2', {
          title: 'relation from s1.1 to s2.1.2'
        })
      )
    )

    expect(b.build().elements).toMatchInlineSnapshot(`
      {
        "s1": {
          "color": "green",
          "description": null,
          "id": "s1",
          "kind": "system",
          "links": null,
          "shape": "rectangle",
          "style": {
            "opacity": 10,
          },
          "tags": null,
          "technology": null,
          "title": "s1",
        },
        "s1.1": {
          "color": "primary",
          "description": null,
          "id": "s1.1",
          "kind": "component",
          "links": null,
          "shape": "browser",
          "style": {},
          "tags": null,
          "technology": null,
          "title": "1",
        },
        "s2": {
          "color": "green",
          "description": null,
          "id": "s2",
          "kind": "system",
          "links": null,
          "shape": "rectangle",
          "style": {
            "opacity": 10,
          },
          "tags": null,
          "technology": null,
          "title": "s2",
        },
        "s2.1": {
          "color": "primary",
          "description": null,
          "id": "s2.1",
          "kind": "component",
          "links": null,
          "shape": "browser",
          "style": {},
          "tags": null,
          "technology": null,
          "title": "Component s2.1",
        },
        "s2.1.2": {
          "color": "primary",
          "description": null,
          "id": "s2.1.2",
          "kind": "component",
          "links": null,
          "shape": "browser",
          "style": {},
          "tags": null,
          "technology": null,
          "title": "Component s2.1.2",
        },
        "s2.1.2.3": {
          "color": "primary",
          "description": null,
          "id": "s2.1.2.3",
          "kind": "component",
          "links": null,
          "shape": "browser",
          "style": {},
          "tags": null,
          "technology": null,
          "title": "3",
        },
      }
    `)

    expect(b.build().relations).toMatchInlineSnapshot(`
      {
        "rel1": {
          "id": "rel1",
          "source": "s2.1.2.3",
          "target": "s1.1",
          "title": "relation from s2.1.2.3 to s1.1",
        },
        "rel2": {
          "id": "rel2",
          "source": "s2.1",
          "target": "s1.1",
          "title": "relation from s2.1 to s1.1",
        },
        "rel3": {
          "id": "rel3",
          "source": "s1.1",
          "target": "s2.1.2",
          "title": "relation from s1.1 to s2.1.2",
        },
      }
    `)
  })

  it('should build view ', () => {
    const {
      model: {
        model,
        component
      },
      views: {
        view,
        views,
        $include,
        $rules
      },
      builder
    } = Builder.forSpecification({
      elements: {
        component: {}
      }
    })

    const b = builder.with(
      model(
        component('1'),
        component('2'),
        component('3')
      ),
      views(
        view('1', 'View 1', $include('*')),
        view(
          '2',
          'view 2',
          $rules(
            $include('*'),
            $include('2.*')
          )
        )
      )
    )

    expect(b.build().views).toMatchInlineSnapshot(`
      {
        "1": {
          "__": "element",
          "customColorDefinitions": {},
          "description": null,
          "id": "1",
          "links": null,
          "rules": [
            {
              "include": [
                {
                  "wildcard": true,
                },
              ],
            },
          ],
          "tags": null,
          "title": "View 1",
        },
        "2": {
          "__": "element",
          "customColorDefinitions": {},
          "description": null,
          "id": "2",
          "links": null,
          "rules": [
            {
              "include": [
                {
                  "wildcard": true,
                },
              ],
            },
            {
              "include": [
                {
                  "element": "2",
                  "isChildren": true,
                },
              ],
            },
          ],
          "tags": null,
          "title": "view 2",
        },
      }
    `)
  })
  it('should build viewOf ', () => {
    const {
      model: {
        model,
        component
      },
      views: {
        viewOf,
        views,
        $include,
        $exclude,
        $rules
      },
      builder
    } = Builder.forSpecification({
      elements: {
        component: {}
      }
    })

    const b = builder.with(
      model(
        component('1'),
        component('2').with(
          component('3').with(
            component('4')
          )
        )
      ),
      views(
        viewOf(
          '1',
          '2',
          'View 1',
          $rules(
            $include('*'),
            $include('-> 2.3.* ->'),
            $exclude('1._ -> 2.3.*')
          )
        )
      )
    )

    expect(b.build().views).toMatchInlineSnapshot(`
      {
        "1": {
          "__": "element",
          "customColorDefinitions": {},
          "description": null,
          "id": "1",
          "links": null,
          "rules": [
            {
              "include": [
                {
                  "wildcard": true,
                },
              ],
            },
            {
              "include": [
                {
                  "inout": {
                    "element": "2.3",
                    "isChildren": true,
                  },
                },
              ],
            },
            {
              "exclude": [
                {
                  "source": {
                    "expanded": "1",
                  },
                  "target": {
                    "element": "2.3",
                    "isChildren": true,
                  },
                },
              ],
            },
          ],
          "tags": null,
          "title": "View 1",
          "viewOf": "2",
        },
      }
    `)
  })
})
