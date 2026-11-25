import type { z } from 'zod'
import type * as blocks from './blocks/index.js'

export * from './blocks/index.js'
export type { Block } from './block.js'
export { checkSpec, validateBlocks, type BlockIssue } from './validate.js'
export { toolPrompt } from './prompt.js'

/**
 * Every block by name, as a type only: an app's catalog lists the blocks it
 * has installed, so there's deliberately no runtime map to spread.
 */
export type Blocks = typeof blocks
export type BlockName = keyof Blocks

/** A block's props after parsing, for typing its component. */
export type BlockProps<K extends BlockName> = z.output<Blocks[K]['props']>
