import type { LayoutType } from "./constants.js"
import { PANE_FORMATS, WINDOW_FORMATS, buildFormatString, getFormatFields, parseFormatOutput } from "./formats.js"
import { Pane } from "./pane.js"
import type { Server } from "./server.js"
import type { ResizeOptions, SplitOptions, TmuxCommandResult } from "./types.js"

/**
 * Represents a tmux window.
 *
 * A window contains one or more panes and belongs to a session.
 */
export class Window {
	readonly server: Server
	readonly windowId: string
	readonly sessionId: string
	readonly sessionName: string
	private _name: string
	private _index: number
	private _isActive: boolean

	constructor(
		server: Server,
		windowId: string,
		name: string,
		index: number,
		sessionId: string,
		sessionName: string,
		isActive: boolean,
	) {
		this.server = server
		this.windowId = windowId
		this._name = name
		this._index = index
		this.sessionId = sessionId
		this.sessionName = sessionName
		this._isActive = isActive
	}

	/** Create a Window from a parsed tmux format record */
	static fromRecord(server: Server, record: Record<string, string>): Window {
		return new Window(
			server,
			record.window_id,
			record.window_name,
			Number.parseInt(record.window_index, 10),
			record.session_id,
			record.session_name,
			record.window_active === "1",
		)
	}

	/** Window name */
	get name(): string {
		return this._name
	}

	/** Window index */
	get index(): number {
		return this._index
	}

	/** Whether this is the active window in its session */
	get isActive(): boolean {
		return this._isActive
	}

	/** Target string for tmux commands */
	private get target(): string {
		return this.windowId
	}

	/** Execute a tmux command */
	cmd(...args: string[]): TmuxCommandResult {
		return this.server.cmd(...args)
	}

	/** Get all panes in this window */
	get panes(): Pane[] {
		const fields = getFormatFields(PANE_FORMATS)
		const result = this.cmd("list-panes", "-t", this.target, "-F", buildFormatString(fields))
		if (result.returnCode !== 0) return []
		const records = parseFormatOutput(result.stdout, fields)
		return records.map((r) => Pane.fromRecord(this.server, r))
	}

	/** Get the active pane in this window */
	get activePane(): Pane | undefined {
		return this.panes.find((p) => p.isActive)
	}

	/** Split a pane in this window */
	split(options?: SplitOptions): Pane {
		const args: string[] = ["split-window"]

		args.push("-t", this.target)
		if (options?.direction === "horizontal") {
			args.push("-h")
		}
		// vertical is default (no flag needed)
		if (options?.startDirectory) {
			args.push("-c", options.startDirectory)
		}
		if (options?.detached) {
			args.push("-d")
		}
		if (options?.percent !== undefined) {
			args.push("-p", String(options.percent))
		}
		if (options?.size !== undefined) {
			args.push("-l", String(options.size))
		}
		if (options?.environment) {
			for (const [key, value] of Object.entries(options.environment)) {
				args.push("-e", `${key}=${value}`)
			}
		}

		const fields = getFormatFields(PANE_FORMATS)
		args.push("-P", "-F", buildFormatString(fields))

		const result = this.cmd(...args)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to split window: ${result.stderr.join("\n")}`)
		}

		const records = parseFormatOutput(result.stdout, fields)
		if (records.length === 0) {
			throw new Error("Failed to parse split output")
		}
		return Pane.fromRecord(this.server, records[0])
	}

	/** Select a pane by index */
	selectPane(target: string | number): Pane | undefined {
		const paneTarget = `${this.target}.${target}`
		const result = this.cmd("select-pane", "-t", paneTarget)
		if (result.returnCode !== 0) return undefined
		return this.activePane
	}

	/** Apply a layout to this window */
	selectLayout(layout: LayoutType): this {
		const result = this.cmd("select-layout", "-t", this.target, layout)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to set layout: ${result.stderr.join("\n")}`)
		}
		return this
	}

	/** Resize this window */
	resize(options: ResizeOptions): this {
		const args: string[] = ["resize-window", "-t", this.target]

		if (options.width !== undefined) {
			args.push("-x", String(options.width))
		}
		if (options.height !== undefined) {
			args.push("-y", String(options.height))
		}

		const result = this.cmd(...args)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to resize window: ${result.stderr.join("\n")}`)
		}
		return this
	}

	/** Kill this window */
	kill(): void {
		const result = this.cmd("kill-window", "-t", this.target)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to kill window: ${result.stderr.join("\n")}`)
		}
	}

	/** Rename this window */
	rename(newName: string): this {
		const result = this.cmd("rename-window", "-t", this.target, newName)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to rename window: ${result.stderr.join("\n")}`)
		}
		this._name = newName
		return this
	}

	/** Select (focus) this window */
	select(): this {
		this.cmd("select-window", "-t", this.target)
		return this
	}

	/** Refresh window data from tmux */
	refresh(): this {
		const fields = getFormatFields(WINDOW_FORMATS)
		const result = this.cmd("display-message", "-t", this.target, "-p", buildFormatString(fields))
		if (result.returnCode === 0 && result.stdout.length > 0) {
			const records = parseFormatOutput(result.stdout, fields)
			if (records.length > 0) {
				const r = records[0]
				this._name = r.window_name
				this._index = Number.parseInt(r.window_index, 10)
				this._isActive = r.window_active === "1"
			}
		}
		return this
	}

	toString(): string {
		return `Window(${this.windowId} ${this._index}:${this._name})`
	}
}
