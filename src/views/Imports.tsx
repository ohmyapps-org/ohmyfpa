import { useRef, useState } from 'react'
import {
  FileInput,
  FileSpreadsheet,
  FileText,
  FileType,
  GitBranch,
  Info,
  LockKeyhole,
  Plug,
  ShieldCheck,
  SquareKanban,
  Upload,
} from 'lucide-react'
import { SectionBar } from '../components/SectionBar'
import { Kicker } from '../components/ui'
import { ACCEPTED_EXTENSIONS } from '../lib/import'

const FORMATS = [
  { ext: 'DOCX', hint: 'Requisitos IEEE 830', icon: <FileType size={16} /> },
  { ext: 'PDF', hint: 'Especificaciones', icon: <FileText size={16} /> },
  { ext: 'XLSX', hint: 'Planillas de relevamiento', icon: <FileSpreadsheet size={16} /> },
  { ext: 'CSV', hint: 'Exports tabulares', icon: <FileSpreadsheet size={16} /> },
  { ext: 'JSON', hint: 'GitHub Issues · Trello', icon: <GitBranch size={16} /> },
  { ext: 'MD / TXT', hint: 'Notas y borradores', icon: <FileText size={16} /> },
]

const CONNECTORS = [
  {
    name: 'GitHub Issues',
    icon: <GitBranch size={15} />,
    hint: 'Export de issues en JSON o CSV. El enlace del issue queda guardado en cada función.',
  },
  {
    name: 'Trello',
    icon: <SquareKanban size={15} />,
    hint: 'Export del tablero en JSON. Las listas se mapean al campo issue.',
  },
  {
    name: 'IFPUG CPM',
    icon: <ShieldCheck size={15} />,
    hint: 'Matriz de pesos editable en Valores FPA. No se descarga nada desde ifpug.org.',
  },
]

export function Imports({
  onFiles,
  busy,
  lastNotes,
}: {
  onFiles: (files: FileList) => void
  busy: boolean
  lastNotes: string[]
}) {
  const [section, setSection] = useState('archivos')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="view">
      <SectionBar
        label="Secciones de importación"
        active={section}
        onChange={setSection}
        sections={[
          { id: 'archivos', label: 'Archivos', icon: <Upload size={13} /> },
          { id: 'conectores', label: 'Conectores', icon: <Plug size={13} /> },
        ]}
      />

      <header className="view-head">
        <div className="view-head__text">
          <Kicker>Ingesta local</Kicker>
          <h1>Importaciones</h1>
          <p className="muted">
            Todo el procesamiento corre en este dispositivo. Ningún archivo sale del navegador.
          </p>
        </div>
      </header>

      {section === 'archivos' ? (
        <div className="imports">
          <section className="panel">
            <div
              className="dropzone"
              data-active={dragging}
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                if (event.dataTransfer.files.length) onFiles(event.dataTransfer.files)
              }}
            >
              <span className="dropzone__icon">
                <FileInput size={24} />
              </span>
              <div>
                <h2>Arrastrá los requisitos acá</h2>
                <p className="muted">DOCX, PDF, XLSX, CSV, JSON, Markdown o texto plano.</p>
              </div>
              <button
                className="btn btn--primary"
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={15} />
                {busy ? 'Procesando…' : 'Elegir archivos'}
              </button>
              <input
                ref={inputRef}
                className="visually-hidden"
                type="file"
                multiple
                accept={ACCEPTED_EXTENSIONS.join(',')}
                onChange={(event) => {
                  if (event.target.files?.length) onFiles(event.target.files)
                  event.target.value = ''
                }}
              />
            </div>

            {lastNotes.length ? (
              <div className="note">
                <Info size={14} />
                <span>{lastNotes.join(' · ')}</span>
              </div>
            ) : null}
          </section>

          <aside className="overview-side">
            <section className="panel">
              <div className="panel__head">
                <div>
                  <Kicker>Formatos soportados</Kicker>
                  <h2>Parsers locales</h2>
                </div>
              </div>
              <div className="format-grid">
                {FORMATS.map((format) => (
                  <div className="format-card" key={format.ext}>
                    <span className="muted-icon">{format.icon}</span>
                    <span>
                      <strong>{format.ext}</strong>
                      <span>{format.hint}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="note">
                <LockKeyhole size={14} />
                <span>
                  Los parsers de PDF, DOCX y XLSX se cargan bajo demanda y se ejecutan en el navegador. Sin subidas,
                  sin tokens, sin telemetría.
                </span>
              </div>
            </section>

            <section className="panel">
              <div className="panel__head">
                <div>
                  <Kicker>Flujo</Kicker>
                  <h2>De requisito a PF</h2>
                </div>
              </div>
              <div className="pipeline pipeline--stacked">
                {[
                  ['01', 'Importar', 'Leer el archivo local y conservar su origen.'],
                  ['02', 'Clasificar', 'Asignar EI, EO, EQ, ALI o AIE con reglas semánticas.'],
                  ['03', 'Revisar', 'Confirmar DET, RET/FTR y complejidad en el detalle.'],
                ].map(([num, title, detail]) => (
                  <div className="pipeline__step" key={num}>
                    <span className="pipeline__num">{num}</span>
                    <span className="pipeline__body">
                      <strong>{title}</strong>
                      <span>{detail}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <section className="panel">
          <div className="panel__head">
            <div>
              <Kicker>Conectores</Kicker>
              <h2>Fuentes compatibles</h2>
              <p className="muted">
                La sincronización en vivo queda fuera del build offline: el camino soportado es exportar local,
                importar local, revisar local.
              </p>
            </div>
          </div>
          {CONNECTORS.map((connector) => (
            <div className="connector-row" key={connector.name}>
              <span className="tool-row__symbol">{connector.icon}</span>
              <span className="connector-row__body">
                <strong>{connector.name}</strong>
                <span>{connector.hint}</span>
              </span>
              <span className="status">local</span>
            </div>
          ))}
          <div className="note">
            <ShieldCheck size={14} />
            <span>Zero Data Policy activa: sin tokens OAuth, sin cookies de terceros, sin llamadas externas.</span>
          </div>
        </section>
      )}
    </div>
  )
}
