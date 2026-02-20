# VisionFI Public Libraries

Bun monorepo with `bun workspaces`. All packages are in `packages/`.

## Commands

```bash
bun install                      # install all deps
bun run --filter '*' test        # test all packages
bun run --filter '*' lint        # lint all packages
bun run --filter '@visionfi/tmux' test   # test specific package
```

## Packages

- `packages/tmux` — `@visionfi/tmux` — see its own CLAUDE.md for details

## Conventions

- Runtime: Bun
- Linting: Biome (config at root, extended by packages)
- Testing: `bun test`
- TypeScript: strict mode
- License: MIT
- Formatting: tabs, double quotes, trailing commas, no semicolons
