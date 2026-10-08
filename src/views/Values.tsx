import { Fragment, useState } from 'react'
import { Info, Library, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { SectionBar } from '../components/SectionBar'
import { Field, Kicker, NumberField } from '../components/ui'
import { COMPLEXITIES, DEFAULT_MATRIX, FUNCTION_TYPES, TYPE_META } from '../lib/fpa'
import type { Complexity, FunctionType, ProjectValues } from '../lib/types'

export function Values({
  values,
  onChange,
  onMatrixChange,
  onResetMatrix,
}: {
  values: ProjectValues
  onChange: (patch: Partial<ProjectValues>) => void
  onMatrixChange: (type: FunctionType, complexity: Complexity, value: number) => void
  onResetMatrix: () => void
}) {
  const [section, setSection] = useState('parametros')
  const dirty = FUNCTION_TYPES.some((type) =>
    COMPLEXITIES.some((level) => values.pointMatrix[type][level] !== DEFAULT_MATRIX[type][level]),
  )

  return (
    <div className="view">
      <SectionBar
        label="Secciones de valores"
        active={section}
        onChange={setSection}
        sections={[
          { id: 'parametros', label: 'Parámetros', icon: <SlidersHorizontal size={13} /> },
          { id: 'matriz', label: 'Matriz IFPUG', icon: <Library size={13} /> },
        ]}
      />

      <header className="view-head">
        <div className="view-head__text">
          <Kicker>Configuración del método</Kicker>
          <h1>Valores FPA</h1>
          <p className="muted">Adaptá la estimación a tu equipo sin perder la referencia base.</p>
        </div>
      </header>

      {section === 'parametros' ? (
        <section className="panel">
          <div className="field-grid">
            <Field label="Horas por punto de función" hint="Multiplica los PF ajustados.">
              <NumberField
                label="Horas por punto de función"
                value={values.hoursPerPoint}
                min={0.1}
                max={40}
                step={0.05}
                suffix="h/PF"
                onChange={(hoursPerPoint) => onChange({ hoursPerPoint })}
              />
            </Field>
            <Field label="Horas por jornada" hint="Convierte horas de equipo en días.">
              <NumberField
                label="Horas por jornada"
                value={values.workdayHours}
                min={1}
                max={16}
                step={0.5}
                suffix="h"
                onChange={(workdayHours) => onChange({ workdayHours })}
              />
            </Field>
            <Field label="Desarrolladores" hint="Divide el esfuerzo total.">
              <NumberField
                label="Desarrolladores"
                value={values.developers}
                min={1}
                max={40}
                onChange={(developers) => onChange({ developers })}
              />
            </Field>
            <Field label="Tarifa por hora" hint="Base del costo de mano de obra.">
              <NumberField
                label="Tarifa por hora"
                value={values.baseRate}
                min={0}
                max={100000}
                step={1}
                suffix={values.currency}
                onChange={(baseRate) => onChange({ baseRate })}
              />
            </Field>
            <Field label="Moneda" hint="Etiqueta usada en los costos.">
              <select
                className="select"
                value={values.currency}
                onChange={(event) => onChange({ currency: event.target.value })}
              >
                <option value="USD">USD</option>
                <option value="UYU">UYU</option>
                <option value="EUR">EUR</option>
                <option value="ARS">ARS</option>
              </select>
            </Field>
            <Field label="Perfil de productividad" hint="Etiqueta visible en el análisis.">
              <input
                className="input"
                value={values.productivityLabel}
                onChange={(event) => onChange({ productivityLabel: event.target.value })}
              />
            </Field>
          </div>
          <div className="note">
            <Info size={14} />
            <span>Los valores se guardan en el almacenamiento local de este navegador, por proyecto.</span>
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="panel__head">
            <div>
              <Kicker>Matriz de pesos</Kicker>
              <h2>Referencia IFPUG CPM</h2>
              <p className="muted">Baseline editable. Cambiar un peso recalcula todas las funciones del proyecto.</p>
            </div>
            {dirty ? (
              <button className="btn btn--ghost btn--sm" type="button" onClick={onResetMatrix}>
                <RotateCcw size={13} />
                Restaurar baseline
              </button>
            ) : null}
          </div>
          <div className="matrix" style={{ gridTemplateColumns: '7rem repeat(3, minmax(0, 1fr))' }}>
            <span className="matrix__head">Tipo</span>
            {COMPLEXITIES.map((level) => (
              <span className="matrix__head" key={level}>
                {level}
              </span>
            ))}
            {FUNCTION_TYPES.map((type) => (
              <Fragment key={type}>
                <span className="matrix__type" style={{ color: TYPE_META[type].hue }}>
                  {type} · {TYPE_META[type].short}
                </span>
                {COMPLEXITIES.map((level) => (
                  <span className="matrix__cell" key={`${type}-${level}`} style={{ padding: '0.25rem' }}>
                    <NumberField
                      label={`Peso ${type} ${level}`}
                      value={values.pointMatrix[type][level]}
                      min={1}
                      max={99}
                      onChange={(value) => onMatrixChange(type, level, value)}
                    />
                  </span>
                ))}
              </Fragment>
            ))}
          </div>
          <div className="note">
            <Library size={14} />
            <span>
              Si el equipo adopta una matriz licenciada o específica del proyecto, reemplazá estos valores y
              documentá la versión en docs/REFERENCE_NOTES.md.
            </span>
          </div>
        </section>
      )}
    </div>
  )
}
