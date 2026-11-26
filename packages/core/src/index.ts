import type * as blocks from './blocks/index.js'

export * from './blocks/index.js'
export { defineBlockDef, gap, type BlockDef, type PropsOf } from './block.js'
// gencn's own zod, for apps writing their own blocks: one copy, one version.
export { z } from 'zod'
export { CALL_TOOL, createCatalog, type Catalog } from './catalog.js'
export {
  createViewActor,
  ViewCallError,
  type ActionOutcome,
  type Args,
  type CallOptions,
  type GencnPhase,
  type Notice,
  type OnAction,
  type OnRead,
  type Unavailable,
  type ViewActor,
  type ViewHost,
} from './actor.js'
export { toolCalls, viewTools, type ToolCall } from './calls.js'
export {
  extract,
  extractedState,
  patternProblem,
  type Extracted,
} from './extract.js'
export { toolPrompt } from './prompt.js'
export {
  refreshSchema,
  type Extraction,
  type Refresh,
  type Spec,
} from './spec.js'
export {
  autoFix,
  checkRefresh,
  checkSpec,
  isExpression,
  validateBlocks,
  type BlockIssue,
} from './validate.js'

/** Every block gencn defines, by name, as a type only. */
export type Blocks = typeof blocks
export type BlockName = keyof Blocks
