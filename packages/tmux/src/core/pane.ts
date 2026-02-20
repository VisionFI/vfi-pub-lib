import { PANE_FORMATS, buildFormatString, getFormatFields, parseFormatOutput } from "./formats.js"
import type { Server } from "./server.js"
import type { CaptureOptions, ResizeOptions, SplitOptions, TmuxCommandResult } from "./types.js"

/**
 * Represents a tmux pane.
 *
 * A pane is the smallest unit in the tmux hierarchy — a single
 * terminal viewport within a window.
 */
export class Pane {
	readonly server: Server
	readonly paneId: string
	readonly windowId: string
	readonly windowName: string
	readonly sessionId: string
	readonly sessionName: string
	private _index: number
	private _width: number
	private _height: number
	private _isActive: boolean
	private _currentPath: string
	private _currentCommand: string

	constructor(
		server: Server,
		paneId: string,
		index: number,
		windowId: string,
		windowName: string,
		sessionId: string,
		sessionName: string,
		width: number,
		height: number,
		isActive: boolean,
		currentPath: string,
		currentCommand: string,
	) {
		this.server = server
		this.paneId = paneId
		this._index = index
		this.windowId = windowId
		this.windowName = windowName
		this.sessionId = sessionId
		this.sessionName = sessionName
		this._width = width
		this._height = height
		this._isActive = isActive
		this._currentPath = currentPath
		this._currentCommand = currentCommand
	}

	/** Create a Pane from a parsed tmux format record */
	static fromRecord(server: Server, record: Record<string, string>): Pane {
		return new Pane(
			server,
			record.pane_id,
			Number.parseInt(record.pane_index, 10),
			record.window_id,
			record.window_name,
			record.session_id,
			record.session_name,
			Number.parseInt(record.pane_width, 10) || 0,
			Number.parseInt(record.pane_height, 10) || 0,
			record.pane_active === "1",
			record.pane_current_path ?? "",
			record.pane_current_command ?? "",
		)
	}

	/** Pane index within its window */
	get index(): number {
		return this._index
	}

	/** Pane width in columns */
	get width(): number {
		return this._width
	}

	/** Pane height in rows */
	get height(): number {
		return this._height
	}

	/** Whether this pane is the active pane in its window */
	get isActive(): boolean {
		return this._isActive
	}

	/** Current working directory of the pane */
	get currentPath(): string {
		return this._currentPath
	}

	/** Current running command in the pane */
	get currentCommand(): string {
		return this._currentCommand
	}

	/** Target string for tmux commands */
	private get target(): string {
		return this.paneId
	}

	/** Execute a tmux command */
	cmd(...args: string[]): TmuxCommandResult {
		return this.server.cmd(...args)
	}

	/**
	 * Send keys (text or key names) to this pane.
	 *
	 * @param keys - Text or key sequence to send
	 * @param options - Send options
	 */
	sendKeys(keys: string, options?: { enter?: boolean; literal?: boolean }): void {
		const args: string[] = ["send-keys", "-t", this.target]
		if (options?.literal) {
			args.push("-l")
		}
		args.push(keys)
		if (options?.enter !== false && !options?.literal) {
			args.push("Enter")
		}

		const result = this.cmd(...args)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to send keys: ${result.stderr.join("\n")}`)
		}
	}

	/**
	 * Capture the content of this pane.
	 *
	 * @param options - Capture options
	 * @returns Array of lines from the pane
	 */
	capturePane(options?: CaptureOptions): string[] {
		const args: string[] = ["capture-pane", "-t", this.target, "-p"]

		if (options?.start !== undefined) {
			args.push("-S", String(options.start))
		}
		if (options?.end !== undefined) {
			args.push("-E", String(options.end))
		}
		if (options?.escapeSequences) {
			args.push("-e")
		}
		if (options?.stripTrailing) {
			args.push("-T")
		}

		const result = this.cmd(...args)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to capture pane: ${result.stderr.join("\n")}`)
		}
		return result.stdout
	}

	/** Clear the pane */
	clear(): this {
		this.cmd("send-keys", "-t", this.target, "C-l")
		return this
	}

	/** Reset the pane (clear + reset terminal) */
	reset(): this {
		this.cmd("send-keys", "-t", this.target, "C-c")
		this.cmd("send-keys", "-t", this.target, "-l", "clear")
		this.cmd("send-keys", "-t", this.target, "Enter")
		return this
	}

	/** Split this pane */
	split(options?: SplitOptions): Pane {
		const args: string[] = ["split-window"]

		args.push("-t", this.target)
		if (options?.direction === "horizontal") {
			args.push("-h")
		}
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
			throw new Error(`Failed to split pane: ${result.stderr.join("\n")}`)
		}

		const records = parseFormatOutput(result.stdout, fields)
		if (records.length === 0) {
			throw new Error("Failed to parse split output")
		}
		return Pane.fromRecord(this.server, records[0])
	}

	/** Resize this pane */
	resize(options: ResizeOptions): this {
		const args: string[] = ["resize-pane", "-t", this.target]

		if (options.direction) {
			const dirFlags = { up: "-U", down: "-D", left: "-L", right: "-R" } as const
			args.push(dirFlags[options.direction])
			if (options.adjustment !== undefined) {
				args.push(String(options.adjustment))
			}
		}
		if (options.width !== undefined) {
			args.push("-x", String(options.width))
		}
		if (options.height !== undefined) {
			args.push("-y", String(options.height))
		}

		const result = this.cmd(...args)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to resize pane: ${result.stderr.join("\n")}`)
		}
		return this
	}

	/** Select (focus) this pane */
	select(): this {
		this.cmd("select-pane", "-t", this.target)
		return this
	}

	/** Kill this pane */
	kill(): void {
		const result = this.cmd("kill-pane", "-t", this.target)
		if (result.returnCode !== 0) {
			throw new Error(`Failed to kill pane: ${result.stderr.join("\n")}`)
		}
	}

	/** Refresh pane data from tmux */
	refresh(): this {
		const fields = getFormatFields(PANE_FORMATS)
		const result = this.cmd("display-message", "-t", this.target, "-p", buildFormatString(fields))
		if (result.returnCode === 0 && result.stdout.length > 0) {
			const records = parseFormatOutput(result.stdout, fields)
			if (records.length > 0) {
				const r = records[0]
				this._index = Number.parseInt(r.pane_index, 10)
				this._width = Number.parseInt(r.pane_width, 10) || 0
				this._height = Number.parseInt(r.pane_height, 10) || 0
				this._isActive = r.pane_active === "1"
				this._currentPath = r.pane_current_path ?? ""
				this._currentCommand = r.pane_current_command ?? ""
			}
		}
		return this
	}

	toString(): string {
		return `Pane(${this.paneId} ${this._index})`
	}
}
