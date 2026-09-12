import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, GitBranch, Network, ShieldCheck, SquareKanban, Upload } from 'lucide-react'
import { Field, Kicker } from '../components/ui'

/**
 * Onboarding de tres pasos. Acá viven los conectores: dejaron de ser una sección
 * permanente del sidebar porque solo se tocan al arrancar un proyecto.
 */
export function Onboarding({
  onFinish,
  onOpenImports,
}: {
  onFinish: (project: { name: string; client: string }) => void
  onOpenImports: () => void
}) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('Plataforma Eternum')
  const [client, setClient] = useState('WeFaber')

  const steps = [
    {
      title: 'Bienvenido a OhMyFPA',
      body: (
        <>
          <p className="muted">
            Un workspace local para convertir requisitos en una estimación de punto de función trazable: tipo y
            complejidad, niveles de influencia, duración y costo.
          </p>
          <div className="note">
            <ShieldCheck size={14} />
            <span>
              Zero Data Policy: el análisis se guarda en este navegador. Nada se sube a un servidor. El alcance
              completo está en los términos de uso.
            </span>
          </div>
        </>
      ),
    },
    {
      title: 'Nombrá el proyecto',
      body: (
        <>
          <Field label="Nombre del proyecto">
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
          </Field>
          <Field label="Cliente o área" hint="Opcional. Se usa en el encabezado del análisis.">
            <input className="input" value={client} onChange={(event) => setClient(event.target.value)} />
          </Field>
        </>
      ),
    },
    {
      title: 'Traé tus requisitos',
      body: (
        <>
          <p className="muted">
            Exportá desde tus herramientas y soltá el archivo en Importaciones. La lectura corre en el dispositivo.
          </p>
          <div className="connector-row">
            <span className="tool-row__symbol">
              <GitBranch size={15} />
            </span>
            <span className="connector-row__body">
              <strong>GitHub Issues</strong>
              <span>JSON o CSV exportado del repositorio.</span>
            </span>
          </div>
          <div className="connector-row">
            <span className="tool-row__symbol">
              <SquareKanban size={15} />
            </span>
            <span className="connector-row__body">
              <strong>Trello</strong>
              <span>JSON del tablero con listas y tarjetas.</span>
            </span>
          </div>
          <div className="connector-row">
            <span className="tool-row__symbol">
              <Upload size={15} />
            </span>
            <span className="connector-row__body">
              <strong>Documentos</strong>
              <span>DOCX, PDF, XLSX o Markdown con requisitos IEEE 830.</span>
            </span>
          </div>
        </>
      ),
    },
  ]

  const current = steps[step]
  const last = step === steps.length - 1

  return (
    <div className="onboarding">
      <div className="onboarding__card">
        <div className="panel__head">
          <div>
            <Kicker>Puesta en marcha · {step + 1} de {steps.length}</Kicker>
            <h1>{current.title}</h1>
          </div>
          <span className="brand__mark">
            <Network size={18} />
          </span>
        </div>

        {current.body}

        <div className="modal__foot">
          <span className="onboarding__dots" aria-hidden="true">
            {steps.map((item, index) => (
              <i key={item.title} data-active={index <= step} />
            ))}
          </span>
          <span className="view-head__actions">
            {step > 0 ? (
              <button className="btn btn--ghost" type="button" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={14} />
                Atrás
              </button>
            ) : null}
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => {
                if (!last) {
                  setStep(step + 1)
                  return
                }
                onFinish({ name: name.trim() || 'Proyecto sin nombre', client: client.trim() })
                onOpenImports()
              }}
            >
              {last ? <Check size={14} /> : <ArrowRight size={14} />}
              {last ? 'Empezar' : 'Siguiente'}
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
