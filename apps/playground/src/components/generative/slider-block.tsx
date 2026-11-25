'use client'

import { Slider as SliderDef } from '@gencn/core'
import { defineBlock } from '@gencn/core/react'
import { useId, useState } from 'react'
import { useBoundProp } from '@json-render/react'
import { Field, FieldLabel } from '@/components/ui/field'
import { Slider } from '@/components/ui/slider'

const first = (value: number | readonly number[]) =>
  typeof value === 'number' ? value : (value[0] ?? 0)

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export const sliderBlock = defineBlock(
  SliderDef,
  function SliderBlock({ props, bindings, emit }) {
    const id = useId()
    const { min = 0, max = 100, step = 1, unit = '' } = props
    // Bound with $bindState: the view's state owns the value. Else this does.
    const path = bindings?.value
    const [bound, setBound] = useBoundProp(props.value, path)
    const [local, setLocal] = useState(props.value ?? min)
    const value = path ? (bound ?? min) : local

    return (
      <Field data-disabled={props.disabled}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor={id}>{props.label}</FieldLabel>
          <span className="text-sm text-muted-foreground tabular-nums">
            {value}
            {unit}
          </span>
        </div>
        <Slider
          id={id}
          value={[value]}
          min={min}
          max={max}
          step={step}
          disabled={props.disabled}
          onValueChange={(next) => {
            if (path) setBound(first(next))
            else setLocal(first(next))
          }}
          // Fire once on release, so a drag doesn't call an action per tick.
          onValueCommitted={() => emit('change')}
        />
      </Field>
    )
  },
)
