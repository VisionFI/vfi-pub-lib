import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Server } from "../../src/core/server"
import { buildWorkspace } from "../../src/workspace/builder"
import type { WorkspaceConfig } from "../../src/workspace/types"

const TEST_SESSION = "__vfi_tmux_test_builder__"

describe("builder", () => {
	let server: Server

	beforeAll(() => {
		server = new Server()
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}
	})

	afterAll(() => {
		if (server.hasSession(TEST_SESSION)) {
			server.killSession(TEST_SESSION)
		}
	})

	test("buildWorkspace creates a session from config", async () => {
		const config: WorkspaceConfig = {
			session_name: TEST_SESSION,
			start_directory: "/tmp",
			windows: [
				{
					window_name: "editor",
					panes: [{ shell_command: ["echo hello"] }, { shell_command: ["echo world"] }],
				},
				{
					window_name: "terminal",
					panes: [{}],
				},
			],
		}

		const session = await buildWorkspace(server, config)

		expect(session.name).toBe(TEST_SESSION)
		expect(session.windows.length).toBe(2)

		const firstWindow = session.windows.find((w) => w.name === "editor")
		expect(firstWindow).toBeDefined()
		if (!firstWindow) {
			throw new Error("expected editor window")
		}
		expect(firstWindow.panes.length).toBe(2)

		const secondWindow = session.windows.find((w) => w.name === "terminal")
		expect(secondWindow).toBeDefined()
	})

	test("buildWorkspace with killExisting replaces session", async () => {
		const config: WorkspaceConfig = {
			session_name: TEST_SESSION,
			windows: [
				{
					window_name: "fresh",
					panes: [{}],
				},
			],
		}

		const session = await buildWorkspace(server, config, { killExisting: true })
		expect(session.name).toBe(TEST_SESSION)
		expect(session.windows.length).toBe(1)
		expect(session.windows[0].name).toBe("fresh")
	})
})
