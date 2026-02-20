import chalk from "chalk"
import { Server } from "../core/server.js"

/** List tmux sessions, windows, and panes */
export function listCommand(options: { socketName?: string; socketPath?: string }): void {
	const server = new Server({
		socketName: options.socketName,
		socketPath: options.socketPath,
	})

	if (!server.isAlive()) {
		console.log(chalk.yellow("No tmux server running."))
		return
	}

	const sessions = server.sessions
	if (sessions.length === 0) {
		console.log(chalk.yellow("No sessions found."))
		return
	}

	for (const session of sessions) {
		console.log(chalk.bold.green(`${session.name} (${session.sessionId})`))

		const windows = session.windows
		for (const window of windows) {
			const activeMarker = window.isActive ? chalk.cyan(" *") : ""
			console.log(`  ${chalk.bold(`${window.index}: ${window.name}`)} (${window.windowId})${activeMarker}`)

			const panes = window.panes
			for (const pane of panes) {
				const paneActive = pane.isActive ? chalk.cyan(" *") : ""
				const cmd = pane.currentCommand ? chalk.dim(` [${pane.currentCommand}]`) : ""
				const dir = pane.currentPath ? chalk.dim(` ${pane.currentPath}`) : ""
				console.log(`    ${pane.paneId} (${pane.width}x${pane.height})${cmd}${dir}${paneActive}`)
			}
		}
		console.log()
	}
}
