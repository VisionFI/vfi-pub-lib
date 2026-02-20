import type { Session } from "../core/session.js"
import type { PaneConfig, WindowConfig, WorkspaceConfig } from "./types.js"

/** Common shell interpreters to filter out when freezing */
const SHELL_COMMANDS = new Set(["bash", "zsh", "sh", "fish", "ksh", "csh", "tcsh", "dash"])

/**
 * Freeze a running tmux session into a workspace config.
 *
 * Captures the session's current state — window names, layouts,
 * pane directories, and running commands — and produces a
 * WorkspaceConfig that can be saved and later loaded.
 */
export function freezeSession(session: Session): WorkspaceConfig {
	const windows = session.windows

	const windowConfigs: WindowConfig[] = windows.map((window) => {
		const panes = window.panes

		const paneConfigs: PaneConfig[] = panes.map((pane) => {
			pane.refresh()
			const paneConfig: PaneConfig = {}

			if (pane.currentPath) {
				paneConfig.start_directory = pane.currentPath
			}

			// Capture running command, filtering out shell interpreters
			if (pane.currentCommand && !SHELL_COMMANDS.has(pane.currentCommand)) {
				paneConfig.shell_command = pane.currentCommand
			}

			if (pane.isActive) {
				paneConfig.focus = true
			}

			return paneConfig
		})

		window.refresh()
		const windowConfig: WindowConfig = {
			window_name: window.name,
			panes: paneConfigs,
		}

		// Capture layout
		const layoutResult = window.cmd("display-message", "-t", window.windowId, "-p", "#{window_layout}")
		if (layoutResult.returnCode === 0 && layoutResult.stdout.length > 0) {
			windowConfig.layout = layoutResult.stdout[0]
		}

		// Check if all panes share the same start_directory (factor it up)
		const dirs = paneConfigs.map((p) => p.start_directory).filter(Boolean)
		if (dirs.length > 0 && dirs.every((d) => d === dirs[0])) {
			windowConfig.start_directory = dirs[0]
			for (const p of paneConfigs) {
				p.start_directory = undefined
			}
		}

		if (window.isActive) {
			windowConfig.focus = true
		}

		return windowConfig
	})

	const config: WorkspaceConfig = {
		session_name: session.name,
		windows: windowConfigs,
	}

	// Factor up common start_directory from windows to session level
	const windowDirs = windowConfigs.map((w) => w.start_directory).filter(Boolean)
	if (
		windowDirs.length > 0 &&
		windowDirs.length === windowConfigs.length &&
		windowDirs.every((d) => d === windowDirs[0])
	) {
		config.start_directory = windowDirs[0]
		for (const w of windowConfigs) {
			w.start_directory = undefined
		}
	}

	return config
}
