import type { BlockProps } from '@gencn/core'
import type { BaseComponentProps } from '@json-render/react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export function CardBlock({
  props,
  children,
}: BaseComponentProps<BlockProps<'Card'>>) {
  const { title, description } = props
  return (
    <Card>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  )
}
