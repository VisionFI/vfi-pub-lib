import {
	PANE_FORMATS,
	SESSION_FORMATS,
	WINDOW_FORMATS,
	buildFormatString,
	getFormatFields,
	parseFormatOutput,
} from "./formats.js"
import { Pane } from "./pane.js"
import type { Server } from "./server.js"
import type { NewWindowOptions, TmuxCommandResult } from "./types.js"
import { Window } from "./window.js"

/**
 * Represents a tmux session.
 *
 * A session contains one or more windows and belongs to a server.
 */
export class Session {
	readonly server: Server
	readonly sessionId: string
	private _name: string

	constructor(server: Server, sessionId: string, name: string) {
		this.server = server
		this.sessionId = sessionId
		this._name = name
	}

	/** Create a Session from a parsed tmux format record */
	static fromRecord(server: Server, record: Record<string, string>): Session {
		return new Session(server, record.session_id, record.session_name)
	}

	/** Session name */
	get name(): string {
		return this._name
	}

	/** Execute a tmux command targeting this session */
	cmd(...args: string[]): TmuxCommandResult {
		return this.server.cmd(...args)
	}

	/** Get all windows in this session */
	get windows(): Window[] {
		const fields = getFormatFields(WINDOW_FORMATS)
		const result = this.cmd("list-windows", "-t", this.sessionId, "-F", buildFormatString(fields))
		if (result.returnCode !== 0) return []
		const records = parseFormatOutput(result.stdout, fields)
		return records.map((r) => Window.fromRecord(this.server, r))
	}

	/** Get the active window */
	get activeWindow(): Window | undefined {
		return this.windows.find((w) => w.isActive)
	}

	/** Create a new window in this session */
	newWindow(options?: NewWindowOptions): Window {
		const args: string[] = ["new-window"]

		args.push("-t", this.sessionId)
		if (options?.detached !== false) {
			args.push("-d")
		}
		if (options?.windowName) {
			args.push("-n", options.windowName)
		}
		if (options?.startDirectory) {
			args.push("-c", options.startDirectory)
		}
		if (options?.environment) {
			for (const [key, value] of Object.entries(options.environment)) {
				args.push("-e", `${key}=${value}`)
			}
		}

		const fields = getFormatFields(WINDOW_FORMATS)
		args.push("-P", "-F", buildFormatString(fields))

		const result = this.cmd(...args)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to create window: ${result.stderr.join("\n")}`)
		}

		const records = parseFormatOutput(result.stdout, fields)
		if (records.length === 0) {
			throw new Error("Failed to parse new window output")
		}
		return Window.fromRecord(this.server, records[0])
	}

	/** Kill a window by target */
	killWindow(target: string): void {
		const result = this.cmd("kill-window", "-t", `${this.sessionId}:${target}`)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to kill window '${target}': ${result.stderr.join("\n")}`)
		}
	}

	/** Select a window by name or index */
	selectWindow(target: string | number): Window | undefined {
		const windowTarget = `${this.sessionId}:${target}`
		const result = this.cmd("select-window", "-t", windowTarget)
		if (result.returnCode !== 0) return undefined
		return this.activeWindow
	}

	/** Get a window by name */
	getWindow(name: string): Window | undefined {
		return this.windows.find((w) => w.name === name)
	}

	/** Get all panes across all windows in this session */
	get panes(): Pane[] {
		const fields = getFormatFields(PANE_FORMATS)
		const result = this.cmd("list-panes", "-s", "-t", this.sessionId, "-F", buildFormatString(fields))
		if (result.returnCode !== 0) return []
		const records = parseFormatOutput(result.stdout, fields)
		return records.map((r) => Pane.fromRecord(this.server, r))
	}

	/** Kill this session */
	kill(): void {
		this.server.killSession(this.sessionId)
	}

	/** Rename this session */
	rename(newName: string): this {
		const result = this.cmd("rename-session", "-t", this.sessionId, newName)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to rename session: ${result.stderr.join("\n")}`)
		}
		this._name = newName
		return this
	}

	/** Attach to this session (blocks until detached) */
	attach(): void {
		this.cmd("attach-session", "-t", this.sessionId)
	}

	/** Refresh session data from tmux */
	refresh(): Session {
		const fields = getFormatFields(SESSION_FORMATS)
		const result = this.cmd("display-message", "-t", this.sessionId, "-p", buildFormatString(fields))
		if (result.returnCode === 0 && result.stdout.length > 0) {
			const records = parseFormatOutput(result.stdout, fields)
			if (records.length > 0) {
				this._name = records[0].session_name
			}
		}
		return this
	}

	toString(): string {
		return `Session(${this.sessionId} ${this._name})`
	}
}
