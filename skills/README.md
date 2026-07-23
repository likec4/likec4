# LikeC4 Agent Skills

This directory contains public [Agent Skills](https://www.skillsdk.dev/) for AI coding assistants (Claude Code, Cursor, Windsurf, etc.) that help with LikeC4 development.

Repo-local developer workflow skills live in `.agents/skills/`. Claude Code discovers those through per-skill symlink adapters in `.claude/skills/`.

Skills are auto-discovered by agents when working in this repository. They provide DSL syntax references, coding patterns, and workflow guidance — enabling AI agents to write correct LikeC4 code without hallucinating syntax.

## Available Skills

| Skill                       | Description                                                                    |
| --------------------------- | ------------------------------------------------------------------------------ |
| [likec4-dsl](./likec4-dsl/) | LikeC4 DSL syntax reference — auto-triggers when editing `.c4`/`.likec4` files |

## Installing Skills

LikeC4 implements the [Agent Skills Discovery RFC](https://www.skillsdk.dev/), publishing skills at [likec4.dev](https://likec4.dev/).

To install LikeC4 skills into any project:

```bash
npx skills add https://likec4.dev/
```

This discovers and installs available skills into your project's `.claude/skills/` directory (or equivalent for other agents).
