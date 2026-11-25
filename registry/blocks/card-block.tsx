'use client'

import { Card as CardDef } from 'gencn'
import { defineBlock } from 'gencn/react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export const cardBlock = defineBlock(
  CardDef,
  function CardBlock({ props, children }) {
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
  },
)
