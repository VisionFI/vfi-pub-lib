import { RECORD_SEPARATOR } from "./constants.js"

/** tmux format variables for sessions */
export const SESSION_FORMATS = {
	sessionId: "session_id",
	sessionName: "session_name",
	sessionCreated: "session_created",
	sessionWindows: "session_windows",
	sessionAttached: "session_attached",
	sessionWidth: "session_width",
	sessionHeight: "session_height",
	sessionPath: "session_path",
} as const

/** tmux format variables for windows */
export const WINDOW_FORMATS = {
	windowId: "window_id",
	windowName: "window_name",
	windowIndex: "window_index",
	windowWidth: "window_width",
	windowHeight: "window_height",
	windowLayout: "window_layout",
	windowActive: "window_active",
	windowPanes: "window_panes",
	sessionId: "session_id",
	sessionName: "session_name",
} as const

/** tmux format variables for panes */
export const PANE_FORMATS = {
	paneId: "pane_id",
	paneIndex: "pane_index",
	paneWidth: "pane_width",
	paneHeight: "pane_height",
	paneActive: "pane_active",
	panePid: "pane_pid",
	paneCurrentPath: "pane_current_path",
	paneCurrentCommand: "pane_current_command",
	paneTty: "pane_tty",
	windowId: "window_id",
	windowName: "window_name",
	windowIndex: "window_index",
	sessionId: "session_id",
	sessionName: "session_name",
} as const

/** Build a tmux -F format string from field names */
export function buildFormatString(fields: string[]): string {
	return fields.map((f) => `#{${f}}`).join(RECORD_SEPARATOR)
}

/** Parse tmux format output into an array of records */
export function parseFormatOutput(output: string[], fields: string[]): Record<string, string>[] {
	return output
		.filter((line) => line.length > 0)
		.map((line) => {
			const values = line.split(RECORD_SEPARATOR)
			const record: Record<string, string> = {}
			for (let i = 0; i < fields.length; i++) {
				record[fields[i]] = values[i] ?? ""
			}
			return record
		})
}

/** Get all format variable names from a format object */
export function getFormatFields(formats: Record<string, string>): string[] {
	return Object.values(formats)
}
