import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type { Pane } from "../../src/core/pane"
import { Server } from "../../src/core/server"
import type { Session } from "../../src/core/session"

const TEST_SESSION = "__vfi_tmux_test_pane__"

describe("Pane", () => {
	let server: Server
	let session: Session
	let pane: Pane

	beforeAll(() => {
		server = new Server()
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}
		session = server.newSession({
			sessionName: TEST_SESSION,
			detached: true,
		})
		pane = session.windows[0].panes[0]
	})

	afterAll(() => {
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}
	})

	test("pane has valid paneId", () => {
		expect(pane.paneId).toMatch(/^%\d+$/)
	})

	test("pane has dimensions", () => {
		expect(pane.width).toBeGreaterThan(0)
		expect(pane.height).toBeGreaterThan(0)
	})

	test("pane is active in its window", () => {
		expect(pane.isActive).toBe(true)
	})

	test("pane has a current path", () => {
		expect(typeof pane.currentPath).toBe("string")
	})

	test("sendKeys sends text to the pane", () => {
		expect(() => pane.sendKeys("echo test", { enter: true, literal: true })).not.toThrow()
	})

	test("capturePane returns pane content", () => {
		// Wait a moment for the command to process
		Bun.sleepSync(100)
		const lines = pane.capturePane()
		expect(Array.isArray(lines)).toBe(true)
	})

	test("capturePane with scrollback options", () => {
		const lines = pane.capturePane({ start: -50, end: 0 })
		expect(Array.isArray(lines)).toBe(true)
	})

	test("split creates a sibling pane", () => {
		const newPane = pane.split({ direction: "horizontal", detached: true })
		expect(newPane.paneId).toMatch(/^%\d+$/)
		expect(newPane.paneId).not.toBe(pane.paneId)
	})

	test("refresh updates pane data", () => {
		pane.refresh()
		expect(pane.width).toBeGreaterThan(0)
	})

	test("select focuses the pane", () => {
		expect(() => pane.select()).not.toThrow()
	})

	test("resize adjusts pane dimensions", () => {
		expect(() => pane.resize({ direction: "down", adjustment: 2 })).not.toThrow()
	})

	test("toString returns readable string", () => {
		expect(pane.toString()).toContain("%")
	})
})
