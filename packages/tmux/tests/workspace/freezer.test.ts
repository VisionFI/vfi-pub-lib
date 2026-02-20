import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Server } from "../../src/core/server"
import type { Session } from "../../src/core/session"
import { buildWorkspace } from "../../src/workspace/builder"
import { freezeSession } from "../../src/workspace/freezer"
import type { WorkspaceConfig } from "../../src/workspace/types"

const TEST_SESSION = "__vfi_tmux_test_freezer__"

describe("freezer", () => {
	let server: Server
	let session: Session

	beforeAll(async () => {
		server = new Server()
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}

		const config: WorkspaceConfig = {
			session_name: TEST_SESSION,
			start_directory: "/tmp",
			windows: [
				{
					window_name: "code",
					panes: [{ shell_command: ["echo frozen"] }],
				},
				{
					window_name: "term",
					panes: [{}, {}],
				},
			],
		}
		session = await buildWorkspace(server, config)
	})

	afterAll(() => {
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}
	})

	test("freezeSession returns a valid config", () => {
		const config = freezeSession(session)
		expect(config.session_name).toBe(TEST_SESSION)
		expect(config.windows.length).toBe(2)
	})

	test("frozen config has correct window names", () => {
		const config = freezeSession(session)
		const names = config.windows.map((w) => w.window_name)
		expect(names).toContain("code")
		expect(names).toContain("term")
	})

	test("frozen config captures pane count", () => {
		const config = freezeSession(session)
		const termWindow = config.windows.find((w) => w.window_name === "term")
		expect(termWindow).toBeDefined()
		if (!termWindow) {
			throw new Error("expected term window")
		}
		expect(termWindow.panes.length).toBe(2)
	})

	test("frozen config has layout information", () => {
		const config = freezeSession(session)
		// At least one window should have a layout
		const hasLayout = config.windows.some((w) => w.layout)
		expect(hasLayout).toBe(true)
	})
})
