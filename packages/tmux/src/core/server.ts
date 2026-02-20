import { tmuxCmd } from "./exec.js"
import { PANE_FORMATS, WINDOW_FORMATS, buildFormatString, getFormatFields, parseFormatOutput } from "./formats.js"
import { Session } from "./session.js"
import type { NewSessionOptions, ServerOptions, TmuxCommandResult } from "./types.js"
import { Window } from "./window.js"
import { Pane } from "./pane.js"
import { SESSION_FORMATS } from "./formats.js"

/**
 * Represents a tmux server — the top of the object hierarchy.
 *
 * Inspired by libtmux's Server class. Provides access to sessions,
 * windows, and panes across the entire server.
 */
export class Server {
	private readonly serverFlags: string[]

	constructor(options?: ServerOptions) {
		this.serverFlags = []
		if (options?.socketName) {
			this.serverFlags.push("-L", options.socketName)
		}
		if (options?.socketPath) {
			this.serverFlags.push("-S", options.socketPath)
		}
		if (options?.configFile) {
			this.serverFlags.push("-f", options.configFile)
		}
	}

	/** Execute a tmux command with this server's connection flags */
	cmd(...args: string[]): TmuxCommandResult {
		return tmuxCmd(args, { serverFlags: this.serverFlags })
	}

	/** Check if the tmux server is alive and responding */
	isAlive(): boolean {
		const result = this.cmd("list-sessions")
		// Return code 0 = running, non-zero could mean no sessions or server not running
		// A server with no sessions returns error, but that's still "not alive" for our purposes
		return result.returnCode === 0
	}

	/** Kill the tmux server */
	kill(): void {
		this.cmd("kill-server")
	}

	/** Get all sessions on this server */
	get sessions(): Session[] {
		const fields = getFormatFields(SESSION_FORMATS)
		const result = this.cmd("list-sessions", "-F", buildFormatString(fields))
		if (result.returnCode !== 0) return []
		const records = parseFormatOutput(result.stdout, fields)
		return records.map((r) => Session.fromRecord(this, r))
	}

	/** Create a new session */
	newSession(options?: NewSessionOptions): Session {
		const args: string[] = ["new-session"]

		if (options?.detached !== false) {
			args.push("-d")
		}
		if (options?.sessionName) {
			args.push("-s", options.sessionName)
		}
		if (options?.windowName) {
			args.push("-n", options.windowName)
		}
		if (options?.startDirectory) {
			args.push("-c", options.startDirectory)
		}
		if (options?.x !== undefined) {
			args.push("-x", String(options.x))
		}
		if (options?.y !== undefined) {
			args.push("-y", String(options.y))
		}
		if (options?.environment) {
			for (const [key, value] of Object.entries(options.environment)) {
				args.push("-e", `${key}=${value}`)
			}
		}

		// Request the session ID in the output
		const fields = getFormatFields(SESSION_FORMATS)
		args.push("-P", "-F", buildFormatString(fields))

		if (options?.killExisting && options.sessionName) {
			this.cmd("kill-session", "-t", options.sessionName)
		}

		const result = this.cmd(...args)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to create session: ${result.stderr.join("\n")}`)
		}

		const records = parseFormatOutput(result.stdout, fields)
		if (records.length === 0) {
			throw new Error("Failed to parse new session output")
		}
		return Session.fromRecord(this, records[0])
	}

	/** Check if a session with the given name exists */
	hasSession(name: string): boolean {
		const result = this.cmd("has-session", "-t", name)
		return result.returnCode === 0
	}

	/** Kill a session by name or target */
	killSession(target: string): void {
		const result = this.cmd("kill-session", "-t", target)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to kill session '${target}': ${result.stderr.join("\n")}`)
		}
	}

	/** Get a session by name */
	getSession(name: string): Session | undefined {
		return this.sessions.find((s) => s.name === name)
	}

	/** Get all windows across all sessions */
	get windows(): Window[] {
		const fields = getFormatFields(WINDOW_FORMATS)
		const result = this.cmd("list-windows", "-a", "-F", buildFormatString(fields))
		if (result.returnCode !== 0) return []
		const records = parseFormatOutput(result.stdout, fields)
		return records.map((r) => Window.fromRecord(this, r))
	}

	/** Get all panes across all sessions and windows */
	get panes(): Pane[] {
		const fields = getFormatFields(PANE_FORMATS)
		const result = this.cmd("list-panes", "-a", "-F", buildFormatString(fields))
		if (result.returnCode !== 0) return []
		const records = parseFormatOutput(result.stdout, fields)
		return records.map((r) => Pane.fromRecord(this, r))
	}
}
