import { useState } from 'react'
import {
  BarChart3,
  Calculator,
  ChevronRight,
  CircleDot,
  Clock3,
  Donut,
  Layers3,
  Radar,
  Triangle,
  Users,
} from 'lucide-react'
import { AnalysisChart } from '../components/AnalysisChart'
import type { ChartKind, TypeSlice } from '../components/AnalysisChart'
import { Kicker, NumberField, Segmented } from '../components/ui'
import { formatNumber } from '../lib/fpa'
import type { Estimation } from '../lib/fpa'
import type { Project, ViewId } from '../lib/types'

const CHART_OPTIONS: { value: ChartKind; label: string; icon: React.ReactNode }[] = [
  { value: 'radar', label: 'Radar', icon: <Radar size={13} /> },
  { value: 'ternary', label: 'Ternario', icon: <Triangle size={13} /> },
  { value: 'bars', label: 'Barras', icon: <BarChart3 size={13} /> },
  { value: 'donut', label: 'Anillo', icon: <Donut size={13} /> },
]

function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
}) {
  return (
    <article className="metric">
      <span className="metric__icon">{icon}</span>
      <span className="metric__body">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </span>
    </article>
  )
}

export function Overview({
  project,
  slices,
  estimation,
  onDevelopersChange,
  onNavigate,
}: {
  project: Project
  slices: TypeSlice[]
  estimation: Estimation
  onDevelopersChange: (value: number) => void
  onNavigate: (view: ViewId) => void
}) {
  const [chart, setChart] = useState<ChartKind>('radar')
  const ready = project.functions.filter((item) => item.status === 'Listo').length
  const coverage = Math.round((ready / Math.max(project.functions.length, 1)) * 100)

  const steps: { step: string; title: string; detail: string; view: ViewId; done: boolean }[] = [
    {
      step: '1',
      title: 'Requisitos funcionales',
      detail: String(project.functions.length),
      view: 'imports',
      done: project.functions.length > 0,
    },
    { step: '2', title: 'Tipo y complejidad', detail: `${ready} listos`, view: 'functions', done: ready > 0 },
    {
      step: '3',
      title: 'PF sin ajustar',
      detail: `${formatNumber(estimation.ufp, 0)} PFSA`,
      view: 'values',
      done: estimation.ufp > 0,
    },
    {
      step: '4',
      title: 'Niveles de influencia',
      detail: `TDI ${estimation.tdi}`,
      view: 'influence',
      done: estimation.tdi > 0,
    },
    {
      step: '5',
      title: 'Factor de ajuste',
      detail: `VAF ${formatNumber(estimation.vaf, 2)}`,
      view: 'influence',
      done: estimation.tdi > 0,
    },
    {
      step: '6',
      title: 'PF ajustados',
      detail: `${formatNumber(estimation.afp)} PFA`,
      view: 'estimation',
      done: estimation.afp > 0,
    },
    {
      step: '7',
      title: 'Duración',
      detail: `${formatNumber(estimation.days)} días`,
      view: 'estimation',
      done: estimation.days > 0,
    },
    {
      step: '8',
      title: 'Costo estimado',
      detail: `${project.values.currency} ${formatNumber(estimation.totalCost, 0)}`,
      view: 'estimation',
      done: estimation.totalCost > 0,
    },
  ]

  return (
    <div className="view">
      <header className="view-head">
        <div className="view-head__text">
          <Kicker>Function point analysis · {project.name}</Kicker>
          <h1>Estimación ajustada del proyecto</h1>
        </div>
      </header>

      <section className="metrics">
        <Metric
          label="PF sin ajustar"
          value={formatNumber(estimation.ufp, 0)}
          detail={`${project.functions.length} funciones`}
          icon={<Calculator size={17} />}
        />
        <Metric
          label="PF ajustados"
          value={formatNumber(estimation.afp)}
          detail={`VAF ${formatNumber(estimation.vaf, 2)} · TDI ${estimation.tdi}`}
          icon={<Layers3 size={17} />}
        />
        <Metric
          label="Esfuerzo"
          value={`${formatNumber(estimation.hours, 0)} h`}
          detail={`${formatNumber(estimation.days)} días de equipo`}
          icon={<Clock3 size={17} />}
        />
        <Metric
          label="Cobertura"
          value={`${coverage}%`}
          detail={`${project.functions.length - ready} sin validar`}
          icon={<CircleDot size={17} />}
        />
      </section>

      <div className="overview">
        <section className="panel chart-panel">
          <div className="panel__head">
            <div>
              <Kicker>Mapa del análisis</Kicker>
              <h2>Distribución por tipo de función</h2>
            </div>
            <Segmented value={chart} options={CHART_OPTIONS} onChange={setChart} label="Tipo de visualización" />
          </div>
          <AnalysisChart kind={chart} slices={slices} />
        </section>

        <aside className="overview-side">
          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Planificación</Kicker>
                <h2>Esfuerzo y equipo</h2>
              </div>
              <Users size={16} className="muted-icon" />
            </div>
            <div className="effort-total">
              <strong>{formatNumber(estimation.hours, 0)}</strong>
              <span className="muted">horas totales</span>
            </div>
            <div className="effort-rows">
              <div className="effort-row">
                <span>Desarrolladores</span>
                <div style={{ width: '6.5rem' }}>
                  <NumberField
                    label="Desarrolladores"
                    value={project.values.developers}
                    min={1}
                    max={40}
                    onChange={onDevelopersChange}
                  />
                </div>
              </div>
              <div className="effort-row">
                <span>Duración</span>
                <strong>{formatNumber(estimation.days)} días</strong>
              </div>
              <div className="effort-row">
                <span>Semanas hábiles</span>
                <strong>{formatNumber(estimation.weeks)}</strong>
              </div>
              <div className="effort-row">
                <span>Productividad</span>
                <strong>{formatNumber(project.values.hoursPerPoint, 2)} h/PF</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Método</Kicker>
                <h2>Pipeline de estimación</h2>
              </div>
            </div>
            <div className="pipeline">
              {steps.map((item) => (
                <button
                  key={item.step}
                  className="pipeline__step"
                  type="button"
                  data-done={item.done}
                  onClick={() => onNavigate(item.view)}
                >
                  <span className="pipeline__num">{item.step}</span>
                  <span className="pipeline__body">{item.title}</span>
                  <span className="pipeline__detail">{item.detail}</span>
                  <ChevronRight size={14} className="muted-icon" />
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
