import type { PaneConfig, WindowConfig, WorkspaceConfig } from "./types.js"

/** Validation error with path context */
export class WorkspaceValidationError extends Error {
	constructor(
		message: string,
		public readonly path: string,
	) {
		super(`${path}: ${message}`)
		this.name = "WorkspaceValidationError"
	}
}

/** Validate a workspace config, throwing on first error */
export function validateConfig(config: unknown): asserts config is WorkspaceConfig {
	if (!config || typeof config !== "object") {
		throw new WorkspaceValidationError("Config must be an object", "root")
	}

	const c = config as Record<string, unknown>

	if (!c.session_name || typeof c.session_name !== "string") {
		throw new WorkspaceValidationError("session_name is required and must be a string", "session_name")
	}

	if (!Array.isArray(c.windows) || c.windows.length === 0) {
		throw new WorkspaceValidationError("windows is required and must be a non-empty array", "windows")
	}

	for (let i = 0; i < c.windows.length; i++) {
		validateWindowConfig(c.windows[i], `windows[${i}]`)
	}
}

function validateWindowConfig(config: unknown, path: string): asserts config is WindowConfig {
	if (!config || typeof config !== "object") {
		throw new WorkspaceValidationError("Window config must be an object", path)
	}

	const w = config as Record<string, unknown>

	if (!w.window_name || typeof w.window_name !== "string") {
		throw new WorkspaceValidationError("window_name is required and must be a string", `${path}.window_name`)
	}

	if (!Array.isArray(w.panes) || w.panes.length === 0) {
		throw new WorkspaceValidationError("panes is required and must be a non-empty array", `${path}.panes`)
	}

	for (let i = 0; i < w.panes.length; i++) {
		validatePaneConfig(w.panes[i], `${path}.panes[${i}]`)
	}
}

function validatePaneConfig(config: unknown, path: string): asserts config is PaneConfig {
	if (!config || typeof config !== "object") {
		// Allow null/undefined panes (they become empty panes)
		if (config === null || config === undefined) return
		throw new WorkspaceValidationError("Pane config must be an object or null", path)
	}
}
