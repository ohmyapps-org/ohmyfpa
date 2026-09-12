import { Gauge, RefreshCw } from 'lucide-react'
import { Kicker } from '../components/ui'
import { INFLUENCE_FACTORS, INFLUENCE_LEVELS, clampGrade, formatNumber } from '../lib/fpa'
import type { Estimation } from '../lib/fpa'
import type { InfluenceScores } from '../lib/types'

export function Influence({
  influence,
  estimation,
  onChange,
  onReset,
}: {
  influence: InfluenceScores
  estimation: Estimation
  onChange: (id: string, grade: number) => void
  onReset: () => void
}) {
  return (
    <div className="view">
      <header className="view-head">
        <div className="view-head__text">
          <Kicker>Paso 4 y 5 del método</Kicker>
          <h1>Niveles de influencia</h1>
          <p className="muted">
            Calificá de 0 a 5 las 14 características generales del sistema. La suma es el TDI y determina el factor
            de ajuste.
          </p>
        </div>
        <div className="view-head__actions">
          <button className="btn btn--ghost" type="button" onClick={onReset}>
            <RefreshCw size={14} />
            Reiniciar grados
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="vaf-readout">
          <div className="detail-cell">
            <span>TDI</span>
            <strong>
              {estimation.tdi} <small style={{ color: 'var(--ink-faint)' }}>/ 70</small>
            </strong>
          </div>
          <div className="detail-cell">
            <span>VAF</span>
            <strong>{formatNumber(estimation.vaf, 2)}</strong>
          </div>
          <div className="detail-cell">
            <span>PF sin ajustar</span>
            <strong>{formatNumber(estimation.ufp, 0)}</strong>
          </div>
          <div className="detail-cell">
            <span>PF ajustados</span>
            <strong>{formatNumber(estimation.afp)}</strong>
          </div>
        </div>
        <div className="formula">
          <em>VAF =</em> <b>0.65</b> <em>+</em> <b>0.01</b> <em>×</em> <b>{estimation.tdi}</b> <em>=</em>{' '}
          <b>{formatNumber(estimation.vaf, 2)}</b>
          <em>&nbsp;·&nbsp;PFA =</em> <b>{formatNumber(estimation.ufp, 0)}</b> <em>×</em>{' '}
          <b>{formatNumber(estimation.vaf, 2)}</b> <em>=</em> <b>{formatNumber(estimation.afp)}</b>
        </div>
        <div className="meter">
          <span className="meter__track" style={{ height: '0.5rem' }}>
            <span className="meter__fill" style={{ width: `${(estimation.tdi / 70) * 100}%` }} />
          </span>
          <small>{Math.round((estimation.tdi / 70) * 100)}%</small>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <div>
            <Kicker>Características generales</Kicker>
            <h2>Grados de influencia</h2>
          </div>
          <Gauge size={16} className="muted-icon" />
        </div>
        <div className="influence-list">
          {INFLUENCE_FACTORS.map((factor, index) => {
            const grade = clampGrade(influence[factor.id])
            return (
              <div className="influence-row" key={factor.id}>
                <span className="influence-row__text">
                  <strong>
                    {index + 1}. {factor.label}
                  </strong>
                  <span>{factor.description}</span>
                </span>
                <span className="grade-picker" role="group" aria-label={`Grado de ${factor.label}`}>
                  {INFLUENCE_LEVELS.map((level) => (
                    <button
                      key={level.grade}
                      type="button"
                      aria-pressed={grade === level.grade}
                      title={`${level.grade} · ${level.label}: ${level.hint}`}
                      onClick={() => onChange(factor.id, level.grade)}
                    >
                      {level.grade}
                    </button>
                  ))}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
