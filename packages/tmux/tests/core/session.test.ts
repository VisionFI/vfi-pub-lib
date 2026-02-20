import { afterAll, beforeAll, expect, test } from "bun:test"
import { Server } from "../../src/core/server"
import type { Session } from "../../src/core/session"
import { describeIntegration } from "../helpers/integration"

const TEST_SESSION = "__vfi_tmux_test_session__"

describeIntegration("Session", () => {
	let server: Server
	let session: Session

	beforeAll(() => {
		server = new Server()
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}
		session = server.newSession({
			sessionName: TEST_SESSION,
			detached: true,
		})
	})

	afterAll(() => {
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}
	})

	test("session has correct name", () => {
		expect(session.name).toBe(TEST_SESSION)
	})

	test("session has valid sessionId", () => {
		expect(session.sessionId).toMatch(/^\$\d+$/)
	})

	test("windows returns at least one window", () => {
		const windows = session.windows
		expect(windows.length).toBeGreaterThanOrEqual(1)
	})

	test("activeWindow returns the current window", () => {
		const active = session.activeWindow
		expect(active).toBeDefined()
	})

	test("newWindow creates a window", () => {
		const window = session.newWindow({
			windowName: "test-window",
			detached: true,
		})
		expect(window.name).toBe("test-window")
		expect(session.windows.length).toBeGreaterThanOrEqual(2)
	})

	test("getWindow finds a window by name", () => {
		const window = session.getWindow("test-window")
		expect(window).toBeDefined()
		if (!window) {
			throw new Error("expected test-window")
		}
		expect(window.name).toBe("test-window")
	})

	test("panes returns all panes in the session", () => {
		const panes = session.panes
		expect(panes.length).toBeGreaterThanOrEqual(2)
	})

	test("rename changes session name", () => {
		const newName = `${TEST_SESSION}_renamed`
		session.rename(newName)
		expect(session.name).toBe(newName)
		// Rename back
		session.rename(TEST_SESSION)
	})

	test("refresh updates session data", () => {
		const refreshed = session.refresh()
		expect(refreshed.name).toBe(TEST_SESSION)
	})

	test("killWindow removes a window", () => {
		const before = session.windows.length
		session.killWindow("test-window")
		expect(session.windows.length).toBe(before - 1)
	})

	test("toString returns readable string", () => {
		expect(session.toString()).toContain(TEST_SESSION)
	})
})
