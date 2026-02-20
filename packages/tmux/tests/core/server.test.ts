import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Server } from "../../src/core/server"

const TEST_SESSION = "__vfi_tmux_test_server__"

describe("Server", () => {
	let server: Server

	beforeAll(() => {
		server = new Server()
		// Clean up any leftover test sessions
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}
	})

	afterAll(() => {
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}
	})

	test("isAlive returns true when tmux server is running", () => {
		// The vfi session should be running
		expect(server.isAlive()).toBe(true)
	})

	test("sessions returns an array of sessions", () => {
		const sessions = server.sessions
		expect(Array.isArray(sessions)).toBe(true)
		expect(sessions.length).toBeGreaterThan(0)
	})

	test("newSession creates and returns a session", () => {
		const session = server.newSession({
			sessionName: TEST_SESSION,
			detached: true,
		})
		expect(session.name).toBe(TEST_SESSION)
		expect(session.sessionId).toMatch(/^\$\d+$/)
	})

	test("hasSession returns true for existing session", () => {
		expect(server.hasSession(TEST_SESSION)).toBe(true)
	})

	test("hasSession returns false for non-existing session", () => {
		expect(server.hasSession("__nonexistent_session__")).toBe(false)
	})

	test("getSession finds a session by name", () => {
		const session = server.getSession(TEST_SESSION)
		expect(session).toBeDefined()
		if (!session) {
			throw new Error("expected test session")
		}
		expect(session.name).toBe(TEST_SESSION)
	})

	test("windows returns all windows across sessions", () => {
		const windows = server.windows
		expect(Array.isArray(windows)).toBe(true)
		expect(windows.length).toBeGreaterThan(0)
	})

	test("panes returns all panes across sessions", () => {
		const panes = server.panes
		expect(Array.isArray(panes)).toBe(true)
		expect(panes.length).toBeGreaterThan(0)
	})

	test("killSession removes a session", () => {
		server.killSession(TEST_SESSION)
		expect(server.hasSession(TEST_SESSION)).toBe(false)
	})
})
