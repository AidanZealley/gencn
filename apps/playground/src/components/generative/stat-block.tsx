import type { BlockProps } from '@gencn/core'
import type { BaseComponentProps } from '@json-render/react'

export function StatBlock({ props }: BaseComponentProps<BlockProps<'Stat'>>) {
  const { label, value, unit, caption } = props
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-heading text-2xl font-semibold tabular-nums">
        {value}
        {unit && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </span>
      {caption && (
        <span className="text-xs text-muted-foreground">{caption}</span>
      )}
    </div>
  )
}
