// Core — Server, Session, Window, Pane object model
export {
	Server,
	Session,
	Window,
	Pane,
	tmuxCmd,
	getTmuxVersion,
	hasTmux,
	setTmuxBinary,
	getTmuxBinary,
	buildFormatString,
	parseFormatOutput,
	getFormatFields,
	SESSION_FORMATS,
	WINDOW_FORMATS,
	PANE_FORMATS,
	PaneDirection,
	ResizeDirection,
	LayoutType,
	RECORD_SEPARATOR,
	LINE_SEPARATOR,
} from "./core/index.js"
export type {
	TmuxCommandResult,
	ServerOptions,
	NewSessionOptions,
	NewWindowOptions,
	SplitOptions,
	ResizeOptions,
	CaptureOptions,
} from "./core/index.js"

// Workspace — config loading, building, freezing
export {
	loadConfig,
	parseConfig,
	expand,
	trickle,
	buildWorkspace,
	freezeSession,
	validateConfig,
	WorkspaceValidationError,
} from "./workspace/index.js"
export type { BuildOptions, WorkspaceConfig, WindowConfig, PaneConfig } from "./workspace/index.js"

// Plugin — extension system
export { TmuxPlugin } from "./plugin/index.js"
