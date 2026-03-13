# `@likec4/mcp`

[Documentation](https://likec4.dev/tooling/mcp/)

## Usage

```json
{
  "mcpServers": {
    "likec4": {
      "command": "npx",
      "args": [
        "-y",
        "@likec4/mcp"
      ],
      "env": {
        "LIKEC4_WORKSPACE": "${workspaceFolder}"
      }
    }
  }
}
```

This package starts MCP server using [`stdio`](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#stdio) transport.

If `LIKEC4_WORKSPACE` environment variable is not set, the current directory will be used as workspace.

### Usage as CLI

Install it globally (or use `npx`):

```sh
npm install -g @likec4/mcp
likec4-mcp-server -h
```

```
USAGE `likec4-mcp-server [OPTIONS] [WORKSPACE]`

ARGUMENTS

  `WORKSPACE="."`    change workspace, defaults to current directory, can be set by LIKEC4_WORKSPACE env    <directory>

OPTIONS

          `--stdio`    use stdio transport (this is default)
           `--http`    use streamable http transport
  `--port=<number>`    change http port (default: 33335)
       `--no-watch`    disable watch for changes (consume less resources if you have static workspace)
```

## Available tools

- `list-projects`: List all LikeC4 projects in the workspace.
- `read-project-summary`: Project specification, configuration, all elements, deployment nodes and views.
- `search-element`: Search elements and deployment nodes across all projects by id/title/kind/shape/tags/metadata.
- `read-element`: Full element details including relationships, includedInViews, deployedInstances, metadata and sourceLocation.
- `read-deployment`: Details of a deployment node or deployed instance.
- `read-view`: Full view details (nodes/edges) and sourceLocation.
- `find-relationships`: Direct and indirect relationships between two elements in a project.
- `query-graph`: Query element hierarchy (ancestors, descendants, siblings, children, parent) and relationships (incomers, outgoers).
- `query-incomers-graph`: Get complete graph of all upstream dependencies/producers (recursive incomers).
- `query-outgoers-graph`: Get complete graph of all downstream consumers/dependents (recursive outgoers).
- `query-by-metadata`: Search elements and deployment nodes by metadata key-value pairs with exact/contains/exists matching.
- `query-by-tags`: Search elements and deployment nodes by tags with boolean logic (allOf, anyOf, noneOf).
- `query-by-tag-pattern`: Search elements by tag patterns using prefix, contains, or suffix matching.
- `find-relationship-paths`: Discover all relationship chains between two elements with bounded BFS traversal. Supports `includeIndirect` to control implied relationships.
- `batch-read-elements`: Read full details for multiple elements in a single request.
- `subgraph-summary`: Summarize descendants of an element with depth, metadata, and relationship counts.
- `element-diff`: Compare two elements and show differences in properties, tags, metadata, and relationships.
- `open-view`: Opens the LikeC4 view (available if MCP is running in the editor)

## Getting help

We are always happy to help you get started:

- [Join Discord community](https://discord.gg/86ZSpjKAdA) – it is the easiest way to get help
- [GitHub Discussions](https://github.com/likec4/likec4/discussions) – ask anything about the project or give feedback

## Contributors

<a href="https://github.com/likec4/likec4/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=likec4/likec4" />
</a>

[Become a contributor](../../CONTRIBUTING.md)

## Support development

LikeC4 is a MIT-licensed open source project with its ongoing development made possible entirely by your support.\
If you like the project, please consider contributing financially to help grow and improve it.\
You can support us via [OpenCollective](https://opencollective.com/likec4) or [GitHub Sponsors](https://github.com/sponsors/likec4).

## License

This project is released under the [MIT License](LICENSE)

```
```
