import { execSync } from "node:child_process"
import type { TmuxCommandResult } from "./types.js"

/** Default timeout for tmux commands in milliseconds */
const DEFAULT_TIMEOUT = 5000

/** Path to the tmux binary */
let tmuxBin = "tmux"

/** Set a custom tmux binary path */
export function setTmuxBinary(path: string): void {
	tmuxBin = path
}

/** Get the current tmux binary path */
export function getTmuxBinary(): string {
	return tmuxBin
}

/**
 * Execute a raw tmux command and return structured result.
 *
 * @param args - Arguments to pass to tmux
 * @param options - Execution options
 * @returns Structured command result with stdout, stderr, and return code
 */
export function tmuxCmd(
	args: string[],
	options?: {
		timeout?: number
		/** Additional tmux server flags (-L, -S, -f) prepended before args */
		serverFlags?: string[]
	},
): TmuxCommandResult {
	const timeout = options?.timeout ?? DEFAULT_TIMEOUT
	const serverFlags = options?.serverFlags ?? []
	const fullArgs = [...serverFlags, ...args]
	const command = [tmuxBin, ...fullArgs].map(shellEscape).join(" ")

	try {
		const stdout = execSync(command, {
			timeout,
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		})

		return {
			stdout: splitOutput(stdout),
			stderr: [],
			returnCode: 0,
		}
	} catch (error: unknown) {
		if (isExecError(error)) {
			return {
				stdout: splitOutput(typeof error.stdout === "string" ? error.stdout : ""),
				stderr: splitOutput(typeof error.stderr === "string" ? error.stderr : ""),
				returnCode: error.status ?? 1,
			}
		}
		throw error
	}
}

/** Get the installed tmux version string */
export function getTmuxVersion(): string {
	const result = tmuxCmd(["-V"])
	if (result.returnCode !== 0) {
		throw new Error("tmux is not installed or not in PATH")
	}
	const versionLine = result.stdout[0] ?? ""
	// "tmux 3.4" → "3.4"
	return versionLine.replace(/^tmux\s+/, "").trim()
}

/** Check if tmux is available on this system */
export function hasTmux(): boolean {
	try {
		const result = tmuxCmd(["-V"])
		return result.returnCode === 0
	} catch {
		return false
	}
}

/** Split command output into lines, filtering empty trailing lines */
function splitOutput(output: string): string[] {
	if (!output) return []
	const lines = output.split("\n")
	// Remove trailing empty line from newline-terminated output
	if (lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop()
	}
	return lines
}

/** Escape a string for safe shell execution */
function shellEscape(arg: string): string {
	// If the arg is safe (alphanumeric, dashes, underscores, dots, slashes, colons, equals, at, percent, hash, plus, comma, curly braces),
	// no escaping needed
	if (/^[a-zA-Z0-9_\-./=:@%#+,{}]+$/.test(arg)) {
		return arg
	}
	// Otherwise wrap in single quotes, escaping any existing single quotes
	return `'${arg.replace(/'/g, "'\\''")}'`
}

/** Type guard for exec errors */
function isExecError(error: unknown): error is { stdout: unknown; stderr: unknown; status: number | null } {
	return typeof error === "object" && error !== null && "status" in error
}
