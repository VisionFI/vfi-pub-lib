import { Command } from "commander"
import { convertCommand } from "./convert.js"
import { freezeCommand } from "./freeze.js"
import { listCommand } from "./list.js"
import { loadCommand } from "./load.js"

export function createCli(): Command {
	const program = new Command()
		.name("vfi-tmux")
		.description("TypeScript tmux workspace manager — inspired by libtmux + tmuxp")
		.version("0.1.0")

	// Global options
	program.option("-L, --socket-name <name>", "tmux socket name")
	program.option("-S, --socket-path <path>", "tmux socket path")

	// Load command
	program
		.command("load <config>")
		.description("Load a workspace from a YAML or JSON config file")
		.option("-k, --kill-existing", "Kill existing session with same name", false)
		.action(async (configPath: string, opts: { killExisting: boolean }) => {
			const globalOpts = program.opts()
			await loadCommand(configPath, {
				socketName: globalOpts.socketName,
				socketPath: globalOpts.socketPath,
				killExisting: opts.killExisting,
			})
		})

	// Freeze command
	program
		.command("freeze <session>")
		.description("Freeze a running session to a config file")
		.option("-o, --output <file>", "Output file path (default: stdout)")
		.option("-f, --format <format>", "Output format: yaml or json (default: yaml)")
		.action((sessionName: string, opts: { output?: string; format?: string }) => {
			const globalOpts = program.opts()
			freezeCommand(sessionName, {
				socketName: globalOpts.socketName,
				socketPath: globalOpts.socketPath,
				output: opts.output,
				format: opts.format,
			})
		})

	// List command
	program
		.command("list")
		.alias("ls")
		.description("List sessions, windows, and panes")
		.action(() => {
			const globalOpts = program.opts()
			listCommand({
				socketName: globalOpts.socketName,
				socketPath: globalOpts.socketPath,
			})
		})

	// Convert command
	program
		.command("convert <file>")
		.description("Convert between YAML and JSON config formats")
		.option("-o, --output <file>", "Output file path")
		.action((file: string, opts: { output?: string }) => {
			convertCommand(file, opts)
		})

	return program
}
