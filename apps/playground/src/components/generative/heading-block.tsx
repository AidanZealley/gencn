import type { BlockProps } from '@gencn/core'
import type { BaseComponentProps } from '@json-render/react'

const levels = {
  1: { Tag: 'h2', className: 'text-lg font-semibold' },
  2: { Tag: 'h3', className: 'text-base font-semibold' },
  3: { Tag: 'h4', className: 'text-sm font-medium' },
} as const

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export function HeadingBlock({
  props,
}: BaseComponentProps<BlockProps<'Heading'>>) {
  const { Tag, className } = levels[props.level ?? 2]
  return <Tag className={`font-heading ${className}`}>{props.text}</Tag>
}
