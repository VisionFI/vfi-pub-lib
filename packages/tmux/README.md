# @vfi-pub/tmux

TypeScript library for programmatically controlling [tmux](https://github.com/tmux/tmux). Provides a typed object model (Server → Session → Window → Pane), workspace config management, and a CLI — inspired by the Python libraries [libtmux](https://github.com/tmux-python/libtmux) (MIT) and [tmuxp](https://github.com/tmux-python/tmuxp) (MIT).

## Install

```bash
bun add @vfi-pub/tmux
# or
npm install @vfi-pub/tmux
```

## Quick Start

```typescript
import { Server } from "@vfi-pub/tmux"

const server = new Server()

// Create a session
const session = server.newSession({ sessionName: "dev" })

// Create windows and panes
const editor = session.newWindow({ windowName: "editor" })
const terminal = editor.split({ direction: "horizontal" })

// Send commands
terminal.sendKeys("npm run dev", { literal: true })

// Read pane content
const output = terminal.capturePane()
console.log(output)

// List everything
console.log(server.sessions)
console.log(server.windows)
console.log(server.panes)
```

## Object Model

Mirrors the tmux hierarchy:

```
Server
├── Session ($0, $1, ...)
│   ├── Window (@0: editor, @1: terminal, ...)
│   │   ├── Pane (%0)
│   │   ├── Pane (%1)
│   │   └── Pane (%2)
│   └── Window (@2: logs)
│       └── Pane (%3)
└── Session ($1)
    └── ...
```

### Server

```typescript
const server = new Server({ socketName: "myapp" }) // optional socket

server.isAlive()                    // check if tmux is running
server.sessions                     // all sessions
server.windows                      // all windows across sessions
server.panes                        // all panes across everything
server.newSession({ ... })          // create a session
server.hasSession("dev")            // check by name
server.getSession("dev")            // find by name
server.killSession("dev")           // destroy
```

### Session

```typescript
session.name                        // session name
session.sessionId                   // "$0" format
session.windows                     // windows in this session
session.activeWindow                // currently focused window
session.panes                       // all panes across windows
session.newWindow({ windowName: "logs" })
session.killWindow("logs")
session.rename("new-name")
session.kill()
```

### Window

```typescript
window.name                         // window name
window.windowId                     // "@0" format
window.index                        // window index
window.panes                        // panes in this window
window.activePane                   // currently focused pane
window.split({ direction: "horizontal", percent: 30 })
window.selectLayout("tiled")       // even-horizontal, even-vertical, main-horizontal, main-vertical, tiled
window.rename("new-name")
window.kill()
```

### Pane

```typescript
pane.paneId                         // "%0" format
pane.width                          // columns
pane.height                         // rows
pane.currentPath                    // working directory
pane.currentCommand                 // running command
pane.isActive                       // is focused?

pane.sendKeys("echo hello", { literal: true })
pane.sendKeys("C-c")               // send control keys
pane.capturePane()                  // read content
pane.capturePane({ start: -100 })   // with scrollback
pane.split({ direction: "vertical" })
pane.resize({ direction: "right", adjustment: 10 })
pane.kill()
```

## Workspace Configs

Load tmuxp-compatible YAML/JSON workspace configs:

```yaml
# workspace.yaml
session_name: myproject
start_directory: ~/code/myproject
windows:
  - window_name: editor
    panes:
      - shell_command: vim .
  - window_name: server
    layout: even-horizontal
    panes:
      - shell_command: npm run dev
      - shell_command: npm run test:watch
  - window_name: terminal
    panes:
      - # empty pane
```

```typescript
import { loadConfig, buildWorkspace, Server } from "@vfi-pub/tmux"

// Load and build
const config = loadConfig("workspace.yaml")
const server = new Server()
const session = await buildWorkspace(server, config, { killExisting: true })

// Freeze a running session back to config
import { freezeSession } from "@vfi-pub/tmux"
const frozen = freezeSession(session)
```

### Config Features

- **Shorthand panes**: `"echo hello"` expands to `{ shell_command: ["echo hello"] }`
- **Directory inheritance**: `start_directory` trickles from session → window → pane
- **Command inheritance**: `shell_command_before` trickles from session → window
- **Path expansion**: `~` and `$VAR` are expanded in `start_directory`
- **Layouts**: Any tmux layout string (built-in or custom)

## Plugins

Extend workspace builds with lifecycle hooks:

```typescript
import { TmuxPlugin } from "@vfi-pub/tmux"

class LoggingPlugin extends TmuxPlugin {
  name = "logging"

  onWindowCreate(window) {
    console.log(`Created: ${window.name}`)
  }

  afterWindowFinished(window) {
    console.log(`Configured: ${window.name} (${window.panes.length} panes)`)
  }
}

await buildWorkspace(server, config, {
  plugins: [new LoggingPlugin()],
})
```

## CLI

```bash
# List sessions, windows, panes
vfi-tmux list

# Load a workspace
vfi-tmux load workspace.yaml
vfi-tmux load workspace.yaml --kill-existing

# Freeze a running session
vfi-tmux freeze mysession
vfi-tmux freeze mysession -o workspace.yaml
vfi-tmux freeze mysession -f json

# Convert between formats
vfi-tmux convert workspace.yaml        # → workspace.json
vfi-tmux convert workspace.json        # → workspace.yaml
```

## Acknowledgements

This library is a TypeScript port inspired by the design patterns of:

- **[libtmux](https://github.com/tmux-python/libtmux)** — typed Python ORM API for tmux (MIT License)
- **[tmuxp](https://github.com/tmux-python/tmuxp)** — tmux workspace manager built on libtmux (MIT License)

Both libraries are created by [Tony Narlock](https://github.com/tony) and the tmux-python community.

## License

MIT
