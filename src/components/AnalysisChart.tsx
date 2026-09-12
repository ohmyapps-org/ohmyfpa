import { FUNCTION_TYPES, TYPE_META, formatNumber } from '../lib/fpa'
import type { FunctionType } from '../lib/types'

export type ChartKind = 'radar' | 'ternary' | 'bars' | 'donut'
export type TypeSlice = { type: FunctionType; count: number; points: number }

const TAU = Math.PI * 2

function niceCeiling(value: number): number {
  if (value <= 5) return 5
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

function polar(cx: number, cy: number, radius: number, index: number, total: number): [number, number] {
  const angle = (index / total) * TAU - Math.PI / 2
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
}

function Radar({ slices }: { slices: TypeSlice[] }) {
  const cx = 180
  const cy = 148
  const radius = 104
  const max = niceCeiling(Math.max(...slices.map((slice) => slice.points), 1))
  const rings = [0.25, 0.5, 0.75, 1]

  const points = slices
    .map((slice, index) => polar(cx, cy, (slice.points / max) * radius, index, slices.length).join(','))
    .join(' ')

  return (
    <svg viewBox="0 0 360 296" role="img" aria-label="Distribución de puntos de función por tipo">
      {rings.map((ring) => (
        <polygon
          key={ring}
          className="chart-grid"
          points={slices
            .map((_, index) => polar(cx, cy, radius * ring, index, slices.length).join(','))
            .join(' ')}
        />
      ))}
      {slices.map((slice, index) => {
        const [x, y] = polar(cx, cy, radius, index, slices.length)
        return <line key={slice.type} className="chart-axis" x1={cx} y1={cy} x2={x} y2={y} />
      })}
      <polygon className="chart-area" points={points} />
      {slices.map((slice, index) => {
        const [x, y] = polar(cx, cy, (slice.points / max) * radius, index, slices.length)
        const [lx, ly] = polar(cx, cy, radius + 26, index, slices.length)
        return (
          <g key={slice.type}>
            <circle className="chart-dot" cx={x} cy={y} r={5} fill={TYPE_META[slice.type].hue}>
              <title>{`${slice.type} · ${slice.points} PF · ${slice.count} funciones`}</title>
            </circle>
            <text className="chart-label" x={lx} y={ly} textAnchor="middle">
              {slice.type}
            </text>
            <text className="chart-sublabel" x={lx} y={ly + 12} textAnchor="middle">
              {slice.points} PF
            </text>
          </g>
        )
      })}
      <text className="chart-sublabel" x={8} y={286} textAnchor="start">
        escala 0 – {max} PF
      </text>
    </svg>
  )
}

function Ternary({ slices }: { slices: TypeSlice[] }) {
  const get = (type: FunctionType) => slices.find((slice) => slice.type === type)?.points ?? 0
  const entradas = get('EI')
  const datos = get('ILF') + get('EIF')
  const salidas = get('EO') + get('EQ')
  const total = entradas + datos + salidas || 1

  const apex: [number, number] = [180, 36]
  const left: [number, number] = [64, 234]
  const right: [number, number] = [296, 234]

  const bary = (a: number, b: number, c: number): [number, number] => [
    (a * apex[0] + b * left[0] + c * right[0]) / total,
    (a * apex[1] + b * left[1] + c * right[1]) / total,
  ]

  const point = bary(datos, entradas, salidas)
  const grid = [0.25, 0.5, 0.75]

  return (
    <svg viewBox="0 0 360 296" role="img" aria-label="Balance ternario entre entradas, datos y salidas">
      {grid.map((ratio) => {
        const a: [number, number] = [apex[0] + (left[0] - apex[0]) * ratio, apex[1] + (left[1] - apex[1]) * ratio]
        const b: [number, number] = [apex[0] + (right[0] - apex[0]) * ratio, apex[1] + (right[1] - apex[1]) * ratio]
        const c: [number, number] = [left[0] + (right[0] - left[0]) * ratio, left[1]]
        const d: [number, number] = [left[0] + (apex[0] - left[0]) * ratio, left[1] + (apex[1] - left[1]) * ratio]
        return (
          <g key={ratio}>
            <line className="chart-axis" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
            <line className="chart-axis" x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} />
          </g>
        )
      })}
      <polygon
        className="chart-area"
        points={`${apex.join(',')} ${left.join(',')} ${right.join(',')}`}
        fillOpacity={0.12}
      />
      <circle className="chart-dot" cx={point[0]} cy={point[1]} r={8} fill="var(--accent)">
        <title>{`Datos ${formatNumber((datos / total) * 100, 0)}% · Entradas ${formatNumber((entradas / total) * 100, 0)}% · Salidas ${formatNumber((salidas / total) * 100, 0)}%`}</title>
      </circle>
      <line className="chart-axis" x1={point[0]} y1={point[1]} x2={apex[0]} y2={apex[1]} strokeDasharray="2 5" />
      <line className="chart-axis" x1={point[0]} y1={point[1]} x2={left[0]} y2={left[1]} strokeDasharray="2 5" />
      <line className="chart-axis" x1={point[0]} y1={point[1]} x2={right[0]} y2={right[1]} strokeDasharray="2 5" />

      <text className="chart-label" x={apex[0]} y={apex[1] - 16} textAnchor="middle">
        Datos
      </text>
      <text className="chart-sublabel" x={apex[0]} y={apex[1] - 4} textAnchor="middle">
        ALI + AIE · {datos} PF
      </text>
      <text className="chart-label" x={left[0] - 6} y={left[1] + 20} textAnchor="middle">
        Entradas
      </text>
      <text className="chart-sublabel" x={left[0] - 6} y={left[1] + 32} textAnchor="middle">
        EI · {entradas} PF
      </text>
      <text className="chart-label" x={right[0] + 6} y={right[1] + 20} textAnchor="middle">
        Salidas
      </text>
      <text className="chart-sublabel" x={right[0] + 6} y={right[1] + 32} textAnchor="middle">
        EO + EQ · {salidas} PF
      </text>
    </svg>
  )
}

