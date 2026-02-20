/** Result of executing a tmux command */
export interface TmuxCommandResult {
	stdout: string[]
	stderr: string[]
	returnCode: number
}

/** Options for creating a Server instance */
export interface ServerOptions {
	/** Socket name (-L flag) */
	socketName?: string
	/** Socket path (-S flag) */
	socketPath?: string
	/** Config file (-f flag) */
	configFile?: string
}

/** Options for creating a new session */
export interface NewSessionOptions {
	/** Session name (-s flag) */
	sessionName?: string
	/** Starting directory */
	startDirectory?: string
	/** Window name for the first window */
	windowName?: string
	/** Width of the session */
	x?: number
	/** Height of the session */
	y?: number
	/** Create detached (-d flag) */
	detached?: boolean
	/** Kill existing session with the same name first */
	killExisting?: boolean
	/** Environment variables to set */
	environment?: Record<string, string>
}

/** Options for creating a new window */
export interface NewWindowOptions {
	/** Window name (-n flag) */
	windowName?: string
	/** Starting directory (-c flag) */
	startDirectory?: string
	/** Create window but don't switch to it (-d flag) */
	detached?: boolean
	/** Attach to existing window if it already exists (-a flag) */
	attach?: boolean
	/** Window index (-t flag) */
	windowIndex?: number
	/** Environment variables to set */
	environment?: Record<string, string>
}

/** Options for splitting a window/pane */
export interface SplitOptions {
	/** Split direction */
	direction?: "horizontal" | "vertical"
	/** Starting directory (-c flag) */
	startDirectory?: string
	/** Create split but stay on current pane (-d flag) */
	detached?: boolean
	/** Size as percentage (-p flag) */
	percent?: number
	/** Size in lines/columns (-l flag) */
	size?: number
	/** Environment variables to set */
	environment?: Record<string, string>
}

/** Options for resizing a pane/window */
export interface ResizeOptions {
	/** Resize direction */
	direction?: "up" | "down" | "left" | "right"
	/** Size adjustment in cells */
	adjustment?: number
	/** Absolute width */
	width?: number
	/** Absolute height */
	height?: number
}

/** Options for capturing pane content */
export interface CaptureOptions {
	/** Start line (negative for scrollback) */
	start?: number
	/** End line */
	end?: number
	/** Include escape sequences (-e flag) */
	escapeSequences?: boolean
	/** Strip trailing whitespace (-T flag) */
	stripTrailing?: boolean
}
