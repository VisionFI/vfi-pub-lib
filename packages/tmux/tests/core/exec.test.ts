import { describe, expect, test } from "bun:test"
import { getTmuxVersion, hasTmux, tmuxCmd } from "../../src/core/exec"

describe("exec", () => {
	test("hasTmux returns true when tmux is installed", () => {
		expect(hasTmux()).toBe(true)
	})

	test("getTmuxVersion returns a version string", () => {
		const version = getTmuxVersion()
		expect(version).toMatch(/^\d+\.\d+/)
	})

	test("tmuxCmd returns structured result for valid command", () => {
		const result = tmuxCmd(["-V"])
		expect(result.returnCode).toBe(0)
		expect(result.stdout.length).toBeGreaterThan(0)
		expect(result.stdout[0]).toContain("tmux")
		expect(result.stderr).toEqual([])
	})

	test("tmuxCmd returns non-zero for invalid command", () => {
		const result = tmuxCmd(["nonexistent-command"])
		expect(result.returnCode).not.toBe(0)
	})

	test("tmuxCmd handles server flags", () => {
		const result = tmuxCmd(["-V"], { serverFlags: [] })
		expect(result.returnCode).toBe(0)
	})
})
