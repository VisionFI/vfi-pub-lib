import type { Server } from "../core/server.js"
import type { Session } from "../core/session.js"
import type { TmuxPlugin } from "../plugin/plugin.js"
import type { PaneConfig, WindowConfig, WorkspaceConfig } from "./types.js"

/** Options for building a workspace */
export interface BuildOptions {
	/** Plugins to invoke during build */
	plugins?: TmuxPlugin[]
	/** Kill existing session with same name (default: false) */
	killExisting?: boolean
}

/**
 * Build a tmux session from a workspace config.
 *
 * Sequence: create session → for each window → for each pane → send commands.
 */
export async function buildWorkspace(
	server: Server,
	config: WorkspaceConfig,
	options?: BuildOptions,
): Promise<Session> {
	const plugins = options?.plugins ?? []

	// Kill existing session if requested
	if (options?.killExisting && server.hasSession(config.session_name)) {
		server.killSession(config.session_name)
	}

	// Create session with first window
	const firstWindow = config.windows[0]
	const session = server.newSession({
		sessionName: config.session_name,
		startDirectory: config.start_directory,
		windowName: firstWindow?.window_name,
		detached: true,
	})

	// Set session options
	if (config.options) {
		for (const [key, value] of Object.entries(config.options)) {
			session.cmd("set-option", "-t", session.sessionId, key, String(value))
		}
	}
	if (config.global_options) {
		for (const [key, value] of Object.entries(config.global_options)) {
			session.cmd("set-option", "-g", key, String(value))
		}
	}

	// Set environment
	if (config.environment) {
		for (const [key, value] of Object.entries(config.environment)) {
			session.cmd("set-environment", "-t", session.sessionId, key, value)
		}
	}

	// Plugin hook: beforeWorkspaceBuild
	for (const plugin of plugins) {
		await plugin.beforeWorkspaceBuild?.(session)
	}

	// Configure first window (already created with session)
	if (firstWindow) {
		const windows = session.windows
		if (windows.length > 0) {
			await configureWindow(session, windows[0], firstWindow, plugins)
		}
	}

	// Create remaining windows
	for (let i = 1; i < config.windows.length; i++) {
		const winConfig = config.windows[i]
		const window = session.newWindow({
			windowName: winConfig.window_name,
			startDirectory: winConfig.start_directory,
			detached: true,
		})

		await configureWindow(session, window, winConfig, plugins)
	}

	// Focus the right window
	const focusIndex = config.windows.findIndex((w) => w.focus)
	if (focusIndex >= 0) {
		session.selectWindow(focusIndex)
	} else {
		session.selectWindow(0)
	}

	return session
}

async function configureWindow(
	session: Session,
	window: import("../core/window.js").Window,
	config: WindowConfig,
	plugins: TmuxPlugin[],
): Promise<void> {
	// Plugin hook: onWindowCreate
	for (const plugin of plugins) {
		await plugin.onWindowCreate?.(window)
	}

	// Set window options
	if (config.options) {
		for (const [key, value] of Object.entries(config.options)) {
			session.cmd("set-option", "-w", "-t", window.windowId, key, String(value))
		}
	}

	// Configure panes — first pane already exists
	const paneConfigs = config.panes
	if (paneConfigs.length > 0) {
		// Configure the first pane (already exists)
		const existingPanes = window.panes
		if (existingPanes.length > 0) {
			await configurePane(existingPanes[0], paneConfigs[0], config)
		}

		// Create additional panes by splitting
		for (let i = 1; i < paneConfigs.length; i++) {
			const pane = window.split({
				detached: true,
				startDirectory: paneConfigs[i].start_directory,
			})
			await configurePane(pane, paneConfigs[i], config)
		}
	}

	// Apply layout after all panes are created
	if (config.layout) {
		window.selectLayout(config.layout as import("../core/constants.js").LayoutType)
	}

	// Focus the right pane
	const focusPaneIndex = paneConfigs.findIndex((p) => p.focus)
	if (focusPaneIndex >= 0) {
		window.selectPane(focusPaneIndex)
	}

	// Plugin hook: afterWindowFinished
	for (const plugin of plugins) {
		await plugin.afterWindowFinished?.(window)
	}
}

async function configurePane(
	pane: import("../core/pane.js").Pane,
	config: PaneConfig,
	windowConfig: WindowConfig,
): Promise<void> {
	if (!config) return

	// Sleep before sending commands
	if (config.sleep_before) {
		await sleep(config.sleep_before * 1000)
	}

	// Send shell_command_before from window config
	const beforeCmds = normalizeCommands(windowConfig.shell_command_before)
	for (const cmd of beforeCmds) {
		pane.sendKeys(cmd, { enter: true, literal: true })
	}

	// Send pane commands
	const cmds = normalizeCommands(config.shell_command)
	const enterFlag = config.enter !== false

	for (const cmd of cmds) {
		pane.sendKeys(cmd, { enter: enterFlag, literal: true })
	}

	// Sleep after sending commands
	if (config.sleep_after) {
		await sleep(config.sleep_after * 1000)
	}
}

function normalizeCommands(cmd: string | string[] | undefined): string[] {
	if (!cmd) return []
	if (typeof cmd === "string") return [cmd]
	return cmd
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
