'use client'

import { Select as SelectDef } from 'gencn'
import { defineBlock } from 'gencn/react'
import { useId, useState } from 'react'
import { useBoundProp } from '@json-render/react'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export const selectBlock = defineBlock(
  SelectDef,
  function SelectBlock({ props, bindings, emit }) {
    const id = useId()
    // Bound with $bindState: the view's state owns the value. Else this does.
    const path = bindings?.value
    const [bound, setBound] = useBoundProp(props.value, path)
    const [local, setLocal] = useState(props.value ?? null)
    const value = path ? (bound ?? null) : local

    return (
      <Field data-disabled={props.disabled}>
        <FieldLabel htmlFor={id}>{props.label}</FieldLabel>
        <Select
          items={props.options}
          value={value}
          disabled={props.disabled}
          onValueChange={(next) => {
            if (next === null) return
            if (path) setBound(next)
            else setLocal(next)
            emit('change')
          }}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={props.placeholder ?? 'Choose…'} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    )
  },
)
