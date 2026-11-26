// gencn's renderer. React is an optional peer of gencn: only this
// subpath needs it. The view itself is the React-free `createViewActor`.
export {
  createBlocks,
  defineBlock,
  type Block,
  type BlockView,
  type ExactCover,
  type ViewBlocks,
} from './blocks.js'
export { useGencnView, type GencnViewOptions } from './useGencnView.js'
