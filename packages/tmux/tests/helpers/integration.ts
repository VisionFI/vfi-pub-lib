import { describe } from "bun:test"

export const describeIntegration = process.env.TMUX_INTEGRATION === "1" ? describe : describe.skip
