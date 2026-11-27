'use client'

import { useEffect, useReducer } from 'react'
import { Chart, type PropsOf } from 'gencn'
import { defineBlock } from 'gencn/react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Dot,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

type ChartProps = PropsOf<typeof Chart>
type Row = NonNullable<ChartProps['rows']>[number] & { time?: number }
type Observation = { time: number; values: number[] }
type Trace = {
  points: Observation[]
  // Keep comparing against the last tuple after its plotted point expires.
  latest?: number[]
}
type TraceEvent = { time: number; values: number[] } | { time: number }

const windowMs = 5 * 60 * 1000
const maxPoints = 300
const now = () => performance.timeOrigin + performance.now()
const axisTime = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
})
const observationTime = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
})

export function updateTrace(trace: Trace, event: TraceEvent): Trace {
  const cutoff = event.time - windowMs
  const retained =
    trace.points.length && trace.points[0].time <= cutoff
      ? trace.points.filter(({ time }) => time > cutoff)
      : trace.points
  if (
    'values' in event &&
    (!trace.latest ||
      trace.latest.length !== event.values.length ||
      !trace.latest.every((value, index) => value === event.values[index]))
  ) {
    return {
      points: [...retained, event].slice(-maxPoints),
      latest: event.values,
    }
  }
  return retained === trace.points ? trace : { ...trace, points: retained }
}

function TraceChart({ props }: { props: ChartProps }) {
  const { latest, series } = props
  const [trace, dispatch] = useReducer(updateTrace, { points: [] })

  useEffect(() => {
    if (!Array.isArray(latest) || latest.length !== series.length) return
    const values = Array.from(latest)
    if (
      values.every(
        (value): value is number =>
          typeof value === 'number' && Number.isFinite(value),
      )
    ) {
      dispatch({ time: now(), values })
    }
  }, [latest, series.length])

  const first = trace.points[0]
  useEffect(() => {
    if (!first) return
    const expiry = Math.ceil(first.time + windowMs)
    const timer = setTimeout(
      () => dispatch({ time: Math.max(expiry, now()) }),
      Math.max(0, Math.ceil(expiry - now())),
    )
    return () => clearTimeout(timer)
  }, [first])

  const rows = trace.points.map(({ time, values }) => ({
    time,
    label: observationTime.format(time),
    values,
  }))

  return <ChartFigure props={props} rows={rows} />
}

export const chartBlock = defineBlock(Chart, ({ props }) =>
  props.variant === 'trace' ? (
    <TraceChart
      key={JSON.stringify([props.series, props.unit])}
      props={props}
    />
  ) : (
    <ChartFigure props={props} rows={props.rows ?? []} />
  ),
)

function ChartFigure({ props, rows }: { props: ChartProps; rows: Row[] }) {
  const { title, unit, series, variant } = props
  const trace = variant === 'trace'
  const keys = series.map((_, index) => `series-${index + 1}`)
  const config: ChartConfig = Object.fromEntries(
    keys.map((key, index) => [
      key,
      {
        label: series[index],
        color: `var(--chart-${index + 1}, currentColor)`,
      },
    ]),
  )
  const data = rows.map(({ label, values, time }) => ({
    label,
    time,
    ...Object.fromEntries(
      keys.map((key, index) => [key, values[index] ?? null]),
    ),
  }))
  const horizontal = variant === 'bar-horizontal'
  const tooltip = (
    <ChartTooltip
      content={
        trace ? (
          <ChartTooltipContent
            labelFormatter={(_, payload) => payload[0]?.payload?.label}
          />
        ) : (
          <ChartTooltipContent />
        )
      }
    />
  )
  const legend = <ChartLegend content={<ChartLegendContent />} />

  return (
    <figure className="min-w-0 space-y-2">
      <figcaption className="text-sm font-medium">
        {title}
        {unit && <span className="text-muted-foreground"> ({unit})</span>}
      </figcaption>
      {rows.some(({ values }) =>
        keys.some((_, index) => values[index] != null),
      ) ? (
        <>
          <ChartContainer
            className="min-h-56 w-full"
            config={config}
            style={
              horizontal
                ? {
                    height: Math.max(
                      224,
                      rows.length * (series.length * 12 + 8) + 48,
                    ),
                    aspectRatio: 'auto',
                  }
                : undefined
            }
          >
            {variant === 'line' || trace ? (
              <LineChart
                data={data}
                accessibilityLayer
                title={unit ? `${title} (${unit})` : title}
                margin={{ top: 8, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                {trace ? (
                  <XAxis
                    type="number"
                    dataKey="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(time: number) => axisTime.format(time)}
                    minTickGap={16}
                  />
                ) : (
                  <XAxis dataKey="label" minTickGap={12} />
                )}
                <YAxis width="auto" />
                {tooltip}
                {legend}
                {keys.map((key) => (
                  <Line
                    key={key}
                    dataKey={key}
                    stroke={`var(--color-${key})`}
                    type={trace ? 'linear' : 'monotone'}
                    strokeWidth={2}
                    activeDot={{ r: 4 }}
                    dot={
                      trace
                        ? false
                        : ({ cx, cy, index, points, stroke }) =>
                            points[index - 1]?.y == null &&
                            points[index + 1]?.y == null ? (
                              <Dot cx={cx} cy={cy} r={3} fill={stroke} />
                            ) : null
                    }
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart
                data={data}
                layout={horizontal ? 'vertical' : 'horizontal'}
                accessibilityLayer
                title={unit ? `${title} (${unit})` : title}
                margin={{ top: 8, right: 12 }}
              >
                <CartesianGrid vertical={horizontal} horizontal={!horizontal} />
                {horizontal ? (
                  <XAxis type="number" />
                ) : (
                  <XAxis dataKey="label" minTickGap={12} />
                )}
                {horizontal ? (
                  <YAxis
                    type="category"
                    dataKey="label"
                    width="auto"
                    interval={0}
                  />
                ) : (
                  <YAxis width="auto" />
                )}
                {tooltip}
                {legend}
                {keys.map((key) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={`var(--color-${key})`}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            )}
          </ChartContainer>
          <details className="text-sm">
            <summary className="w-fit cursor-pointer rounded-sm text-muted-foreground focus-visible:outline-2">
              Chart data
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <caption className="sr-only">
                  {title}
                  {unit && ` (${unit})`}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="p-2 text-start">
                      {trace ? 'Observed at' : 'Category'}
                    </th>
                    {series.map((label, index) => (
                      <th key={index} scope="col" className="p-2 text-start">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ label, values }, index) => (
                    <tr key={index} className="border-t">
                      <th scope="row" className="p-2 text-start font-normal">
                        {label}
                      </th>
                      {keys.map((key, index) => (
                        <td key={key} className="p-2">
                          {values[index] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {trace ? 'No recent observations.' : 'No data available.'}
        </p>
      )}
    </figure>
  )
}
