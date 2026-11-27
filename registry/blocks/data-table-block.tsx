'use client'

import { useState } from 'react'
import { DataTable } from 'gencn'
import { defineBlock } from 'gencn/react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Sort = { column: number; direction: 'ascending' | 'descending' }
type Cell = string | number | null | undefined
const collator = new Intl.Collator(undefined, { numeric: true })

function compareCells(a: Cell, b: Cell) {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'number') return -1
  if (typeof b === 'number') return 1
  return collator.compare(String(a), String(b))
}

export const dataTableBlock = defineBlock(
  DataTable,
  function DataTableBlock({ props }) {
    const [sort, setSort] = useState<Sort>()
    const active =
      props.sortable && sort && sort.column < props.columns.length
        ? sort
        : undefined
    const indexed = props.rows.map((cells, index) => ({ cells, index }))
    const rows = active
      ? indexed.sort((a, b) => {
          const left = a.cells[active.column]
          const right = b.cells[active.column]
          if (left == null || right == null)
            return Number(left == null) - Number(right == null)
          const order = compareCells(left, right)
          return active.direction === 'ascending' ? order : -order
        })
      : indexed

    return (
      <Table>
        {props.caption && <TableCaption>{props.caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {props.columns.map((label, column) => {
              const direction =
                active?.column === column ? active.direction : undefined
              return (
                <TableHead key={column} scope="col" aria-sort={direction}>
                  {props.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-sm focus-visible:outline-2"
                      onClick={() =>
                        setSort({
                          column,
                          direction:
                            direction === 'ascending'
                              ? 'descending'
                              : 'ascending',
                        })
                      }
                    >
                      {label}
                      <span aria-hidden="true">
                        {direction === 'ascending'
                          ? '↑'
                          : direction === 'descending'
                            ? '↓'
                            : '↕'}
                      </span>
                    </button>
                  ) : (
                    label
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ cells, index }) => (
            <TableRow key={index}>
              {props.columns.map((_, column) => (
                <TableCell key={column}>{cells[column] ?? '—'}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  },
)
