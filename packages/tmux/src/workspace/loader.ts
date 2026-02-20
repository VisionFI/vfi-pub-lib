import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parse as parseYaml } from "yaml"
import type { WorkspaceConfig } from "./types.js"
import { validateConfig } from "./validation.js"

/**
 * Load a workspace config from a YAML or JSON file.
 *
 * Runs the three-stage pipeline: expand → trickle → validate.
 */
export function loadConfig(filePath: string): WorkspaceConfig {
	const resolvedPath = resolve(filePath)
	const content = readFileSync(resolvedPath, "utf-8")

	let raw: unknown
	if (resolvedPath.endsWith(".json")) {
		raw = JSON.parse(content)
	} else {
		raw = parseYaml(content)
	}

	const expanded = expand(raw as Record<string, unknown>)
	const trickled = trickle(expanded)
	validateConfig(trickled)
	return trickled
}

/**
 * Parse a config string (YAML or JSON) into a validated WorkspaceConfig.
 */
export function parseConfig(content: string, format: "yaml" | "json" = "yaml"): WorkspaceConfig {
	const raw = format === "json" ? JSON.parse(content) : parseYaml(content)
	const expanded = expand(raw as Record<string, unknown>)
	const trickled = trickle(expanded)
	validateConfig(trickled)
	return trickled
}

/**
 * Stage 1: Expand shorthand forms into canonical structure.
 *
 * - String pane → `{ shell_command: [str] }`
 * - String shell_command → `[str]`
 * - String shell_command_before → `[str]`
 * - Expand `~` in start_directory
 * - Expand `$VAR` and `${VAR}` in start_directory
 */
export function expand(raw: Record<string, unknown>): Record<string, unknown> {
	const config = { ...raw }

	// Expand start_directory
	if (typeof config.start_directory === "string") {
		config.start_directory = expandPath(config.start_directory)
	}

	// Expand shell_command_before
	if (typeof config.shell_command_before === "string") {
		config.shell_command_before = [config.shell_command_before]
	}

	// Expand windows
	if (Array.isArray(config.windows)) {
		config.windows = config.windows.map((w: unknown) => expandWindow(w))
	}

	return config
}

function expandWindow(raw: unknown): Record<string, unknown> {
	if (!raw || typeof raw !== "object") return { panes: [{}] }

	const win = { ...(raw as Record<string, unknown>) }

	if (typeof win.start_directory === "string") {
		win.start_directory = expandPath(win.start_directory)
	}
	if (typeof win.shell_command_before === "string") {
		win.shell_command_before = [win.shell_command_before]
	}

	if (Array.isArray(win.panes)) {
		win.panes = win.panes.map((p: unknown) => expandPane(p))
	} else {
		win.panes = [{}]
	}

	return win
}

function expandPane(raw: unknown): Record<string, unknown> {
	// String shorthand: "npm run dev" → { shell_command: ["npm run dev"] }
	if (typeof raw === "string") {
		return { shell_command: [raw] }
	}
	if (raw === null || raw === undefined) {
		return {}
	}
	if (typeof raw !== "object") {
		return {}
	}

	const pane = { ...(raw as Record<string, unknown>) }

	if (typeof pane.shell_command === "string") {
		pane.shell_command = [pane.shell_command]
	}
	if (typeof pane.start_directory === "string") {
		pane.start_directory = expandPath(pane.start_directory)
	}

	return pane
}

/**
 * Stage 2: Trickle down inherited values.
 *
 * - `start_directory` flows: session → window → pane
 * - `shell_command_before` flows: session → window
 * - `suppress_history` flows: session → window → pane
 */
export function trickle(config: Record<string, unknown>): Record<string, unknown> {
	const sessionDir = config.start_directory as string | undefined
	const sessionBefore = config.shell_command_before as string[] | undefined
	const sessionSuppress = config.suppress_history as boolean | undefined

	if (Array.isArray(config.windows)) {
		config.windows = config.windows.map((w: unknown) => {
			if (!w || typeof w !== "object") return w
			const win = w as Record<string, unknown>

			// Inherit start_directory from session
			if (!win.start_directory && sessionDir) {
				win.start_directory = sessionDir
			}

			// Inherit shell_command_before from session
			if (!win.shell_command_before && sessionBefore) {
				win.shell_command_before = [...sessionBefore]
			}

			const winDir = win.start_directory as string | undefined
			const winSuppress = (win as Record<string, unknown>).suppress_history as boolean | undefined

			if (Array.isArray(win.panes)) {
				win.panes = (win.panes as Record<string, unknown>[]).map((p) => {
					if (!p || typeof p !== "object") return p
					const pane = p as Record<string, unknown>

					// Inherit start_directory from window
					if (!pane.start_directory && winDir) {
						pane.start_directory = winDir
					}

					// Inherit suppress_history
					if (pane.suppress_history === undefined) {
						pane.suppress_history = winSuppress ?? sessionSuppress
					}

					return pane
				})
			}

			return win
		})
	}

	return config
}

/** Expand ~ and $VAR in a path string */
function expandPath(p: string): string {
	let result = p
	// Expand ~ to HOME
	if (result.startsWith("~/") || result === "~") {
		const home = process.env.HOME ?? ""
		result = result.replace("~", home)
	}
	// Expand $VAR and ${VAR}
	result = result.replace(/\$\{(\w+)\}|\$(\w+)/g, (_match, braced, bare) => {
		const varName = braced ?? bare
		return process.env[varName] ?? ""
	})
	return result
}
