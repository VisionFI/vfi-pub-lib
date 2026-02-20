# @visionfi/tmux

TypeScript tmux library — part of the `vfi-pub-lib` monorepo.

## Development

```bash
# From monorepo root or this package directory:
bun install           # install dependencies
bun run typecheck     # type-check without emitting
bun test              # run all tests
bun run lint          # check with biome
bun run lint:fix      # auto-fix lint issues
bun run cli list      # test the CLI
```

## Structure

```
src/
├── core/        — Server → Session → Window → Pane object model
├── workspace/   — YAML/JSON config loading, building, freezing
├── plugin/      — Hook-based extension system
└── cli/         — CLI commands (load, freeze, list, convert)
```

## Key Patterns

- **Object hierarchy**: `Server > Session > Window > Pane` — each class holds a reference to the server and uses `cmd()` to execute tmux commands
- **Format strings**: `core/formats.ts` defines tmux format variables and provides `buildFormatString()` / `parseFormatOutput()` to serialize/deserialize tmux list output using ASCII record separator (`\x1e`)
- **Workspace pipeline**: Config goes through `expand()` → `trickle()` → `validate()` before being built
- **No heavy deps**: Core has zero runtime dependencies. Only workspace uses `yaml`, CLI uses `commander`/`chalk`

## Tests

Tests create real tmux sessions (prefixed `__vfi_tmux_test_*`) and clean up after themselves. They require tmux to be installed and running.

## Inspired By

- [libtmux](https://github.com/tmux-python/libtmux) (MIT) — Python ORM API for tmux
- [tmuxp](https://github.com/tmux-python/tmuxp) (MIT) — Python workspace manager
