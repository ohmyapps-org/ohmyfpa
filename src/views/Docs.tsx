import { Bot, FileText, ListTodo, LockKeyhole, Network } from 'lucide-react'
import { Kicker } from '../components/ui'

const DOCS: { file: string; hint: string; icon: React.ReactNode }[] = [
  { file: 'ARCHITECTURE.md', hint: 'Componentes, flujo de datos y decisiones offline.', icon: <Network size={16} /> },
  { file: 'DATA_MODEL.md', hint: 'Proyectos, funciones, valores e influencia.', icon: <ListTodo size={16} /> },
  { file: 'PRIVACY.md', hint: 'Zero Data Policy y límites de los conectores.', icon: <LockKeyhole size={16} /> },
  { file: 'MCP_SERVER.md', hint: 'Herramientas AI y ejecución local con Bun.', icon: <Bot size={16} /> },
  { file: 'USER_GUIDE.md', hint: 'Procedimiento de análisis, revisión y exportación.', icon: <FileText size={16} /> },
  { file: 'REFERENCE_NOTES.md', hint: 'Material de referencia y dirección visual.', icon: <FileText size={16} /> },
]

export function Docs() {
  return (
    <div className="view">
      <header className="view-head">
        <div className="view-head__text">
          <Kicker>Documentación del sistema</Kicker>
          <h1>Un análisis entendible por humanos y máquinas</h1>
          <p className="muted">La carpeta docs del repositorio acompaña cada decisión del producto.</p>
        </div>
      </header>

      <section className="panel">
        <div className="doc-list">
          {DOCS.map((doc) => (
            <div className="doc-item" key={doc.file}>
              <span className="tool-row__symbol">{doc.icon}</span>
              <span>
                <strong>{doc.file}</strong>
                <span>{doc.hint}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
