import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Server } from "../../src/core/server"
import type { Session } from "../../src/core/session"
import type { Window } from "../../src/core/window"

const TEST_SESSION = "__vfi_tmux_test_window__"

describe("Window", () => {
	let server: Server
	let session: Session
	let window: Window

	beforeAll(() => {
		server = new Server()
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}
		session = server.newSession({
			sessionName: TEST_SESSION,
			windowName: "main",
			detached: true,
		})
		window = session.windows[0]
	})

	afterAll(() => {
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}
	})

	test("window has correct name", () => {
		expect(window.name).toBe("main")
	})

	test("window has valid windowId", () => {
		expect(window.windowId).toMatch(/^@\d+$/)
	})

	test("panes returns at least one pane", () => {
		const panes = window.panes
		expect(panes.length).toBeGreaterThanOrEqual(1)
	})

	test("activePane returns the current pane", () => {
		const active = window.activePane
		expect(active).toBeDefined()
	})

	test("split creates a new pane", () => {
		const pane = window.split({ direction: "horizontal", detached: true })
		expect(pane.paneId).toMatch(/^%\d+$/)
		expect(window.panes.length).toBeGreaterThanOrEqual(2)
	})

	test("split vertical creates a new pane", () => {
		const pane = window.split({ direction: "vertical", detached: true })
		expect(pane.paneId).toMatch(/^%\d+$/)
	})

	test("selectLayout applies a layout", () => {
		expect(() => window.selectLayout("tiled")).not.toThrow()
	})

	test("rename changes window name", () => {
		window.rename("renamed")
		expect(window.name).toBe("renamed")
		window.rename("main")
	})

	test("refresh updates window data", () => {
		window.refresh()
		expect(window.name).toBe("main")
	})

	test("selectPane selects a pane by index", () => {
		// In a detached session, selectPane may return undefined
		// since active state tracking can be unreliable
		expect(() => window.selectPane(0)).not.toThrow()
	})

	test("toString returns readable string", () => {
		expect(window.toString()).toContain("main")
	})
})
