import { describe, expect, test } from "bun:test"
import { resolve } from "node:path"
import { expand, loadConfig, parseConfig, trickle } from "../../src/workspace/loader"

const FIXTURES_DIR = resolve(import.meta.dir, "../fixtures")

describe("loader", () => {
	test("loadConfig loads and validates a YAML file", () => {
		const config = loadConfig(`${FIXTURES_DIR}/sample-workspace.yaml`)
		expect(config.session_name).toBe("test-workspace")
		expect(config.windows.length).toBe(3)
	})

	test("parseConfig parses YAML string", () => {
		const yaml = `
session_name: test
windows:
  - window_name: main
    panes:
      - echo hello
`
		const config = parseConfig(yaml)
		expect(config.session_name).toBe("test")
		expect(config.windows[0].window_name).toBe("main")
		// String shorthand should be expanded
		expect(config.windows[0].panes[0].shell_command).toEqual(["echo hello"])
	})

	test("parseConfig parses JSON string", () => {
		const json = JSON.stringify({
			session_name: "test",
			windows: [{ window_name: "main", panes: [{}] }],
		})
		const config = parseConfig(json, "json")
		expect(config.session_name).toBe("test")
	})

	test("expand normalizes string pane to object", () => {
		const raw = {
			session_name: "test",
			windows: [
				{
					window_name: "main",
					panes: ["echo hello"],
				},
			],
		}
		const result = expand(raw)
		const panes = (result.windows as any[])[0].panes
		expect(panes[0]).toEqual({ shell_command: ["echo hello"] })
	})

	test("expand normalizes string shell_command to array", () => {
		const raw = {
			session_name: "test",
			windows: [
				{
					window_name: "main",
					panes: [{ shell_command: "echo hello" }],
				},
			],
		}
		const result = expand(raw)
		const panes = (result.windows as any[])[0].panes
		expect(panes[0].shell_command).toEqual(["echo hello"])
	})

	test("expand normalizes string shell_command_before to array", () => {
		const raw = {
			session_name: "test",
			shell_command_before: "source ~/.bashrc",
			windows: [{ window_name: "main", panes: [{}] }],
		}
		const result = expand(raw)
		expect(result.shell_command_before).toEqual(["source ~/.bashrc"])
	})

	test("trickle inherits start_directory from session to window", () => {
		const config = {
			session_name: "test",
			start_directory: "/tmp",
			windows: [{ window_name: "main", panes: [{}] }],
		}
		const result = trickle(config)
		expect((result.windows as any[])[0].start_directory).toBe("/tmp")
	})

	test("trickle inherits start_directory from window to pane", () => {
		const config = {
			session_name: "test",
			windows: [
				{
					window_name: "main",
					start_directory: "/home",
					panes: [{}],
				},
			],
		}
		const result = trickle(config)
		expect((result.windows as any[])[0].panes[0].start_directory).toBe("/home")
	})

	test("trickle does not override explicit start_directory", () => {
		const config = {
			session_name: "test",
			start_directory: "/tmp",
			windows: [
				{
					window_name: "main",
					start_directory: "/home",
					panes: [{ start_directory: "/var" }],
				},
			],
		}
		const result = trickle(config)
		expect((result.windows as any[])[0].start_directory).toBe("/home")
		expect((result.windows as any[])[0].panes[0].start_directory).toBe("/var")
	})

	test("trickle inherits shell_command_before from session to window", () => {
		const config = {
			session_name: "test",
			shell_command_before: ["source ~/.bashrc"],
			windows: [{ window_name: "main", panes: [{}] }],
		}
		const result = trickle(config)
		expect((result.windows as any[])[0].shell_command_before).toEqual(["source ~/.bashrc"])
	})
})
