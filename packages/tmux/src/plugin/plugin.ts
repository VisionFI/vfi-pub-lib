import type { Session } from "../core/session.js"
import type { Window } from "../core/window.js"

/**
 * Base class for tmux workspace plugins.
 *
 * Plugins can hook into the workspace build lifecycle to
 * customize behavior at each stage.
 *
 * @example
 * ```typescript
 * class LoggingPlugin extends TmuxPlugin {
 *   name = "logging"
 *
 *   onWindowCreate(window: Window) {
 *     console.log(`Created window: ${window.name}`)
 *   }
 * }
 * ```
 */
export abstract class TmuxPlugin {
	/** Unique plugin name */
	abstract name: string

	/** Called before the workspace build starts, after session creation */
	beforeWorkspaceBuild?(_session: Session): void | Promise<void>

	/** Called when a window is created */
	onWindowCreate?(_window: Window): void | Promise<void>

	/** Called after all panes in a window are configured */
	afterWindowFinished?(_window: Window): void | Promise<void>

	/** Called before shell scripts are executed */
	beforeScript?(_session: Session): void | Promise<void>

	/** Called when reattaching to an existing session */
	onReattach?(_session: Session): void | Promise<void>
}
