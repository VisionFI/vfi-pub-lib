import chalk from "chalk"
import { Server } from "../core/server.js"
import { buildWorkspace } from "../workspace/builder.js"
import { loadConfig } from "../workspace/loader.js"

/** Load a workspace from a config file */
export async function loadCommand(
	configPath: string,
	options: { socketName?: string; socketPath?: string; killExisting?: boolean },
): Promise<void> {
	const server = new Server({
		socketName: options.socketName,
		socketPath: options.socketPath,
	})

	console.log(chalk.dim(`Loading workspace from ${configPath}...`))

	try {
		const config = loadConfig(configPath)
		console.log(chalk.dim(`Session: ${config.session_name} (${config.windows.length} windows)`))

		const session = await buildWorkspace(server, config, {
			killExisting: options.killExisting,
		})

		console.log(chalk.green(`Session '${session.name}' created successfully.`))
		console.log(chalk.dim(`Attach with: tmux attach -t ${session.name}`))
	} catch (error) {
		console.error(chalk.red(`Failed to load workspace: ${(error as Error).message}`))
		process.exit(1)
	}
}
