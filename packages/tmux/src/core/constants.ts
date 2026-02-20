/** Pane split direction */
export const PaneDirection = {
	Horizontal: "horizontal",
	Vertical: "vertical",
} as const
export type PaneDirection = (typeof PaneDirection)[keyof typeof PaneDirection]

/** Resize direction */
export const ResizeDirection = {
	Up: "up",
	Down: "down",
	Left: "left",
	Right: "right",
} as const
export type ResizeDirection = (typeof ResizeDirection)[keyof typeof ResizeDirection]

/** Built-in tmux layout types */
export const LayoutType = {
	EvenHorizontal: "even-horizontal",
	EvenVertical: "even-vertical",
	MainHorizontal: "main-horizontal",
	MainVertical: "main-vertical",
	Tiled: "tiled",
} as const
export type LayoutType = (typeof LayoutType)[keyof typeof LayoutType]

/** Record separator used between fields in format output (ASCII RS) */
export const RECORD_SEPARATOR = "\x1e"

/** Line separator used between records in format output */
export const LINE_SEPARATOR = "\n"
