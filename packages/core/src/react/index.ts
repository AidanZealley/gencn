// gencn's renderer. React is an optional peer of @gencn/core: only this
// subpath needs it.
export {
  createBlocks,
  defineBlock,
  type Block,
  type BlockView,
  type Blocks,
  type ExactCover,
} from './blocks.js'
export { GencnView, type GencnViewProps } from './GencnView.js'
export {
  useGencnView,
  type ActionOutcome,
  type Args,
  type CallOptions,
  type GencnPhase,
  type GencnViewOptions,
  type OnAction,
  type OnRead,
} from './useGencnView.js'
