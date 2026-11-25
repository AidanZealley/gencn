'use client'

import { Switch as SwitchDef } from 'gencn'
import { defineBlock } from 'gencn/react'
import { useId, useState } from 'react'
import { useBoundProp } from '@json-render/react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export const switchBlock = defineBlock(
  SwitchDef,
  function SwitchBlock({ props, bindings, emit }) {
    const id = useId()
    // Bound with $bindState: the view's state owns the value. Else this does.
    const path = bindings?.checked
    const [bound, setBound] = useBoundProp(props.checked, path)
    const [local, setLocal] = useState(props.checked ?? false)
    const checked = path ? (bound ?? false) : local

    return (
      <Field orientation="horizontal" data-disabled={props.disabled}>
        <FieldContent>
          <FieldLabel htmlFor={id}>{props.label}</FieldLabel>
          {props.description && (
            <FieldDescription>{props.description}</FieldDescription>
          )}
        </FieldContent>
        <Switch
          id={id}
          checked={checked}
          disabled={props.disabled}
          onCheckedChange={(next) => {
            if (path) setBound(next)
            else setLocal(next)
            // turnOn/turnOff for separate on and off tools; change for a
            // tool that takes the new value. A view binds one or the other.
            emit(next ? 'turnOn' : 'turnOff')
            emit('change')
          }}
        />
      </Field>
    )
  },
)
