import { useState } from 'react'
import { Banknote, CalendarDays, Plus, Trash2, TrendingUp } from 'lucide-react'
import { SectionBar } from '../components/SectionBar'
import { Kicker, NumberField } from '../components/ui'
import { formatMoney, formatNumber, sumCosts } from '../lib/fpa'
import type { Estimation as EstimationResult } from '../lib/fpa'
import type { CostItem, Project } from '../lib/types'

export function Estimation({
  project,
  estimation,
  onCostsChange,
}: {
  project: Project
  estimation: EstimationResult
  onCostsChange: (costs: CostItem[]) => void
}) {
  const [section, setSection] = useState('duracion')
  const { values } = project
  const months = Math.max(1, Math.ceil(estimation.days / 21))

  function patchCost(id: string, patch: Partial<CostItem>) {
    onCostsChange(values.otherCosts.map((cost) => (cost.id === id ? { ...cost, ...patch } : cost)))
  }

  return (
    <div className="view">
      <SectionBar
        label="Secciones de estimación"
        active={section}
        onChange={setSection}
        sections={[
          { id: 'duracion', label: 'Duración', icon: <CalendarDays size={13} /> },
          { id: 'costos', label: 'Costos', icon: <Banknote size={13} /> },
        ]}
      />

      <header className="view-head">
        <div className="view-head__text">
          <Kicker>Pasos 7 y 8 del método</Kicker>
          <h1>Duración y costo del proyecto</h1>
          <p className="muted">
            Todo se deriva de los {formatNumber(estimation.afp)} PF ajustados: nada acá se carga a mano dos veces.
          </p>
        </div>
      </header>

      {section === 'duracion' ? (
        <div className="split-2">
          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Cálculo de duración</Kicker>
                <h2>Esfuerzo y calendario</h2>
              </div>
              <TrendingUp size={16} className="muted-icon" />
            </div>
            <div className="formula">
              <em>horas =</em> <b>{formatNumber(estimation.afp)}</b> <em>PFA ×</em>{' '}
              <b>{formatNumber(values.hoursPerPoint, 2)}</b> <em>h/PF =</em> <b>{formatNumber(estimation.hours, 0)} h</b>
            </div>
            <div className="formula">
              <em>días =</em> <b>{formatNumber(estimation.hours, 0)}</b> <em>h ÷</em> <b>{values.developers}</b>{' '}
              <em>devs ÷</em> <b>{formatNumber(values.workdayHours, 1)}</b> <em>h/jornada =</em>{' '}
              <b>{formatNumber(estimation.days)} días</b>
            </div>
            <div className="effort-rows">
              <div className="effort-row">
                <span>Esfuerzo total</span>
                <strong>{formatNumber(estimation.hours, 0)} h</strong>
              </div>
              <div className="effort-row">
                <span>Horas por desarrollador</span>
                <strong>{formatNumber(estimation.teamHours, 0)} h</strong>
              </div>
              <div className="effort-row">
                <span>Duración</span>
                <strong>{formatNumber(estimation.days)} días hábiles</strong>
              </div>
              <div className="effort-row">
                <span>Equivalente</span>
                <strong>{formatNumber(estimation.weeks)} semanas · {months} meses</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Trazabilidad</Kicker>
                <h2>De dónde sale el número</h2>
              </div>
            </div>
            <div className="effort-rows">
              <div className="effort-row">
                <span>PF sin ajustar (PFSA)</span>
                <strong>{formatNumber(estimation.ufp, 0)}</strong>
              </div>
              <div className="effort-row">
                <span>Total de niveles de influencia (TDI)</span>
                <strong>{estimation.tdi} / 70</strong>
              </div>
              <div className="effort-row">
                <span>Factor de ajuste (VAF)</span>
                <strong>{formatNumber(estimation.vaf, 2)}</strong>
              </div>
              <div className="effort-row">
                <span>PF ajustados (PFA)</span>
                <strong>{formatNumber(estimation.afp)}</strong>
              </div>
              <div className="effort-row">
                <span>Perfil</span>
                <strong style={{ fontFamily: 'var(--font-sans)' }}>{values.productivityLabel}</strong>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="split-2">
          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Otros costos</Kicker>
                <h2>Implementación del sistema</h2>
                <p className="muted">
                  Dominio, hosting, capacitaciones y todo lo que implique poner el sistema en producción.
                </p>
              </div>
              <button
                className="btn btn--sm"
                type="button"
                onClick={() =>
                  onCostsChange([
                    ...values.otherCosts,
                    { id: `cost-${Date.now()}`, label: 'Nuevo costo', amount: 0, recurring: false },
                  ])
                }
              >
                <Plus size={13} />
                Agregar
              </button>
            </div>

            {values.otherCosts.map((cost) => (
              <div className="cost-row" key={cost.id}>
                <input
                  className="input"
                  value={cost.label}
                  aria-label="Concepto"
                  onChange={(event) => patchCost(cost.id, { label: event.target.value })}
                />
                <NumberField
                  label={`Monto de ${cost.label}`}
                  value={cost.amount}
                  min={0}
                  max={10000000}
                  step={10}
                  suffix={values.currency}
                  onChange={(amount) => patchCost(cost.id, { amount })}
                />
                <button
                  className="btn btn--sm"
                  type="button"
                  aria-pressed={cost.recurring}
                  title={cost.recurring ? 'Mensual: se prorratea por mes de proyecto' : 'Pago único'}
                  onClick={() => patchCost(cost.id, { recurring: !cost.recurring })}
                >
                  {cost.recurring ? 'Mensual' : 'Único'}
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={`Eliminar ${cost.label}`}
                  onClick={() => onCostsChange(values.otherCosts.filter((item) => item.id !== cost.id))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <div className="note">
              <Banknote size={14} />
              <span>
                Los costos mensuales se multiplican por {months} {months === 1 ? 'mes' : 'meses'}, derivados de la
                duración estimada.
              </span>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <div>
                <Kicker>Resultado</Kicker>
                <h2>Costo total estimado</h2>
              </div>
            </div>
            <div className="effort-total">
              <strong>{formatMoney(estimation.totalCost, values.currency)}</strong>
            </div>
            <div className="effort-rows">
              <div className="effort-row">
                <span>Mano de obra</span>
                <strong>{formatMoney(estimation.laborCost, values.currency)}</strong>
              </div>
              <div className="effort-row">
                <span>Otros costos</span>
                <strong>{formatMoney(estimation.otherCost, values.currency)}</strong>
              </div>
              <div className="effort-row">
                <span>Costo por PF ajustado</span>
                <strong>
                  {formatMoney(estimation.totalCost / Math.max(estimation.afp, 1), values.currency)}
                </strong>
              </div>
            </div>
            <div className="formula">
              <em>costo =</em> <b>{formatNumber(estimation.hours, 0)}</b> <em>h ×</em>{' '}
              <b>{formatNumber(values.baseRate, 0)}</b> <em>+</em>{' '}
              <b>{formatNumber(sumCosts(values.otherCosts, estimation.days), 0)}</b>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
