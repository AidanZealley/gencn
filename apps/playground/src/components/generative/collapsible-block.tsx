import { Collapsible } from 'gencn'
import { defineBlock } from 'gencn/react'
import {
  Collapsible as Disclosure,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export const collapsibleBlock = defineBlock(
  Collapsible,
  ({ props, children }) => (
    <Disclosure className="rounded-lg border">
      <CollapsibleTrigger
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm font-medium focus-visible:outline-2 [&[aria-expanded=true]>span]:rotate-180"
      >
        {props.summary}
        <span aria-hidden="true">⌄</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-2 px-3 pb-3">
          {props.details && (
            <p className="text-sm text-muted-foreground">{props.details}</p>
          )}
          {children}
        </div>
      </CollapsibleContent>
    </Disclosure>
  ),
)
