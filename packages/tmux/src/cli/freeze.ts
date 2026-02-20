import { writeFileSync } from "node:fs"
import chalk from "chalk"
import { stringify as stringifyYaml } from "yaml"
import { Server } from "../core/server.js"
import { freezeSession } from "../workspace/freezer.js"

/** Freeze a running session to a config file */
export function freezeCommand(
	sessionName: string,
	options: { socketName?: string; socketPath?: string; output?: string; format?: string },
): void {
	const server = new Server({
		socketName: options.socketName,
		socketPath: options.socketPath,
	})

	const session = server.getSession(sessionName)
	if (!session) {
		console.error(chalk.red(`Session '${sessionName}' not found.`))
		process.exit(1)
	}

	const config = freezeSession(session)
	const outputFormat = options.format ?? (options.output?.endsWith(".json") ? "json" : "yaml")

	let content: string
	if (outputFormat === "json") {
		content = JSON.stringify(config, null, 2)
	} else {
		content = stringifyYaml(config, { lineWidth: 120 })
	}

	if (options.output) {
		writeFileSync(options.output, content, "utf-8")
		console.log(chalk.green(`Session '${sessionName}' frozen to ${options.output}`))
	} else {
		console.log(content)
	}
}
