#!/usr/bin/env bun
import { createCli } from "../src/cli/index.js"

const program = createCli()
program.parse()
