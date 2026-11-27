import { z } from 'zod'
import { defineBlockDef } from '../block.js'

export const Chart = defineBlockDef({
  name: 'Chart',
  description:
    'Shows numeric trends with a line chart or compares categories with horizontal or vertical bars. ' +
    'List the series labels in display order. For snapshots, supply rows with a category label and one value per series in the same order. Use null for a missing value. All series share one unit. ' +
    'For a rolling line trace, use variant "trace" and set latest to one numeric value or read-only state reference per series, for example [{"$state":"/x"},{"$state":"/y"},{"$state":"/z"}]. Omit rows. The chart timestamps the first complete tuple and each change it observes, keeping up to 300 points from the last five minutes. The host supplies the readings.',
  props: z.object({
    title: z.string(),
    variant: z.enum(['line', 'bar-horizontal', 'bar-vertical', 'trace']),
    series: z.array(z.string()).min(1).max(5),
    unit: z.string().optional(),
    rows: z
      .array(
        z.object({
          label: z.string(),
          values: z.array(z.number().nullable()),
        }),
      )
      .optional(),
    latest: z
      .array(z.union([z.number(), z.strictObject({ $state: z.string() })]))
      .min(1)
      .max(5)
      .optional(),
  }),
})

export const DataTable = defineBlockDef({
  name: 'DataTable',
  description:
    'Displays rows of text or numbers under labelled columns. Put cells in column order and use null for an empty cell. Set sortable to let a person sort locally by column.',
  props: z.object({
    caption: z.string().optional(),
    columns: z.array(z.string()).min(1),
    rows: z.array(z.array(z.union([z.string(), z.number(), z.null()]))),
    sortable: z.boolean().optional(),
  }),
})

export const Collapsible = defineBlockDef({
  name: 'Collapsible',
  description:
    'Shows a short summary as a toggle. Put optional detail text and child blocks inside the collapsed panel.',
  props: z.object({
    summary: z.string(),
    details: z.string().optional(),
  }),
  slots: ['default'],
})

export const Carousel = defineBlockDef({
  name: 'Carousel',
  description:
    'Browses images the host already has URLs for. Use those URLs as supplied and give each image alt text and an optional caption.',
  props: z.object({
    label: z.string(),
    images: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
        }),
      )
      .min(1),
  }),
})
