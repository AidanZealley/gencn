import type { BlockProps } from '@gencn/core'
import type { BaseComponentProps } from '@json-render/react'
import { Badge } from '@/components/ui/badge'

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export function BadgeBlock({ props }: BaseComponentProps<BlockProps<'Badge'>>) {
  return <Badge variant={props.variant ?? 'default'}>{props.text}</Badge>
}
