/** Top-level workspace configuration (tmuxp-compatible) */
export interface WorkspaceConfig {
	/** Session name */
	session_name: string
	/** Default starting directory for all windows/panes */
	start_directory?: string
	/** Environment variables to set */
	environment?: Record<string, string>
	/** tmux global options (set-option -g) */
	global_options?: Record<string, unknown>
	/** tmux session options (set-option) */
	options?: Record<string, unknown>
	/** Commands to run before each pane command */
	shell_command_before?: string | string[]
	/** Whether to suppress adding commands to shell history */
	suppress_history?: boolean
	/** Plugin names to load */
	plugins?: string[]
	/** Windows in this session */
	windows: WindowConfig[]
}

/** Window configuration within a workspace */
export interface WindowConfig {
	/** Window name */
	window_name: string
	/** Starting directory (inherits from session if not set) */
	start_directory?: string
	/** tmux layout (e.g. "main-vertical", "tiled", or a custom layout string) */
	layout?: string
	/** Commands to run before each pane command in this window */
	shell_command_before?: string | string[]
	/** tmux window options */
	options?: Record<string, unknown>
	/** Whether this window should be focused after creation */
	focus?: boolean
	/** Panes in this window */
	panes: PaneConfig[]
}

/** Pane configuration within a window */
export interface PaneConfig {
	/** Commands to run in this pane */
	shell_command?: string | string[]
	/** Starting directory (inherits from window if not set) */
	start_directory?: string
	/** Whether this pane should be focused after creation */
	focus?: boolean
	/** Whether to press Enter after sending commands (default: true) */
	enter?: boolean
	/** Seconds to sleep before sending commands */
	sleep_before?: number
	/** Seconds to sleep after sending commands */
	sleep_after?: number
}
