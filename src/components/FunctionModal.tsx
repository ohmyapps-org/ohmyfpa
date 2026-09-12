import { Fragment, useState } from 'react'
import { ExternalLink, GitBranch, Link2, SquareKanban, Trash2 } from 'lucide-react'
import { Field, Modal, NumberField } from './ui'
import { COMPLEXITIES, FUNCTION_TYPES, TYPE_META, deriveComplexity, pointsFor } from '../lib/fpa'
import type { Complexity, FpaFunction, FunctionType, PointMatrix } from '../lib/types'

function sourceBadge(url: string) {
  if (/github\.com/i.test(url)) return { label: 'Ver issue en GitHub', icon: <GitBranch size={13} /> }
  if (/trello\.com/i.test(url)) return { label: 'Ver tarjeta en Trello', icon: <SquareKanban size={13} /> }
  return { label: 'Abrir origen', icon: <Link2 size={13} /> }
}

export function FunctionModal({
  item,
  matrix,
  onSave,
  onDelete,
  onClose,
}: {
  item: FpaFunction
  matrix: PointMatrix
  onSave: (next: FpaFunction) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<FpaFunction>(item)
  const isFile = draft.type === 'ILF' || draft.type === 'EIF'
  const derived = deriveComplexity(draft.type, draft.det, draft.ret, draft.ftr)
  const points = pointsFor(draft.type, draft.complexity, matrix)
  const badge = sourceBadge(draft.sourceUrl)

  function patch(changes: Partial<FpaFunction>) {
    setDraft((current) => {
      const next = { ...current, ...changes }
      const rule = deriveComplexity(next.type, next.det, next.ret, next.ftr)
      const complexity = changes.complexity ?? rule?.complexity ?? next.complexity
      return { ...next, complexity, points: pointsFor(next.type, complexity, matrix) }
    })
  }

  return (
    <Modal
      wide
      kicker={`${draft.id} · ${TYPE_META[draft.type].label}`}
      title={draft.title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--danger btn--sm" type="button" onClick={() => onDelete(draft.id)}>
            <Trash2 size={14} />
            Eliminar función
          </button>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => onSave({ ...draft, points })}
          >
            Guardar cambios
          </button>
        </>
      }
    >
      <p className="muted">{draft.description || TYPE_META[draft.type].description}</p>

      <div className="detail-grid">
        <div className="detail-cell">
          <span>Puntos</span>
          <strong>{points} PF</strong>
        </div>
        <div className="detail-cell">
          <span>Complejidad</span>
          <strong>{draft.complexity}</strong>
        </div>
        <div className="detail-cell">
          <span>Origen</span>
          <strong style={{ fontSize: '0.8125rem' }}>{draft.origin}</strong>
        </div>
        <div className="detail-cell">
          <span>Confianza</span>
          <strong>{draft.confidence}%</strong>
        </div>
      </div>

      <section>
        <p className="kicker" style={{ marginBottom: '0.5rem' }}>
          Cómo se llega al cálculo
        </p>
        <div className="formula">
          <em>peso(</em>
          <b>{draft.type}</b>
          <em>,</em>
          <b>{draft.complexity}</b>
          <em>) =</em>
          <b>{points} PF</b>
        </div>
        <p className="note" style={{ marginTop: '0.5rem' }}>
          <span>
            {derived
              ? `Complejidad derivada de la tabla ${derived.rule.axis} (${derived.rule.bands}). Valores actuales: ${derived.rule.matched}.`
              : `Faltan ${isFile ? 'RET' : 'FTR'} o DET para derivar la complejidad automáticamente; se usa el valor asignado a mano.`}
          </span>
        </p>
      </section>

      <div className="field-grid">
        <Field label="Tipo de función">
          <select
            className="select"
            value={draft.type}
            onChange={(event) => patch({ type: event.target.value as FunctionType })}
          >
            {FUNCTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type} · {TYPE_META[type].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Complejidad" hint={derived ? 'Se recalcula al cambiar DET/RET/FTR' : 'Asignada manualmente'}>
          <select
            className="select"
            value={draft.complexity}
            onChange={(event) => patch({ complexity: event.target.value as Complexity })}
          >
            {COMPLEXITIES.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </Field>
        <Field label="DET" hint="Tipos de dato elementales">
          <NumberField label="DET" value={draft.det} min={0} max={999} onChange={(det) => patch({ det })} />
        </Field>
        {isFile ? (
          <Field label="RET" hint="Tipos de registro">
            <NumberField label="RET" value={draft.ret} min={0} max={99} onChange={(ret) => patch({ ret })} />
          </Field>
        ) : (
          <Field label="FTR" hint="Archivos referenciados">
            <NumberField label="FTR" value={draft.ftr} min={0} max={99} onChange={(ftr) => patch({ ftr })} />
          </Field>
        )}
      </div>

      <section>
        <p className="kicker" style={{ marginBottom: '0.5rem' }}>
          Matriz de pesos aplicada
        </p>
        <div className="matrix">
          <span className="matrix__head">Tipo</span>
          {COMPLEXITIES.map((level) => (
            <span className="matrix__head" key={level}>
              {level}
            </span>
          ))}
          {FUNCTION_TYPES.map((type) => (
            <Fragment key={type}>
              <span className="matrix__type" style={{ color: TYPE_META[type].hue }}>
                {type}
              </span>
              {COMPLEXITIES.map((level) => (
                <span
                  className="matrix__cell"
                  key={`${type}-${level}`}
                  data-active={type === draft.type && level === draft.complexity}
                >
                  {matrix[type][level]}
                </span>
              ))}
            </Fragment>
          ))}
        </div>
      </section>

      <div className="field-grid">
        <Field label="Issue o módulo">
          <input
            className="input"
            value={draft.issue}
            onChange={(event) => setDraft({ ...draft, issue: event.target.value })}
          />
        </Field>
        <Field label="Estado">
          <select
            className="select"
            value={draft.status}
            onChange={(event) => setDraft({ ...draft, status: event.target.value as FpaFunction['status'] })}
          >
            <option>Borrador</option>
            <option>Revisar</option>
            <option>Listo</option>
          </select>
        </Field>
      </div>

      <Field label="Enlace al origen" hint="Issue de GitHub, tarjeta de Trello o documento de requisitos">
        <input
          className="input"
          placeholder="https://github.com/org/repo/issues/12"
          value={draft.sourceUrl}
          onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })}
        />
      </Field>

      {draft.sourceUrl ? (
        <a className="link-out" href={draft.sourceUrl} target="_blank" rel="noreferrer noopener">
          {badge.icon}
          {badge.label}
          <ExternalLink size={12} />
        </a>
      ) : null}
    </Modal>
  )
}