function Bars({ slices }: { slices: TypeSlice[] }) {
  const max = Math.max(...slices.map((slice) => slice.points), 1)
  return (
    <div className="bars" style={{ width: '100%' }}>
      {slices.map((slice) => (
        <div className="bar-row" key={slice.type}>
          <span className="type-pill" style={{ color: TYPE_META[slice.type].hue }}>
            {slice.type}
          </span>
          <span className="bar-track">
            <span
              style={{
                width: `${Math.max((slice.points / max) * 100, slice.points > 0 ? 4 : 0)}%`,
                background: TYPE_META[slice.type].hue,
              }}
            />
          </span>
          <strong className="bar-value">{slice.points} PF</strong>
        </div>
      ))}
    </div>
  )
}

function Donut({ slices }: { slices: TypeSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.points, 0) || 1
  const radius = 88
  const stroke = 34
  const circumference = TAU * radius
  // Se precalculan los desplazamientos para no mutar estado durante el render.
  const arcs = slices.reduce<{ slice: TypeSlice; length: number; offset: number }[]>((acc, slice) => {
    const previous = acc.at(-1)
    const offset = previous ? previous.offset + previous.length : 0
    return [...acc, { slice, length: (slice.points / total) * circumference, offset }]
  }, [])

  return (
    <svg viewBox="0 0 360 296" role="img" aria-label="Proporción de puntos de función por tipo">
      <g transform="translate(180 148) rotate(-90)">
        <circle r={radius} fill="none" stroke="var(--surface-sunk)" strokeWidth={stroke} />
        {arcs.map(({ slice, length, offset }) => (
          <circle
            key={slice.type}
            r={radius}
            fill="none"
            stroke={TYPE_META[slice.type].hue}
            strokeWidth={stroke}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
          >
            <title>{`${slice.type} · ${slice.points} PF`}</title>
          </circle>
        ))}
      </g>
      <text className="chart-label" x={180} y={144} textAnchor="middle" style={{ fontSize: 22 }}>
        {total}
      </text>
      <text className="chart-sublabel" x={180} y={162} textAnchor="middle">
        PF sin ajustar
      </text>
    </svg>
  )
}

export function AnalysisChart({ kind, slices }: { kind: ChartKind; slices: TypeSlice[] }) {
  return (
    <>
      <div className="chart-stage">
        {kind === 'radar' ? <Radar slices={slices} /> : null}
        {kind === 'ternary' ? <Ternary slices={slices} /> : null}
        {kind === 'bars' ? <Bars slices={slices} /> : null}
        {kind === 'donut' ? <Donut slices={slices} /> : null}
      </div>
      <div className="chart-legend">
        {FUNCTION_TYPES.map((type) => (
          <span key={type}>
            <i style={{ background: TYPE_META[type].hue }} />
            {type} · {TYPE_META[type].short}
          </span>
        ))}
      </div>
    </>
  )
}
