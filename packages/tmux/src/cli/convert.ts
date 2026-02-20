import { readFileSync, writeFileSync } from "node:fs"
import chalk from "chalk"
import { parse as parseYaml, stringify as stringifyYaml } from "yaml"

/** Convert between YAML and JSON config formats */
export function convertCommand(inputPath: string, options: { output?: string }): void {
	const content = readFileSync(inputPath, "utf-8")
	const isJson = inputPath.endsWith(".json")

	let parsed: unknown
	if (isJson) {
		parsed = JSON.parse(content)
	} else {
		parsed = parseYaml(content)
	}

	let output: string
	let outputExt: string
	if (isJson) {
		output = stringifyYaml(parsed, { lineWidth: 120 })
		outputExt = ".yaml"
	} else {
		output = JSON.stringify(parsed, null, 2)
		outputExt = ".json"
	}

	if (options.output) {
		writeFileSync(options.output, output, "utf-8")
		console.log(chalk.green(`Converted ${inputPath} → ${options.output}`))
	} else {
		const defaultOutput = inputPath.replace(/\.(ya?ml|json)$/, outputExt)
		if (defaultOutput === inputPath) {
			// Just print to stdout if we can't determine output name
			console.log(output)
		} else {
			writeFileSync(defaultOutput, output, "utf-8")
			console.log(chalk.green(`Converted ${inputPath} → ${defaultOutput}`))
		}
	}
}
